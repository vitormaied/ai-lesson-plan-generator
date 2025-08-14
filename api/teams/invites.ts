import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel, TeamModel, InviteModel } from '../_db_mongo';
import type { Invite } from '../../types';
import { randomBytes } from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { teamId, email } = req.body;

    if (!teamId || !email) {
        return res.status(400).json({ message: 'teamId and email are required' });
    }

    await dbConnect();

    try {
        const team = await TeamModel.findOne({ id: teamId });
        if (!team) {
            return res.status(404).json({ message: 'Equipe não encontrada.' });
        }

        // Check if user is already in the team
        const existingUser = await UserModel.findOne({ email });
        if (existingUser && existingUser.teamId === teamId) {
            return res.status(409).json({ message: 'Usuário já pertence a esta equipe.' });
        }

        // Check team member limit
        const members = await UserModel.find({ teamId });
        if (members.length >= (team.memberLimit || 0)) {
            return res.status(403).json({ message: 'O limite de membros para esta equipe foi atingido.' });
        }

        // Create a new invite
        const token = randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

        const newInvite = new InviteModel({
            id: `inv-${randomBytes(8).toString('hex')}`,
            teamId,
            email,
            token,
            expiresAt
        });

        await newInvite.save();

        console.log(`[API] Invite created for ${email} to join team ${teamId}. Token: ${token}`);
        // In a real app, you would now send an email to the user with the invite link.

        return res.status(201).json({ success: true, message: `Convite enviado para ${email}.` });
    } catch (error) {
        console.error('[API] Invite creation error:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
}