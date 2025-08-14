
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo.js';
import type { SubscriptionPlan } from '../../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    // For now, we'll hardcode the upgrade to the 'Personal' plan.
    // In a real app, this would be determined by the payment flow.
    const targetPlan: SubscriptionPlan = 'Personal';

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
    }

    await dbConnect();

    try {
        const user = await UserModel.findOne({ id: userId });

        if (user) {
            user.subscription = {
                plan: targetPlan,
                planGenerations: 50, // Example limit for Personal plan
            };
            await user.save();
            console.log(`[API] User ${user.email} upgraded to ${targetPlan}`);
            const userObject = user.toObject();
            delete userObject.password;
            return res.status(200).json({ success: true, user: userObject });
        } else {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('[API] Upgrade error:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
}
