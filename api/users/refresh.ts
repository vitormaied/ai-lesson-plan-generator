import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo.js';
import { checkAndUpdateExpiredSubscriptions } from '../utils/subscription-checker.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'userId é obrigatório' });
    }

    await dbConnect();

    try {
        // Verificar se a assinatura está expirada antes de retornar os dados
        const { user: updatedUser, wasExpired } = await checkAndUpdateExpiredSubscriptions(userId);

        if (updatedUser) {
            if (wasExpired) {
                console.log(`[API] Subscription expired during refresh for: ${updatedUser.email}`);
            }
            
            console.log(`[API] User data refreshed for: ${updatedUser.email}`);
            const userObject = updatedUser.toObject();
            delete userObject.password;
            return res.status(200).json({ success: true, user: userObject, message: 'Dados atualizados com sucesso' });
        } else {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }
    } catch (error) {
        console.error('[API] Refresh error:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
}