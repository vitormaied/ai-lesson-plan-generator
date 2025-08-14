import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../../_db_mongo.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { userIdToRemove, teamId } = req.body;

    if (!userIdToRemove || !teamId) {
        return res.status(400).json({ message: 'userIdToRemove and teamId are required' });
    }

    // In a real app, you would also verify that the requesting user is the admin of the teamId.

    await dbConnect();

    try {
        const userToRemove = await UserModel.findOne({ id: userIdToRemove });

        if (!userToRemove) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        if (userToRemove.teamId !== teamId) {
            return res.status(403).json({ success: false, message: 'Usuário não pertence a esta equipe.' });
        }

        // Remove user from team and revert subscription to Free
        userToRemove.teamId = undefined; // Or set to null, depending on how you want to handle it
        userToRemove.subscription = { plan: 'Free', planGenerations: 5 }; // Revert to Free plan
        userToRemove.usageCount = 0; // Reset usage count for the Free plan
        await userToRemove.save();

        console.log(`[API] User ${userToRemove.email} removed from team ${teamId}.`);
        const userObject = userToRemove.toObject();
        delete userObject.password;
        return res.status(200).json({ success: true, user: userObject });
    } catch (error) {
        console.error('[API] Remove member error:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
}