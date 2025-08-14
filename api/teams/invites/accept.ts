import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel, InviteModel } from '../../_db_mongo.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { token, email } = req.body;

    if (!token || !email) {
        return res.status(400).json({ message: 'Token and email are required' });
    }

    await dbConnect();

    try {
        const invite = await InviteModel.findOne({ token, email });

        if (!invite) {
            return res.status(404).json({ success: false, message: 'Convite inválido ou expirado.' });
        }

        if (new Date(invite.expiresAt) < new Date()) {
            await InviteModel.deleteOne({ _id: invite._id }); // Remove expired invite
            return res.status(400).json({ success: false, message: 'Convite expirado.' });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            // This case should ideally not happen if the user registered via the invite link
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        // Assign user to the team and update their subscription to School plan
        user.teamId = invite.teamId;
        user.subscription = { plan: 'School', planGenerations: 1000, teamMemberLimit: 10 }; // Hardcoded for now
        await user.save();

        await InviteModel.deleteOne({ _id: invite._id }); // Remove invite after acceptance

        console.log(`[API] User ${user.email} accepted invite to team ${user.teamId}`);
        const userObject = user.toObject();
        delete userObject.password;
        return res.status(200).json({ success: true, user: userObject });
    } catch (error) {
        console.error('[API] Accept invite error:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
}