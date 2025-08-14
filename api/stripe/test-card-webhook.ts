import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    // Só funciona em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Testing endpoint only available in development' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'userId é obrigatório' });
    }

    try {
        console.log(`[Test Card Webhook] Simulating card payment success for user: ${userId}`);
        
        await dbConnect();
        const user = await UserModel.findOne({ id: userId });
        
        if (user) {
            // Para pagamento por cartão, também criar com expiração de 30 dias
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);
            
            user.subscription = {
                plan: 'Personal',
                planGenerations: -1, // Ilimitado
                expiresAt: expirationDate.toISOString(),
                isActive: true,
                stripeId: 'test_subscription_123'
            };
            
            await user.save();
            console.log(`[Test Card Webhook] User ${user.email} upgraded to Personal plan (expires: ${expirationDate.toISOString()})`);
            
            return res.status(200).json({ 
                success: true,
                message: 'Pagamento por cartão simulado com sucesso!',
                userId: userId,
                expiresAt: expirationDate.toISOString()
            });
        } else {
            console.log(`[Test Card Webhook] User not found: ${userId}`);
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Test Card Webhook] Error:', errorMessage);
        return res.status(500).json({ 
            message: 'Erro ao simular pagamento por cartão.',
            error: errorMessage 
        });
    }
}