
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
    }

    await dbConnect();

    try {
        const user = await UserModel.findOne({ id: userId });

        if (user) {
            const { subscription, usageCount } = user;
            const limit = subscription.planGenerations;

            if (usageCount >= limit) {
                return res.status(403).json({
                    success: false,
                    message: 'Você atingiu o limite de gerações de planos para sua assinatura.'
                });
            }

            user.usageCount += 1;
            await user.save();
            console.log(`[API] New usage count for ${user.email}: ${user.usageCount}`);
            return res.status(200).json({ success: true });

        } else {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('[API] Increment usage error:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
}
