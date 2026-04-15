declare module 'pdf-parse' {
  function pdfParse(
    data: Buffer,
    options?: { max?: number }
  ): Promise<{ text: string; numpages: number; info?: unknown; metadata?: unknown }>;
  export = pdfParse;
}
