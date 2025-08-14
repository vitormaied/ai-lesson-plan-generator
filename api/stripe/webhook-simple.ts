import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { dbConnect, UserModel } from '../_db_mongo.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in .env.local');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Webhook received:', req.method);
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not set in .env.local');
    }
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    console.log('Event verified:', event.type);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }

  // Handle the event 
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', {
          id: session.id,
          customer: session.customer,
          subscription: session.subscription,
          client_reference_id: session.client_reference_id
        });
        
        // Fazer upgrade do usuário após pagamento por cartão
        if (session.client_reference_id) {
          try {
            await dbConnect();
            const user = await UserModel.findOne({ id: session.client_reference_id });
            
            if (user) {
              // Para pagamento por cartão, também criar com expiração de 30 dias
              const expirationDate = new Date();
              expirationDate.setDate(expirationDate.getDate() + 30);
              
              user.subscription = {
                plan: 'Personal',
                planGenerations: -1, // Ilimitado
                expiresAt: expirationDate.toISOString(),
                isActive: true,
                stripeId: session.subscription ? session.subscription.toString() : undefined
              };
              
              await user.save();
              console.log(`[Stripe Card] User ${user.email} upgraded to Personal plan (expires: ${expirationDate.toISOString()})`);
            } else {
              console.log(`[Stripe Card] User not found: ${session.client_reference_id}`);
            }
          } catch (error) {
            console.error(`[Stripe Card] Error upgrading user: ${error}`);
          }
        }
        
        console.log(`Payment successful for user: ${session.client_reference_id}`);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment Intent succeeded:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          payment_method_types: paymentIntent.payment_method_types,
          metadata: paymentIntent.metadata
        });

        // Se foi um pagamento PIX, processar o upgrade
        if (paymentIntent.payment_method_types.includes('pix')) {
          console.log(`PIX payment successful for user: ${paymentIntent.metadata.userId}`);
          // Aqui você poderia atualizar o usuário no banco de dados
          // await upgradeUserToPlan(paymentIntent.metadata.userId, paymentIntent.metadata.plan);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment Intent failed:', {
          id: failedPayment.id,
          last_payment_error: failedPayment.last_payment_error,
          metadata: failedPayment.metadata
        });
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    console.log('Webhook processed successfully');
    res.status(200).json({ received: true });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error handling webhook event:', errorMessage);
    res.status(500).json({ error: 'Webhook handler failed.', details: errorMessage });
  }
}