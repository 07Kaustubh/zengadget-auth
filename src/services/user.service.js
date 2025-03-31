import { getUsersCollection } from '../config/database.js';
import httpStatus from 'http-status';
import ApiError from '../utils/apiError.js';
import { handleFileUpload, getFileUrl } from '../utils/fileUpload.js';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Get user details by customerId
 */
const getUserByCustomerId = async (customerId) => {
  try {
    const user = await getUsersCollection().findOne({ customerId });
    
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    
    // Remove sensitive fields
    const { _id, ...userWithoutId } = user;
    return userWithoutId;
  } catch (error) {
    console.error('Error getting user:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error getting user');
  }
};

/**
 * Get user by Firebase UID
 */
const getUserByUid = async (uid) => {
  try {
    const user = await getUsersCollection().findOne({ uid });
    
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    
    const { _id, ...userWithoutId } = user;
    return userWithoutId;
  } catch (error) {
    console.error('Error getting user by UID:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error getting user by UID');
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
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    
    return { customerId, updated: true };
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating user');
  }
};

/**
 * Delete a user account
 */
const deleteUser = async (customerId) => {
  try {
    const result = await getUsersCollection().deleteOne({ customerId });
    
    if (result.deletedCount === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    
    return { deleted: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error deleting user');
  }
};

const getUsers = async () => {
  try {
    const users = await getUsersCollection().find({}).toArray();
    
    if (!users || users.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No users found');
    }
    
    return users.map(user => {
      const { _id, ...userWithoutId } = user;
      return userWithoutId;
    });
  } catch (error) {
    console.error('Error getting users:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error getting users');
  }
};

const updateUserProfileWithImage = async (customerId, updateData, profileImage, host) => {
  try {
    if (!customerId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Customer ID is required');
    }
    
    // Check if user exists
    const user = await getUsersCollection().findOne({ customerId });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    
    // Prevent updating protected fields
    const { uid, customerId: id, role, ...safeUpdateData } = updateData;
    
    // Process profile image if provided
    if (profileImage) {
      // Create uploads directory path
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const uploadDir = path.join(path.dirname(path.dirname(__dirname)), 'data', 'images');
      
      // Use the file upload utility to handle the image
      const fileResult = await handleFileUpload(
        profileImage, 
        uploadDir,
        `profile_${customerId}`
      );
      
      // Generate and store the image URL
      safeUpdateData.profileImage = getFileUrl(fileResult.filename, host);
    }
    
    // Update the user
    const result = await getUsersCollection().updateOne(
      { customerId },
      { 
        $set: { 
          ...safeUpdateData, 
          updatedAt: new Date() 
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    
    // Return updated user data
    const updatedUser = await getUsersCollection().findOne({ customerId });
    const { _id, password, ...userToReturn } = updatedUser;
    
    return userToReturn;
  } catch (error) {
    console.error('Error updating user profile with image:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating user profile with image');
  }
};

const addUser = async (userData) => {
  try {
    if (!userData || typeof userData !== 'object') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user data');
    }
    const { email, password, name, role='USER', customerId } = userData;
    if (!email || !password || !name || !customerId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
    }
    // Check if user already exists
    const existingUser = await getUsersCollection().findOne({ email });
    if (existingUser) {
      throw new ApiError(httpStatus.CONFLICT, 'User already exists');
    }
    const result = await getUsersCollection().insertOne({
      email,
      password,
      name,
      role,
      customerId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    if (result.insertedCount === 0) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to insert user data');
    }
    
    return result;
  } catch (error) {
    console.error('Error adding user:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error adding user');
  }
};

export {
  getUserByCustomerId,
  getUserByUid,
  updateUserProfile,
  updateUserProfileWithImage,
  deleteUser,
  getUsers,
  addUser
};