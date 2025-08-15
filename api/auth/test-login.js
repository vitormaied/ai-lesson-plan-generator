import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Simplified schema for testing
const UserSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  password: String,
  isAdmin: { type: Boolean, default: false },
  usageCount: { type: Number, default: 0 },
  subscription: {
    plan: { type: String, default: 'Free' },
    planGenerations: { type: Number, default: 2 }
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  try {
    console.log('[TEST-LOGIN] Starting login process');
    
    const { email, password } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password required' 
      });
    }

    console.log('[TEST-LOGIN] Connecting to MongoDB...');
    
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    
    console.log('[TEST-LOGIN] Connected to MongoDB, finding user...');
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('[TEST-LOGIN] User not found');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    console.log('[TEST-LOGIN] User found, checking password...');
    
    const isValid = await user.comparePassword(password);
    
    if (!isValid) {
      console.log('[TEST-LOGIN] Invalid password');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    console.log('[TEST-LOGIN] Login successful');
    
    const userObj = user.toObject();
    delete userObj.password;
    
    return res.status(200).json({ 
      success: true, 
      user: userObj 
    });

  } catch (error) {
    console.error('[TEST-LOGIN] Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
}