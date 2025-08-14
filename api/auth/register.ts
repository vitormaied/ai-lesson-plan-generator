
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
    }

    await dbConnect();

    try {
        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Este e-mail já está em uso.' });
        }

        const newUser = new UserModel({
            id: crypto.randomUUID(), // Generate a unique ID for the frontend
            name: name,
            email: email,
            password: password,
            isAdmin: false,
            usageCount: 0,
            subscription: { plan: 'Free', planGenerations: 2 }
        });

        await newUser.save();
        
        console.log(`[API] Registration successful for: ${newUser.email}`);
        // Return a sanitized user object (without password)
        const userObject = newUser.toObject();
        delete userObject.password;
        return res.status(201).json({ success: true, user: userObject });
    } catch (error) {
        console.error('[API] Registration error:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor durante o registro.' });
    }
}
