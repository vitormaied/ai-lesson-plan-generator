import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { priceId, userId } = req.body;

  if (!priceId || !userId) {
    return res.status(400).json({ message: 'priceId and userId are required' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.VERCEL_URL || 'http://localhost:5174'}/#/app?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VERCEL_URL || 'http://localhost:5174'}/#/app?payment=cancelled`,
      client_reference_id: userId, // Pass the userId to the session
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Stripe API] Error creating checkout session:', errorMessage);
    return res.status(500).json({ 
        message: 'Error creating checkout session.',
        error: errorMessage 
    });
  }
}