import admin from '../config/firebase.js';
import { getUsersCollection } from '../config/database.js';
import { generateJWT } from '../utils/jwt.js';
import httpStatus from 'http-status';
import ApiError from '../utils/apiError.js';

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
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired ID token');
  }
};

// Create a new user
const createNewUser = async (decodedToken) => {
  try {
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
  } catch (error) {
    console.error('Error creating new user:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create user');
  }
};

// Get existing user or create new one
const getUserOrCreate = async (idToken) => {
  try {
    if (!idToken) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'ID token is required');
    }
    
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
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error.message.includes('database')) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Database error occurred');
    }
    
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Authentication failed'
    );
  }
};

export {
  verifyToken,
  getUserOrCreate
};