import OpenAI from 'openai';
import { supabaseAdmin } from '../../db/supabase';
import { EvidenceSignal } from '@discoveryintel/shared';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class EvidenceExtractor {
  async extractEvidenceSignals(caseId: string): Promise<EvidenceSignal[]> {
    try {
      const { data: documents } = await supabaseAdmin
        .from('documents')
        .select('id, filename')
        .eq('case_id', caseId)
        .eq('processing_status', 'completed');

      if (!documents || documents.length === 0) {
        return [];
      }

      const allSignals: EvidenceSignal[] = [];

      for (const doc of documents) {
        const { data: chunks } = await supabaseAdmin
          .from('document_chunks')
          .select('chunk_text')
          .eq('document_id', doc.id)
          .limit(40);

        if (!chunks || chunks.length === 0) continue;

        const documentText = chunks.map(c => c.chunk_text).join('\n\n');

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a legal analyst extracting key evidence signals from discovery documents.
Identify:
- Internal admissions of fault or liability
- Inconsistent reports or statements
- Suspicious communications or timing
- Timeline gaps or unexplained delays
- Attempts to conceal information
- Contradictory technical findings

Return a JSON object:
{"signals": [{"signal_type": "admission|inconsistency|suspicious_communication|timeline_gap|other", "description": "...", "importance": "critical|high|medium|low", "page_reference": "..."}]}

Focus on evidence that could significantly impact the case.`
            },
            {
              role: 'user',
              content: `Analyze this document for evidence signals:\n\nDocument: ${doc.filename}\n\n${documentText.substring(0, 10000)}`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        });

        const result = JSON.parse(completion.choices[0].message.content || '{"signals": []}');
        const signals = result.signals || [];

        signals.forEach((signal: any) => {
          allSignals.push({
            id: uuidv4(),
            signal_type: signal.signal_type || 'other',
            description: signal.description,
            document_source: doc.filename,
            document_id: doc.id,
            page_reference: signal.page_reference,
            importance: signal.importance || 'medium'
          });
        });
      }

      allSignals.sort((a, b) => {
        const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return importanceOrder[a.importance] - importanceOrder[b.importance];
      });

      await supabaseAdmin
        .from('analysis_results')
        .insert({
          case_id: caseId,
          analysis_type: 'evidence',
          result_json: { signals: allSignals }
        });

      return allSignals;
    } catch (error) {
      console.error('Evidence extraction error:', error);
      throw error;
    }
  }
}
