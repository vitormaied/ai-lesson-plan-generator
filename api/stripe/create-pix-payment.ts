import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
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
    // Verificar se PIX está disponível na conta
    console.log('[PIX] Attempting to create PIX payment for:', customerEmail);
    
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

    // Tentar criar o Payment Intent para PIX
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: priceId.includes('Personal') ? 1990 : 14700, // Personal: R$ 19,90, School: R$ 147,00
        currency: 'brl',
        customer: customer.id,
        payment_method_types: ['pix'],
        metadata: {
          userId: userId,
          priceId: priceId,
          plan: priceId.includes('Personal') ? 'Personal' : 'School'
        },
        payment_method_options: {
          pix: {
            expires_after_seconds: 86400 // 24 horas
          }
        }
      });
    } catch (pixError: any) {
      // Se PIX não estiver disponível, retornar erro específico
      if (pixError.message && pixError.message.includes('pix')) {
        return res.status(400).json({ 
          message: 'PIX não está habilitado para esta conta. Entre em contato com o suporte.',
          error: 'PIX_NOT_ENABLED',
          details: pixError.message || 'PIX error'
        });
      }
      throw pixError;
    }

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