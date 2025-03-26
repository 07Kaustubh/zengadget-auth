import { getUsersCollection } from '../config/database.js';
import { ObjectId } from 'mongodb';

/**
 * Get user details by customerId
 */
const getUserByCustomerId = async (customerId) => {
  try {
    const user = await getUsersCollection().findOne({ customerId });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Remove sensitive fields
    const { _id, ...userWithoutId } = user;
    return userWithoutId;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

/**
 * Get user by Firebase UID
 */
const getUserByUid = async (uid) => {
  try {
    const user = await getUsersCollection().findOne({ uid });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const { _id, ...userWithoutId } = user;
    return userWithoutId;
  } catch (error) {
    console.error('Error getting user by UID:', error);
    throw error;
  }
};

/**
 * Update user profile information
 */
const updateUserProfile = async (customerId, updateData) => {
  try {
    // Prevent updating protected fields
    const { uid, customerId: id, ...safeUpdateData } = updateData;
    
    const result = await getUsersCollection().updateOne(
      { customerId },
      { $set: { ...safeUpdateData, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }
    
    return { customerId, updated: true };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete a user account
 */
const deleteUser = async (customerId) => {
  try {
    const result = await getUsersCollection().deleteOne({ customerId });
    
    if (result.deletedCount === 0) {
      throw new Error('User not found');
    }
    
    return { deleted: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export {
  getUserByCustomerId,
  getUserByUid,
  updateUserProfile,
  deleteUser
};