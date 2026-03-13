import express from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

const createCaseSchema = z.object({
  case_name: z.string().min(1),
  description: z.string().optional()
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { data: cases, error } = await supabaseAdmin
      .from('cases')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch cases', 500);
    }

    res.json({ cases });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { case_name, description } = createCaseSchema.parse(req.body);

    const { data: newCase, error } = await supabaseAdmin
      .from('cases')
      .insert({
        user_id: req.userId,
        case_name,
        description
      })
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to create case', 500);
    }

    res.status(201).json({ case: newCase });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data: caseData, error } = await supabaseAdmin
      .from('cases')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !caseData) {
      throw new AppError('Case not found', 404);
    }

    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('case_id', id)
      .order('upload_date', { ascending: false });

    res.json({
      case: caseData,
      documents: documents || []
    });
  } catch (error) {
    next(error);
  }
});

export default router;
