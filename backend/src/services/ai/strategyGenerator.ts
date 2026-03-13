import OpenAI from 'openai';
import { supabaseAdmin } from '../../db/supabase';
import { CaseStrategy } from '@discoveryintel/shared';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class StrategyGenerator {
  async generateCaseStrategy(caseId: string): Promise<CaseStrategy> {
    try {
      const { data: documents } = await supabaseAdmin
        .from('documents')
        .select('id, filename')
        .eq('case_id', caseId)
        .eq('processing_status', 'completed');

      if (!documents || documents.length === 0) {
        throw new Error('No completed documents found');
      }

      const { data: analysisResults } = await supabaseAdmin
        .from('analysis_results')
        .select('analysis_type, result_json')
        .eq('case_id', caseId);

      const contextParts: string[] = [];

      if (analysisResults) {
        analysisResults.forEach(result => {
          contextParts.push(`\n--- ${result.analysis_type.toUpperCase()} ---`);
          contextParts.push(JSON.stringify(result.result_json, null, 2).substring(0, 3000));
        });
      }

      const sampleChunks: string[] = [];
      for (const doc of documents.slice(0, 5)) {
        const { data: chunks } = await supabaseAdmin
          .from('document_chunks')
          .select('chunk_text')
          .eq('document_id', doc.id)
          .limit(10);

        if (chunks) {
          sampleChunks.push(`\nDocument: ${doc.filename}\n${chunks.map(c => c.chunk_text).join('\n').substring(0, 2000)}`);
        }
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a senior litigation strategist analyzing a case.
Based on all available evidence and analysis, provide a comprehensive case strategy.

Return a JSON object:
{
  "case_strengths": ["strength 1", "strength 2", ...],
  "case_weaknesses": ["weakness 1", "weakness 2", ...],
  "key_leverage_points": ["leverage point 1", "leverage point 2", ...],
  "potential_defense_narrative": "description of likely defense strategy",
  "recommended_actions": ["action 1", "action 2", ...]
}

Be strategic, specific, and actionable.`
          },
          {
            role: 'user',
            content: `Analyze this case and generate a litigation strategy.\n\nPrevious Analysis:\n${contextParts.join('\n')}\n\nSample Documents:\n${sampleChunks.join('\n\n')}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      const strategy = JSON.parse(completion.choices[0].message.content || '{}') as CaseStrategy;

      await supabaseAdmin
        .from('analysis_results')
        .insert({
          case_id: caseId,
          analysis_type: 'strategy',
          result_json: strategy
        });

      return strategy;
    } catch (error) {
      console.error('Strategy generation error:', error);
      throw error;
    }
  }
}
