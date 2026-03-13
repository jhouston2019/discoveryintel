import express from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { VectorSearchService } from '../services/vectorSearch';

const router = express.Router();
router.use(authenticate);

const searchSchema = z.object({
  caseId: z.string().uuid(),
  query: z.string().min(1),
  limit: z.number().optional().default(10)
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { caseId, query, limit } = searchSchema.parse(req.body);

    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('cases')
      .select('user_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData || caseData.user_id !== req.userId) {
      throw new AppError('Case not found or unauthorized', 404);
    }

    const searchService = new VectorSearchService();
    const results = await searchService.searchDocuments(caseId, query, limit);

    res.json({ results });
  } catch (error) {
    next(error);
  }
});

export default router;
