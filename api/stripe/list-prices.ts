import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  try {
    // List all products
    const products = await stripe.products.list({ active: true });
    
    // List all prices
    const prices = await stripe.prices.list({ active: true });
    
    // Combine products with their prices
    const productData = products.data.map(product => {
      const productPrices = prices.data.filter(price => price.product === product.id);
      return {
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
        },
        prices: productPrices.map(price => ({
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
          type: price.type
        }))
      };
    });

    return res.status(200).json({
      products: productData,
      environment: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'live',
      keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...',
      debug: {
        hasKey: !!process.env.STRIPE_SECRET_KEY,
        keyLength: process.env.STRIPE_SECRET_KEY?.length
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Stripe API] Error listing products:', errorMessage);
    return res.status(500).json({ 
      message: 'Error listing products.',
      error: errorMessage 
    });
  }
}