import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo';

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
        const user = await UserModel.findOne({ id: userId });

        if (user) {
            console.log(`[API] User data refreshed for: ${user.email}`);
            const userObject = user.toObject();
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