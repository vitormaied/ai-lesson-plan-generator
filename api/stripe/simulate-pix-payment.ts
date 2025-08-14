import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  // Só funciona em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Simulation only available in development' });
  }

  const { paymentIntentId, userId } = req.body;

  if (!paymentIntentId || !paymentIntentId.includes('test_pix')) {
    return res.status(400).json({ message: 'Invalid payment intent ID for simulation' });
  }

  try {
    console.log(`[PIX Simulation] Simulating successful payment for: ${paymentIntentId}`);
    
    // Se userId foi fornecido, fazer o upgrade do usuário
    if (userId) {
      await dbConnect();
      const user = await UserModel.findOne({ id: userId });
      
      if (user) {
        // Calcular data de expiração (30 dias a partir de agora)
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        
        user.subscription = {
          plan: 'Personal',
          planGenerations: -1, // Ilimitado para plano Personal
          expiresAt: expirationDate.toISOString(),
          isActive: true,
        };
        await user.save();
        console.log(`[PIX Simulation] User ${user.email} upgraded to Personal plan (expires: ${expirationDate.toISOString()})`);
      } else {
        console.log(`[PIX Simulation] User not found: ${userId}`);
      }
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Pagamento PIX simulado com sucesso!',
      paymentIntentId: paymentIntentId,
      userId: userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PIX Simulation] Error:', errorMessage);
    return res.status(500).json({ 
        message: 'Erro na simulação do pagamento PIX.',
        error: errorMessage 
    });
  }
}