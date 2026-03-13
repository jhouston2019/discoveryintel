import OpenAI from 'openai';
import { supabaseAdmin } from '../../db/supabase';
import { TimelineEvent } from '@discoveryintel/shared';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class TimelineGenerator {
  async generateTimeline(caseId: string): Promise<TimelineEvent[]> {
    try {
      const { data: documents } = await supabaseAdmin
        .from('documents')
        .select('id, filename')
        .eq('case_id', caseId)
        .eq('processing_status', 'completed');

      if (!documents || documents.length === 0) {
        return [];
      }

      const allEvents: TimelineEvent[] = [];

      for (const doc of documents) {
        const { data: chunks } = await supabaseAdmin
          .from('document_chunks')
          .select('chunk_text')
          .eq('document_id', doc.id)
          .limit(50);

        if (!chunks || chunks.length === 0) continue;

        const combinedText = chunks.map(c => c.chunk_text).join('\n\n');

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a legal analyst extracting timeline events from discovery documents. 
Extract all events with dates mentioned in the document. 
Return a JSON array of events with this structure:
[{"date": "YYYY-MM-DD or descriptive date", "event": "description", "confidence": 0.0-1.0}]

Only include events that have clear date references. Be precise and factual.`
            },
            {
              role: 'user',
              content: `Extract timeline events from this document:\n\n${combinedText.substring(0, 12000)}`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        });

        const result = JSON.parse(completion.choices[0].message.content || '{"events": []}');
        const events = result.events || [];

        events.forEach((event: any) => {
          allEvents.push({
            date: event.date,
            event: event.event,
            document_source: doc.filename,
            document_id: doc.id,
            confidence: event.confidence || 0.8
          });
        });
      }

      allEvents.sort((a, b) => {
        const dateA = this.parseDate(a.date);
        const dateB = this.parseDate(b.date);
        return dateA.getTime() - dateB.getTime();
      });

      await supabaseAdmin
        .from('analysis_results')
        .insert({
          case_id: caseId,
          analysis_type: 'timeline',
          result_json: { events: allEvents }
        });

      return allEvents;
    } catch (error) {
      console.error('Timeline generation error:', error);
      throw error;
    }
  }

  private parseDate(dateStr: string): Date {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return new Date(0);
  }
}
