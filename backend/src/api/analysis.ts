import express from 'express';
import { supabaseAdmin } from '../db/supabase';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AnalysisOrchestrator } from '../services/ai/analysisOrchestrator';

const router = express.Router();
router.use(authenticate);

const verifyUserOwnsCase = async (caseId: string, userId: string): Promise<boolean> => {
  const { data, error } = await supabaseAdmin
    .from('cases')
    .select('user_id')
    .eq('id', caseId)
    .single();

  return !error && data && data.user_id === userId;
};

const getAnalysisResult = async (caseId: string, analysisType: string) => {
  const { data, error } = await supabaseAdmin
    .from('analysis_results')
    .select('result_json')
    .eq('case_id', caseId)
    .eq('analysis_type', analysisType)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.result_json;
};

router.post('/:caseId/run', async (req: AuthRequest, res, next) => {
  try {
    const { caseId } = req.params;

    const hasAccess = await verifyUserOwnsCase(caseId, req.userId!);
    if (!hasAccess) {
      throw new AppError('Case not found or unauthorized', 404);
    }

    const orchestrator = new AnalysisOrchestrator();
    
    setImmediate(async () => {
      try {
        await orchestrator.runFullAnalysis(caseId);
      } catch (error) {
        console.error('Background analysis error:', error);
      }
    });

    res.json({ message: 'Analysis started', case_id: caseId });
  } catch (error) {
    next(error);
  }
});

router.get('/:caseId/timeline', async (req: AuthRequest, res, next) => {
  try {
    const { caseId } = req.params;

    const hasAccess = await verifyUserOwnsCase(caseId, req.userId!);
    if (!hasAccess) {
      throw new AppError('Case not found or unauthorized', 404);
    }

    const result = await getAnalysisResult(caseId, 'timeline');
    res.json(result || { events: [] });
  } catch (error) {
    next(error);
  }
});

router.get('/:caseId/contradictions', async (req: AuthRequest, res, next) => {
  try {
    const { caseId } = req.params;

    const hasAccess = await verifyUserOwnsCase(caseId, req.userId!);
    if (!hasAccess) {
      throw new AppError('Case not found or unauthorized', 404);
    }

    const result = await getAnalysisResult(caseId, 'contradictions');
    res.json(result || { contradictions: [] });
  } catch (error) {
    next(error);
  }
});

router.get('/:caseId/impeachment', async (req: AuthRequest, res, next) => {
  try {
    const { caseId } = req.params;

    const hasAccess = await verifyUserOwnsCase(caseId, req.userId!);
    if (!hasAccess) {
      throw new AppError('Case not found or unauthorized', 404);
    }

    const result = await getAnalysisResult(caseId, 'impeachment');
    res.json(result || { opportunities: [] });
  } catch (error) {
    next(error);
  }
});

router.get('/:caseId/evidence', async (req: AuthRequest, res, next) => {
  try {
    const { caseId } = req.params;

    const hasAccess = await verifyUserOwnsCase(caseId, req.userId!);
    if (!hasAccess) {
      throw new AppError('Case not found or unauthorized', 404);
    }

    const result = await getAnalysisResult(caseId, 'evidence');
    res.json(result || { signals: [] });
  } catch (error) {
    next(error);
  }
});

router.get('/:caseId/deposition', async (req: AuthRequest, res, next) => {
  try {
    const { caseId } = req.params;

    const hasAccess = await verifyUserOwnsCase(caseId, req.userId!);
    if (!hasAccess) {
      throw new AppError('Case not found or unauthorized', 404);
    }

    const result = await getAnalysisResult(caseId, 'deposition');
    res.json(result || { analyses: [] });
  } catch (error) {
    next(error);
  }
});

router.get('/:caseId/strategy', async (req: AuthRequest, res, next) => {
  try {
    const { caseId } = req.params;

    const hasAccess = await verifyUserOwnsCase(caseId, req.userId!);
    if (!hasAccess) {
      throw new AppError('Case not found or unauthorized', 404);
    }

    const result = await getAnalysisResult(caseId, 'strategy');
    res.json(result || {});
  } catch (error) {
    next(error);
  }
});

export default router;
