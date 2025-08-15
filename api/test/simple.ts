export default function handler(req, res) {
  res.status(200).json({ 
    working: true,
    method: req.method,
    timestamp: Date.now()
  });
}