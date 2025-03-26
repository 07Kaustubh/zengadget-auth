import admin from '../config/firebase.js';
import { getUsersCollection } from '../config/database.js';
import { generateJWT } from '../utils/jwt.js';

// Generate a unique customer ID
const generateCustomerId = () => {
  return new Date().getTime().toString(36) + Math.random().toString(36).substring(2, 7);
};

// Verify Firebase ID token
const verifyToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw new Error('Invalid or expired ID token');
  }
};

// Create a new user
const createNewUser = async (decodedToken) => {
  const newUser = {
    uid: decodedToken.uid,
    name: decodedToken.name || '',
    email: decodedToken.email || '',
    customerId: generateCustomerId(),
    timestamp: new Date()
  };

  await getUsersCollection().insertOne(newUser);

  return {
    customerId: newUser.customerId,
    accessToken: generateJWT(newUser.uid, newUser.customerId)
  };
};

// Get existing user or create new one
const getUserOrCreate = async (idToken) => {
  try {
    const decodedToken = await verifyToken(idToken);
    const userDoc = await getUsersCollection().findOne({ uid: decodedToken.uid });

    if (userDoc) {
      return {
        customerId: userDoc.customerId,
        accessToken: generateJWT(decodedToken.uid, userDoc.customerId)
      };
    }
    
    return await createNewUser(decodedToken);
  } catch (error) {
    console.error('Error in getUserOrCreate:', error);
    throw error;
  }
};

export {
  verifyToken,
  getUserOrCreate
};