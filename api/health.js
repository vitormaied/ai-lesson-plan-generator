export default function handler(req, res) {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: Date.now(),
    method: req.method,
    environment: process.env.NODE_ENV || 'unknown'
  });
}