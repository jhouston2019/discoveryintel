import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

export class DocumentParser {
  async parseDocument(filePath: string, fileType: string): Promise<string> {
    const extension = fileType.toLowerCase();

    if (extension === 'pdf' || extension === 'application/pdf') {
      return this.parsePDF(filePath);
    } else if (extension === 'docx' || extension === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return this.parseDOCX(filePath);
    } else if (extension === 'txt' || extension === 'text/plain') {
      return this.parseTXT(filePath);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async parsePDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      if (data.text && data.text.trim().length > 100) {
        return data.text;
      }

      console.log('PDF has minimal text, attempting OCR...');
      return this.runOCR(filePath);
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF');
    }
  }

  private async parseDOCX(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error('Failed to parse DOCX');
    }
  }

  private async parseTXT(filePath: string): Promise<string> {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error('TXT parsing error:', error);
      throw new Error('Failed to parse TXT');
    }
  }

  private async runOCR(filePath: string): Promise<string> {
    try {
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
        logger: info => console.log(info)
      });
      return text;
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error('Failed to run OCR');
    }
  }

  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      const chunk = text.substring(startIndex, endIndex);
      chunks.push(chunk.trim());
      startIndex += chunkSize - overlap;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }
}
