import { supabaseAdmin } from '../db/supabase';
import { EmbeddingService } from './embeddingService';
import { SearchResult } from '@discoveryintel/shared';

export class VectorSearchService {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  async searchDocuments(
    caseId: string,
    query: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      const { data, error } = await supabaseAdmin.rpc('search_document_chunks', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: 0.7,
        match_count: limit,
        target_case_id: caseId
      });

      if (error) {
        console.error('Vector search error:', error);
        throw new Error('Vector search failed');
      }

      return data.map((item: any) => ({
        document_id: item.document_id,
        document_name: item.document_name,
        chunk_text: item.chunk_text,
        similarity_score: item.similarity,
        page_reference: item.page_reference
      }));
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  async getRelevantChunks(
    caseId: string,
    query: string,
    limit: number = 20
  ): Promise<string[]> {
    const results = await this.searchDocuments(caseId, query, limit);
    return results.map(r => r.chunk_text);
  }
}
