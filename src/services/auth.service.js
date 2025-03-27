import admin from '../config/firebase.js';
import { getUsersCollection } from '../config/database.js';
import { generateJWT } from '../utils/jwt.js';
import { generateUserId } from '../utils/idGenerator.js';
import { storeUserSession } from './session.service.js';
import { setAuthCookie } from '../utils/cookie.js';

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

// Get existing user or create new one
const getUserOrCreate = async (idToken, useCookie = false) => {
  try {
    const decodedToken = await verifyToken(idToken);
    const userDoc = await getUsersCollection().findOne({ uid: decodedToken.uid });

    let user;
    let token;

    if (userDoc) {
      // User exists
      user = userDoc;
      token = generateJWT(
        decodedToken.uid, 
        userDoc.customerId, 
        userDoc.role || 'user'  // Include role in token
      );
      
      // Track login session
      await storeUserSession({
        ...userDoc,
        loginMethod: 'firebase'
      });
    } else {
      // Create new user
      user = await createNewUser(decodedToken);
      token = generateJWT(
        decodedToken.uid, 
        user.customerId, 
        user.role || 'user'  // Include role in token
      );
    }
      
    return {
      customerId: user.customerId,
      role: user.role || 'user',  // Include role in response
      accessToken: token,
      cookieHeader: useCookie ? setAuthCookie(token) : undefined
    };
  } catch (error) {
    console.error('Error in getUserOrCreate:', error);
    throw error;
  }
};

// Update createNewUser to include a default role
const createNewUser = async (decodedToken) => {
  const userId = await generateUserId();
  
  const newUser = {
    uid: decodedToken.uid,
    name: decodedToken.name || '',
    email: decodedToken.email || '',
    customerId: userId,
    role: 'user',  // Default role for new users
    timestamp: new Date()
  };

  await getUsersCollection().insertOne(newUser);
  
  // Track user session
  await storeUserSession({
    ...newUser,
    loginMethod: 'firebase'
  });

  return newUser;
};

export {
  verifyToken,
  getUserOrCreate
};