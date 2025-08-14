import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('📧 Webhook test received!');
  console.log('Method:', req.method);
  console.log('Headers:', Object.keys(req.headers));
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed');
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    console.log('✅ Processing webhook...');
    
    // Just return success without any complex processing
    console.log('🎉 Webhook processed successfully');
    res.status(200).json({ 
      received: true,
      timestamp: new Date().toISOString(),
      message: 'Test webhook working!'
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ 
      error: 'Webhook failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}