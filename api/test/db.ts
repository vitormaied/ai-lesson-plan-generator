import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dbConnect, UserModel } from '../_db_mongo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[TEST] Testing database connection...');
    
    await dbConnect();
    console.log('[TEST] Database connected successfully');
    
    const userCount = await UserModel.countDocuments();
    console.log(`[TEST] Found ${userCount} users in database`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Database connection successful!',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TEST] Database connection failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.stack
    });
  }
}