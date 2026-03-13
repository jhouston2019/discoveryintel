import { Queue, Worker, Job } from 'bullmq';
import { DocumentProcessor } from './documentProcessor';
import { AnalysisOrchestrator } from './ai/analysisOrchestrator';

const connection = {
  host: process.env.REDIS_URL?.replace('redis://', '') || 'localhost',
  port: 6379,
};

export const documentQueue = new Queue('document-processing', { connection });
export const analysisQueue = new Queue('case-analysis', { connection });

const documentProcessor = new DocumentProcessor();
const analysisOrchestrator = new AnalysisOrchestrator();

export const documentWorker = new Worker(
  'document-processing',
  async (job: Job) => {
    const { documentId, filePath, fileType } = job.data;
    console.log(`Processing document ${documentId}`);
    await documentProcessor.processDocument(documentId, filePath, fileType);
  },
  { connection }
);

export const analysisWorker = new Worker(
  'case-analysis',
  async (job: Job) => {
    const { caseId } = job.data;
    console.log(`Running analysis for case ${caseId}`);
    await analysisOrchestrator.runFullAnalysis(caseId);
  },
  { connection }
);

documentWorker.on('completed', (job) => {
  console.log(`Document processing completed: ${job.id}`);
});

documentWorker.on('failed', (job, err) => {
  console.error(`Document processing failed: ${job?.id}`, err);
});

analysisWorker.on('completed', (job) => {
  console.log(`Analysis completed: ${job.id}`);
});

analysisWorker.on('failed', (job, err) => {
  console.error(`Analysis failed: ${job?.id}`, err);
});
