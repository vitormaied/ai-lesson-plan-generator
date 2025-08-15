import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests allowed' });
    }

    // In a real app, you would get the user's teamId from their authenticated session.
    // For now, we'll get it from the query string for simplicity.
    const { teamId } = req.query;

    if (!teamId || typeof teamId !== 'string') {
        return res.status(400).json({ message: 'teamId is required' });
    }

    await dbConnect();

    try {
        const members = await UserModel.find({ teamId }, { password: 0 });
        return res.status(200).json(members);
    } catch (error) {
        console.error('[API] Team members fetch error:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
}