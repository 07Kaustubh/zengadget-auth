import { getDb } from '../config/database.js';

/**
 * Store or update user session information
 * Records login method and session data for analytics and tracking
 * 
 * @param {Object} user - User information
 * @returns {Promise<boolean>} Success status
 */
export const storeUserSession = async (user) => {
  try {
    if (!user || !user.uid) {
      throw new Error('Invalid user data for session storage');
    }

    const db = getDb();
    await db.collection('userSessions').updateOne(
      { uid: user.uid }, 
      {
        $set: {
          email: user.email || null,
          name: user.name || null,
          customerId: user.customerId,
          loginMethod: user.loginMethod || 'firebase',
          lastLogin: new Date(),
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log(`User session stored successfully for: ${user.uid}`);
    return true;
  } catch (error) {
    console.error('Error storing user session:', error);
    return false;
  }
};

// Add to your database setup
export const setupSessionCollection = async () => {
    const db = getDb();
    await db.collection('userSessions').createIndex(
      { "lastLogin": 1 }, 
      { expireAfterSeconds: 2592000 }  // 30 days
    );
    console.log('User sessions TTL index created');
  };