import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { priceId, userId, customerEmail, customerName } = req.body;

  if (!priceId || !userId || !customerEmail) {
    return res.status(400).json({ message: 'priceId, userId e customerEmail são obrigatórios' });
  }

  try {
    console.log('[PIX SIMULATION] Creating PIX payment for:', customerEmail);
    
    // Simulate PIX payment creation
    const amount = priceId.includes('Personal') ? 1990 : 14700; // Personal: R$ 19,90, School: R$ 147,00
    const plan = priceId.includes('Personal') ? 'Personal' : 'School';
    
    // Generate a fake PIX code and QR code data
    const pixCode = generatePixCode(amount, customerEmail);
    const paymentId = `pix_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // In a real implementation, you would store this payment intent in your database
    // For now, we'll just return the simulation data
    
    return res.status(200).json({ 
      success: true,
      paymentId: paymentId,
      pixCode: pixCode,
      qrCodeData: `00020126580014br.gov.bcb.pix0136${pixCode}52040000530398654${String(amount).padStart(4, '0')}5802BR5925${customerName || 'AI Lesson Plan'}6009SAO PAULO62070503***6304`,
      amount: amount,
      currency: 'BRL',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      plan: plan,
      instructions: [
        '1. Abra o app do seu banco',
        '2. Escolha a opção PIX',
        '3. Escaneie o QR Code ou copie o código PIX',
        '4. Confirme o pagamento',
        '5. Aguarde a confirmação automática'
      ]
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PIX SIMULATION] Error creating payment:', errorMessage);
    return res.status(500).json({ 
        message: 'Erro ao criar pagamento PIX.',
        error: errorMessage 
    });
  }
}

function generatePixCode(amount: number, email: string): string {
  // Generate a fake PIX code for simulation
  const timestamp = Date.now().toString();
  const hash = Buffer.from(`${email}${amount}${timestamp}`).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  return `${hash}${timestamp.slice(-6)}`;
}