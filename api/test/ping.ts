import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return res.status(200).json({ 
      success: true, 
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: req.headers,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        hasMongoURI: !!process.env.MONGODB_URI,
        mongoURIPrefix: process.env.MONGODB_URI?.substring(0, 20) + '...'
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
}