import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests allowed' });
    }

    // In a real app, you would protect this endpoint,
    // ensuring only authenticated admin users can access it.

    await dbConnect();

    try {
        const totalUsers = await UserModel.countDocuments();
        const premiumUsers = await UserModel.countDocuments({ "subscription.plan": { $ne: "Free" } });
        const plansGeneratedResult = await UserModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsage: { $sum: "$usageCount" }
                }
            }
        ]);

        const plansGenerated = plansGeneratedResult.length > 0 ? plansGeneratedResult[0].totalUsage : 0;

        const stats = {
            totalUsers,
            premiumUsers,
            plansGenerated,
        };

        return res.status(200).json(stats);
    } catch (error) {
        console.error('[API] Admin stats error:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
}