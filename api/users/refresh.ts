import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ 
            success: false, 
            message: 'userId is required' 
        });
    }

    try {
        await dbConnect();

        const user = await UserModel.findOne({ id: userId }).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        console.log(`[API] User ${user.email} data refreshed - Plan: ${user.subscription.plan}, Generations: ${user.subscription.planGenerations}`);
        
        return res.status(200).json({ 
            success: true, 
            user: user.toObject(),
            message: 'User data refreshed successfully'
        });

    } catch (error) {
        console.error('[API] Refresh user error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
}