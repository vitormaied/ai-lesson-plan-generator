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
        const users = await UserModel.find({}, { password: 0 }); // Exclude password field
        return res.status(200).json(users);
    } catch (error) {
        console.error('[API] Admin users error:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
}