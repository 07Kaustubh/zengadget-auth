import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';

if (!process.env.JWT_SECRET_KEY) {
  console.error('WARNING: JWT_SECRET_KEY not set in environment variables.');
}

const JWT_SECRET = process.env.JWT_SECRET_KEY;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export const generateJWT = (uid, customerId) => {
  if (!JWT_SECRET) {
    throw new Error('JWT secret key is not configured');
  }
  return jwt.sign({ uid, customerId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyJWT = async (token) => {
  if (!JWT_SECRET) {
    throw new Error('JWT secret key is not configured');
  }
  
  const db = getDb();
  const blacklistedToken = await db.collection('invalidatedTokens').findOne({ token });
  if (blacklistedToken) {
    throw new Error('Token has been invalidated');
  }
  
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const invalidateToken = async (token) => {
  const db = getDb();
  await db.collection('invalidatedTokens').insertOne({
    token,
    expiresAt: new Date(Date.now() + 3600000)
  });
};

export const refreshToken = async (token) => {
  const payload = await verifyJWT(token);
  await invalidateToken(token);
  return generateJWT(payload.uid, payload.customerId);
};

export const setupTokenBlacklist = async () => {
  const db = getDb();
  await db.collection('invalidatedTokens').createIndex(
    { "expiresAt": 1 }, 
    { expireAfterSeconds: 0 }
  );
  console.log('Token blacklist TTL index created');
};