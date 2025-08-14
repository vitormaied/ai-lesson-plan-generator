
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    await dbConnect();

    try {
        const user = await UserModel.findOne({ email });

        if (!user) {
            console.log(`[API] Login failed for: ${email} - User not found`);
            return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }

        const isMatch = await user.comparePassword(password as string);

        if (isMatch) {
            console.log(`[API] Login successful for: ${user.email}`);
            
            // Return a sanitized user object (without password)
            const userObject = user.toObject();
            delete userObject.password;
            return res.status(200).json({ success: true, user: userObject });
        } else {
            console.log(`[API] Login failed for: ${email} - Incorrect password`);
            return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
    } catch (error) {
        console.error('[API] Login error:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor durante o login.' });
    }
}
