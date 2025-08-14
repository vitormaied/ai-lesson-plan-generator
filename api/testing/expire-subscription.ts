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

    await dbConnect();

    try {
        const user = await UserModel.findOne({ id: userId });

        if (user && user.subscription) {
            // Definir data de expiração para 1 dia atrás
            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - 1);
            
            user.subscription.expiresAt = expiredDate.toISOString();
            await user.save();
            
            console.log(`[Testing] Forced expiration for user: ${user.email}`);
            return res.status(200).json({ 
                success: true, 
                message: 'Assinatura forçada a expirar',
                expiresAt: expiredDate.toISOString()
            });
        } else {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }
    } catch (error) {
        console.error('[Testing] Expire subscription error:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
}