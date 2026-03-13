import { supabaseAdmin } from '../db/supabase';
import { DocumentParser } from './documentParser';
import { EmbeddingService } from './embeddingService';
import fs from 'fs';

export class DocumentProcessor {
  private parser: DocumentParser;
  private embeddingService: EmbeddingService;

  constructor() {
    this.parser = new DocumentParser();
    this.embeddingService = new EmbeddingService();
  }

  async processDocument(documentId: string, filePath: string, fileType: string): Promise<void> {
    try {
      await this.updateDocumentStatus(documentId, 'processing');

      const text = await this.parser.parseDocument(filePath, fileType);

      const chunks = this.parser.chunkText(text);

      const embeddings = await this.embeddingService.generateEmbeddings(chunks);

      const chunksToInsert = chunks.map((chunk, index) => ({
        document_id: documentId,
        chunk_text: chunk,
        chunk_index: index,
        embedding_vector: JSON.stringify(embeddings[index])
      }));

      const { error: insertError } = await supabaseAdmin
        .from('document_chunks')
        .insert(chunksToInsert);

      if (insertError) {
        throw new Error(`Failed to insert chunks: ${insertError.message}`);
      }

      await this.updateDocumentStatus(documentId, 'completed');

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      console.error(`Document processing error for ${documentId}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateDocumentStatus(documentId, 'failed', errorMessage);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      throw error;
    }
  }

  private async updateDocumentStatus(
    documentId: string,
    status: string,
    error?: string
  ): Promise<void> {
    const updateData: any = { processing_status: status };
    if (error) {
      updateData.processing_error = error;
    }

    await supabaseAdmin
      .from('documents')
      .update(updateData)
      .eq('id', documentId);
  }
}
