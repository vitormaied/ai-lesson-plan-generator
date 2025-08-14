import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Test webhook endpoint called');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Body:', req.body);
    return res.status(200).json({ 
      message: 'Test webhook received successfully',
      timestamp: new Date().toISOString(),
      body: req.body 
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return res.status(500).json({ error: 'Test webhook failed' });
  }
}