import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { buffer } from 'micro';
import dotenv from 'dotenv';
import path from 'path';
import { dbConnect, UserModel } from '../_db_mongo.js'; // Import your DB connection and User model

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

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
    bodyParser: false, // Required for webhook signature verification
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }

  // --- Handle the event --- 
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.client_reference_id;
        const stripeSubscriptionId = session.subscription ? String(session.subscription) : undefined; // Ensure it's a string or undefined

        if (!userId) {
          throw new Error('client_reference_id is missing from the Stripe session.');
        }

        // Connect to the database
        await dbConnect();

        // Update the user in the database using findOneAndUpdate with the custom 'id' field
        await UserModel.findOneAndUpdate({ id: userId }, {
          $set: {
            'subscription.plan': 'Personal', // Or dynamically determine from session line items
            'subscription.status': 'active',
            'subscription.stripeId': stripeSubscriptionId,
          },
        });

        console.log(`Successfully updated subscription for user ${userId}`);
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await dbConnect();
        await UserModel.findOneAndUpdate({'subscription.stripeId': subscription.id}, {
            $set: {
                'subscription.plan': 'Free', 
                'subscription.status': 'cancelled'
            }
        });
        console.log(`Successfully cancelled subscription for user with stripeId ${subscription.id}`);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error handling webhook event:', errorMessage);
    res.status(500).json({ error: 'Webhook handler failed.', details: errorMessage });
  }
}