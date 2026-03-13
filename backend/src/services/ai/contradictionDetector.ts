import OpenAI from 'openai';
import { supabaseAdmin } from '../../db/supabase';
import { Contradiction } from '@discoveryintel/shared';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class ContradictionDetector {
  async detectContradictions(caseId: string): Promise<Contradiction[]> {
    try {
      const { data: documents } = await supabaseAdmin
        .from('documents')
        .select('id, filename')
        .eq('case_id', caseId)
        .eq('processing_status', 'completed');

      if (!documents || documents.length < 2) {
        return [];
      }

      const documentTexts: { [key: string]: { text: string; filename: string } } = {};

      for (const doc of documents) {
        const { data: chunks } = await supabaseAdmin
          .from('document_chunks')
          .select('chunk_text')
          .eq('document_id', doc.id)
          .limit(30);

        if (chunks && chunks.length > 0) {
          documentTexts[doc.id] = {
            text: chunks.map(c => c.chunk_text).join('\n\n'),
            filename: doc.filename
          };
        }
      }

      const contradictions: Contradiction[] = [];

      const docIds = Object.keys(documentTexts);
      for (let i = 0; i < docIds.length; i++) {
        for (let j = i + 1; j < docIds.length; j++) {
          const docA = docIds[i];
          const docB = docIds[j];

          const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content: `You are a legal analyst detecting contradictions between documents.
Analyze both documents and identify any contradictory statements, conflicting facts, or inconsistent timelines.
Return a JSON object with this structure:
{"contradictions": [{"statement_a": "...", "statement_b": "...", "severity": "high|medium|low", "explanation": "..."}]}

Only include genuine contradictions, not minor differences in wording.`
              },
              {
                role: 'user',
                content: `Document A (${documentTexts[docA].filename}):\n${documentTexts[docA].text.substring(0, 6000)}\n\n---\n\nDocument B (${documentTexts[docB].filename}):\n${documentTexts[docB].text.substring(0, 6000)}\n\nIdentify contradictions between these documents.`
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3
          });

          const result = JSON.parse(completion.choices[0].message.content || '{"contradictions": []}');
          const foundContradictions = result.contradictions || [];

          foundContradictions.forEach((c: any) => {
            contradictions.push({
              id: uuidv4(),
              statement_a: c.statement_a,
              statement_b: c.statement_b,
              source_a: documentTexts[docA].filename,
              source_b: documentTexts[docB].filename,
              document_id_a: docA,
              document_id_b: docB,
              severity: c.severity || 'medium',
              explanation: c.explanation
            });
          });
        }
      }

      await supabaseAdmin
        .from('analysis_results')
        .insert({
          case_id: caseId,
          analysis_type: 'contradictions',
          result_json: { contradictions }
        });

      return contradictions;
    } catch (error) {
      console.error('Contradiction detection error:', error);
      throw error;
    }
  }
}
