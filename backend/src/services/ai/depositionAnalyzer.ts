import OpenAI from 'openai';
import { supabaseAdmin } from '../../db/supabase';
import { DepositionAnalysis, DepositionFinding } from '@discoveryintel/shared';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class DepositionAnalyzer {
  async analyzeDepositions(caseId: string): Promise<DepositionAnalysis[]> {
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
        d.filename.toLowerCase().includes('transcript') ||
        d.filename.toLowerCase().includes('testimony')
      );

      if (depositionDocs.length === 0) {
        return [];
      }

      const analyses: DepositionAnalysis[] = [];

      for (const doc of depositionDocs) {
        const { data: chunks } = await supabaseAdmin
          .from('document_chunks')
          .select('chunk_text')
          .eq('document_id', doc.id)
          .limit(50);

        if (!chunks || chunks.length === 0) continue;

        const transcriptText = chunks.map(c => c.chunk_text).join('\n\n');

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a legal analyst reviewing deposition transcripts.
Identify:
1. Key admissions - statements that admit fault, liability, or damaging facts
2. Contradictions - statements that conflict with other testimony or evidence
3. Evasive answers - non-responsive answers, memory lapses, or deflections

Return a JSON object:
{
  "witness": "witness name",
  "key_admissions": [{"page_reference": "...", "statement": "...", "analysis": "...", "significance": "high|medium|low"}],
  "contradictions": [{"page_reference": "...", "statement": "...", "analysis": "...", "significance": "high|medium|low"}],
  "evasive_answers": [{"page_reference": "...", "statement": "...", "analysis": "...", "significance": "high|medium|low"}]
}

Be specific and cite page references when possible.`
            },
            {
              role: 'user',
              content: `Analyze this deposition transcript:\n\nDocument: ${doc.filename}\n\n${transcriptText.substring(0, 12000)}`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');

        if (result.witness) {
          analyses.push({
            id: uuidv4(),
            witness: result.witness,
            key_admissions: result.key_admissions || [],
            contradictions: result.contradictions || [],
            evasive_answers: result.evasive_answers || [],
            document_id: doc.id
          });
        }
      }

      await supabaseAdmin
        .from('analysis_results')
        .insert({
          case_id: caseId,
          analysis_type: 'deposition',
          result_json: { analyses }
        });

      return analyses;
    } catch (error) {
      console.error('Deposition analysis error:', error);
      throw error;
    }
  }
}
