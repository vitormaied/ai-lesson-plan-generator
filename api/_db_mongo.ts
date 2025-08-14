
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import type { User, SubscriptionPlan, Team, Invite } from '../types'; // Ajuste o caminho conforme necessário

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// User Schema
const UserSchema = new mongoose.Schema<User & { password?: string }> ({
  id: { type: String, unique: true, required: true }, // Usaremos o ID do MongoDB como o ID do usuário
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // A senha será hasheada
  isAdmin: { type: Boolean, default: false },
  usageCount: { type: Number, default: 0 },
  subscription: {
    plan: { type: String, enum: ['Free', 'Personal', 'School'], default: 'Free' },
    stripeId: { type: String },
    planGenerations: { type: Number, default: 2 },
    teamMemberLimit: { type: Number },
    renewalDate: { type: String },
    expiresAt: { type: String },
    isActive: { type: Boolean, default: true },
  },
  teamId: { type: String },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password as string, 10); // Type assertion here
  }
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password!);
};

const UserModel = (mongoose.models.User || mongoose.model<User & { password?: string }>('User', UserSchema));

// Team Schema
const TeamSchema = new mongoose.Schema<Team>({
    id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    adminId: { type: String, required: true },
    memberLimit: { type: Number, required: true },
});

const TeamModel = (mongoose.models.Team || mongoose.model<Team>('Team', TeamSchema));

// Invite Schema
const InviteSchema = new mongoose.Schema<Invite>({
    id: { type: String, unique: true, required: true },
    teamId: { type: String, required: true },
    email: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: String, required: true },
});

const InviteModel = (mongoose.models.Invite || mongoose.model<Invite>('Invite', InviteSchema));


export { dbConnect, UserModel, TeamModel, InviteModel };
