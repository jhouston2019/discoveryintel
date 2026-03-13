import OpenAI from 'openai';
import { supabaseAdmin } from '../../db/supabase';
import { ImpeachmentOpportunity } from '@discoveryintel/shared';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class ImpeachmentFinder {
  async findImpeachmentOpportunities(caseId: string): Promise<ImpeachmentOpportunity[]> {
    try {
      const { data: documents } = await supabaseAdmin
        .from('documents')
        .select('id, filename')
        .eq('case_id', caseId)
        .eq('processing_status', 'completed');

      if (!documents || documents.length === 0) {
        return [];
      }

      const depositionDocs = documents.filter(d => 
        d.filename.toLowerCase().includes('deposition') || 
        d.filename.toLowerCase().includes('transcript')
      );

      const evidenceDocs = documents.filter(d => 
        !d.filename.toLowerCase().includes('deposition') && 
        !d.filename.toLowerCase().includes('transcript')
      );

      if (depositionDocs.length === 0 || evidenceDocs.length === 0) {
        return [];
      }

      const opportunities: ImpeachmentOpportunity[] = [];

      for (const depDoc of depositionDocs) {
        const { data: depChunks } = await supabaseAdmin
          .from('document_chunks')
          .select('chunk_text')
          .eq('document_id', depDoc.id)
          .limit(40);

        if (!depChunks || depChunks.length === 0) continue;

        const depositionText = depChunks.map(c => c.chunk_text).join('\n\n');

        for (const evDoc of evidenceDocs) {
          const { data: evChunks } = await supabaseAdmin
            .from('document_chunks')
            .select('chunk_text')
            .eq('document_id', evDoc.id)
            .limit(30);

          if (!evChunks || evChunks.length === 0) continue;

          const evidenceText = evChunks.map(c => c.chunk_text).join('\n\n');

          const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content: `You are a legal analyst identifying impeachment opportunities.
Analyze the deposition testimony and compare it with the evidence document.
Find statements made by witnesses that are contradicted by documentary evidence.
Return a JSON object:
{"opportunities": [{"witness": "name", "statement": "...", "contradicting_evidence": "...", "strength": "high|medium|low", "page_reference": "..."}]}

Focus on material contradictions that could impeach witness credibility.`
              },
              {
                role: 'user',
                content: `Deposition (${depDoc.filename}):\n${depositionText.substring(0, 6000)}\n\n---\n\nEvidence (${evDoc.filename}):\n${evidenceText.substring(0, 6000)}\n\nIdentify impeachment opportunities.`
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3
          });

          const result = JSON.parse(completion.choices[0].message.content || '{"opportunities": []}');
          const foundOpportunities = result.opportunities || [];

          foundOpportunities.forEach((opp: any) => {
            opportunities.push({
              id: uuidv4(),
              witness: opp.witness,
              statement: opp.statement,
              contradicting_evidence: opp.contradicting_evidence,
              document_source: evDoc.filename,
              document_id: evDoc.id,
              page_reference: opp.page_reference,
              strength: opp.strength || 'medium'
            });
          });
        }
      }

      await supabaseAdmin
        .from('analysis_results')
        .insert({
          case_id: caseId,
          analysis_type: 'impeachment',
          result_json: { opportunities }
        });

      return opportunities;
    } catch (error) {
      console.error('Impeachment finder error:', error);
      throw error;
    }
  }
}
