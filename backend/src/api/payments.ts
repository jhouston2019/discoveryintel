import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

const checkoutBodySchema = z.object({
  caseId: z.string().min(1),
});

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new AppError('Stripe is not configured', 500);
  }
  return new Stripe(key);
}

router.post('/create-checkout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { caseId } = checkoutBodySchema.parse(req.body);

    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('cases')
      .select('id, user_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData || caseData.user_id !== req.userId) {
      throw new AppError('Case not found or unauthorized', 404);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Case analysis',
              description: 'One-time AI litigation intelligence analysis',
            },
            unit_amount: 49900,
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/cases/${caseId}?payment=success`,
      cancel_url: `${frontendUrl}/cases/${caseId}?payment=cancelled`,
      metadata: {
        caseId,
      },
    });

    if (!session.url) {
      throw new AppError('Failed to create checkout session', 500);
    }

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

export async function paymentsWebhookHandler(req: Request, res: Response): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    res.status(500).send('Webhook not configured');
    return;
  }

  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    res.status(400).send('Missing stripe-signature');
    return;
  }

  let event;
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      res.status(500).send('Stripe not configured');
      return;
    }
    if (!Buffer.isBuffer(req.body)) {
      res.status(400).send('Webhook body must be raw');
      return;
    }
    const stripe = new Stripe(key);
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { caseId?: string } };
    const caseId = session.metadata?.caseId;
    if (caseId) {
      const { error } = await supabaseAdmin
        .from('cases')
        .update({ analysis_paid: true })
        .eq('id', caseId);
      if (error) {
        console.error('Failed to mark case paid:', error);
      }
    }
  }

  res.json({ received: true });
}

export default router;
