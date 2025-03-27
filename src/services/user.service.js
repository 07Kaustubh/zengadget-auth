import { getUsersCollection } from '../config/database.js';
import { ObjectId } from 'mongodb';
import { writeFile } from 'fs/promises';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const updateUserProfileWithImage = async (username, updateData, profileImage, host) => {
  try {
    if (!username) {
      return { success: false, message: 'Username is required' };
    }
    
    // Check if user exists
    const user = await getUsersCollection().findOne({ username });
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    // Prevent updating protected fields
    const { uid, customerId, ...safeUpdateData } = updateData;
    
    // Process profile image if provided
    if (profileImage && profileImage instanceof Object) {
      try {
        // Create a timestamped filename
        const timestamp = Date.now();
        const fileExtension = profileImage.originalname.split('.').pop();
        const fileName = `${timestamp}_${username}.${fileExtension}`;
        
        // Ensure directory exists
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const uploadDir = path.join(path.dirname(path.dirname(__dirname)), 'data', 'images');
        await fs.mkdir(uploadDir, { recursive: true });
        
        // Save the file
        const filePath = path.join(uploadDir, fileName);
        const buffer = Buffer.from(await profileImage.buffer);
        await writeFile(filePath, buffer);
        
        // Add profile image path to update data
        safeUpdateData.profileImage = `/api/images/${fileName}`;
      } catch (imageError) {
        console.error('Error saving profile image:', imageError);
        return { success: false, message: 'Failed to save profile image' };
      }
    }
    
    // Update the user
    const result = await getUsersCollection().updateOne(
      { username },
      { 
        $set: { 
          ...safeUpdateData, 
          updatedAt: new Date() 
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return { success: false, message: 'User not found' };
    } else if (result.modifiedCount === 0) {
      return { success: true, message: 'No changes made' };
    }
    
    return { success: true, message: 'Profile updated successfully' };
  } catch (error) {
    console.error('Error updating user profile with image:', error);
    return { success: false, message: 'Internal server error' };
  }
};

// ...existing code...



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

/**
 * Check if a user exists by email
 */
const checkUserByEmail = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }
    
    const user = await getUsersCollection().findOne({ email });
    return { isReturningUser: !!user };
  } catch (error) {
    console.error('Error checking user by email:', error);
    throw error;
  }
};

/**
 * Find a user by username and password
 */
const findUserByCredentials = async (username, password) => {
  try {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    // Note: In production, passwords should be hashed
    const user = await getUsersCollection().findOne({ 
      username,
      password // In real implementation, use password comparison
    });
    
    if (!user) {
      return null;
    }
    
    const { _id, password: _, ...userWithoutSensitiveInfo } = user;
    return userWithoutSensitiveInfo;
  } catch (error) {
    console.error('Error finding user by credentials:', error);
    throw error;
  }
};

const deleteUserByUsername = async (username) => {
  console.log("Deleting user:", username);
  try {
    if (!username) {
      throw new Error('Username is required');
    }
    
    const result = await getUsersCollection().deleteOne({ username });
    
    if (result.deletedCount > 0) {
      console.log(`Successfully deleted user: ${username}`);
      return { success: true, message: "User deleted successfully" };
    } else {
      console.log("No user found for deletion.");
      return { success: false, message: "User not found" };
    }
  } catch (error) {
    console.error('Error deleting user by username:', error);
    return { success: false, error: "Internal server error" };
  }
};

export {
  getUserByCustomerId,
  getUserByUid,
  updateUserProfile,
  updateUserProfileWithImage,  // Export the new function
  deleteUser,
  checkUserByEmail,
  findUserByCredentials,
  deleteUserByUsername
};