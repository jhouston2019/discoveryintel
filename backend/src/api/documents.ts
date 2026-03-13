import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../db/supabase';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { DocumentProcessor } from '../services/documentProcessor';
import { AnalysisOrchestrator } from '../services/ai/analysisOrchestrator';

const router = express.Router();
router.use(authenticate);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/msword'
    ];
    
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.match(/\.(pdf|docx|txt|doc)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

router.post('/upload', upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const { caseId } = req.body;

    if (!caseId) {
      throw new AppError('Case ID is required', 400);
    }

    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('cases')
      .select('id, user_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData || caseData.user_id !== req.userId) {
      throw new AppError('Case not found or unauthorized', 404);
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const fileName = `${caseId}/${uuidv4()}-${req.file.originalname}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('discovery-documents')
      .upload(fileName, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      fs.unlinkSync(req.file.path);
      throw new AppError('Failed to upload file to storage', 500);
    }

    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        case_id: caseId,
        filename: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        storage_path: fileName,
        processing_status: 'pending'
      })
      .select()
      .single();

    if (docError) {
      throw new AppError('Failed to create document record', 500);
    }

    setImmediate(async () => {
      try {
        const processor = new DocumentProcessor();
        await processor.processDocument(document.id, req.file!.path, req.file!.mimetype);

        const { data: allDocs } = await supabaseAdmin
          .from('documents')
          .select('processing_status')
          .eq('case_id', caseId);

        const allCompleted = allDocs?.every(d => d.processing_status === 'completed');

        if (allCompleted && allDocs && allDocs.length > 0) {
          console.log(`All documents processed for case ${caseId}, running analysis...`);
          const orchestrator = new AnalysisOrchestrator();
          await orchestrator.runFullAnalysis(caseId);
        }
      } catch (error) {
        console.error('Background processing error:', error);
      }
    });

    res.status(201).json({
      document_id: document.id,
      filename: document.filename,
      status: document.processing_status
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

router.get('/:caseId', async (req: AuthRequest, res, next) => {
  try {
    const { caseId } = req.params;

    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('cases')
      .select('id, user_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData || caseData.user_id !== req.userId) {
      throw new AppError('Case not found or unauthorized', 404);
    }

    const { data: documents, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('case_id', caseId)
      .order('upload_date', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch documents', 500);
    }

    res.json({ documents: documents || [] });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/status', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .select('id, processing_status, processing_error, case_id')
      .eq('id', id)
      .single();

    if (error || !document) {
      throw new AppError('Document not found', 404);
    }

    const { data: caseData } = await supabaseAdmin
      .from('cases')
      .select('user_id')
      .eq('id', document.case_id)
      .single();

    if (!caseData || caseData.user_id !== req.userId) {
      throw new AppError('Unauthorized', 403);
    }

    res.json({
      status: document.processing_status,
      error: document.processing_error
    });
  } catch (error) {
    next(error);
  }
});

export default router;
