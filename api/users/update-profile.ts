import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { userId, name } = req.body;

    if (!userId || !name) {
        return res.status(400).json({ message: 'UserId e nome são obrigatórios' });
    }

    if (name.trim().length < 2) {
        return res.status(400).json({ message: 'O nome deve ter pelo menos 2 caracteres' });
    }

    await dbConnect();

    try {
        const updatedUser = await UserModel.findOneAndUpdate(
            { id: userId },
            { $set: { name: name.trim() } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        console.log(`[API] Profile updated for user: ${updatedUser.email}`);
        
        // Return sanitized user object (without password)
        const userObject = updatedUser.toObject();
        delete userObject.password;
        
        return res.status(200).json({ 
            success: true, 
            user: userObject,
            message: 'Nome atualizado com sucesso'
        });
    } catch (error) {
        console.error('[API] Profile update error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor ao atualizar perfil' 
        });
    }
}