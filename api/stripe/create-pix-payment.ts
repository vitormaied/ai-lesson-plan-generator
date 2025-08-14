import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { priceId, userId, customerEmail, customerName } = req.body;

  if (!priceId || !userId || !customerEmail) {
    return res.status(400).json({ message: 'priceId, userId e customerEmail são obrigatórios' });
  }

  try {
    // Em ambiente de desenvolvimento, simular resposta PIX
    if (process.env.NODE_ENV !== 'production') {
      console.log('[PIX Simulation] Creating simulated PIX payment for development');
      
      const simulatedPaymentIntent = {
        id: `pi_test_pix_${Date.now()}`,
        client_secret: `pi_test_pix_${Date.now()}_secret_test`,
        amount: 1990, // R$ 19,90 em centavos
        currency: 'brl'
      };

      return res.status(200).json({ 
        paymentIntentId: simulatedPaymentIntent.id,
        clientSecret: simulatedPaymentIntent.client_secret,
        amount: simulatedPaymentIntent.amount,
        currency: simulatedPaymentIntent.currency,
        isSimulation: true
      });
    }

    // Código de produção para Stripe real
    // Primeiro criar um customer no Stripe se não existir
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName || customerEmail.split('@')[0],
        metadata: {
          userId: userId
        }
      });
    }

    // Criar o Payment Intent para PIX
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1990, // R$ 19,90 em centavos (ajustar conforme o plano)
      currency: 'brl',
      customer: customer.id,
      payment_method_types: ['pix'],
      metadata: {
        userId: userId,
        priceId: priceId,
        plan: priceId.includes('Personal') ? 'Personal' : 'School'
      },
      // PIX expira em 24 horas por padrão
      payment_method_options: {
        pix: {
          expires_after_seconds: 86400 // 24 horas
        }
      }
    });

    return res.status(200).json({ 
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Stripe PIX] Error creating payment intent:', errorMessage);
    return res.status(500).json({ 
        message: 'Erro ao criar pagamento PIX.',
        error: errorMessage 
    });
  }
}