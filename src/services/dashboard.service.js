import { getDb } from '../config/database.js';

/**
 * Get all gadgets from the database
 * 
 * @returns {Promise<Array>} Array of gadget documents
 */
export const getAllGadgets = async () => {
  try {
    const db = getDb();
    const gadgets = await db.collection('gadgetsData').find({}).toArray();
    console.log('Fetched gadgets data:', gadgets.length);
    return gadgets;
  } catch (error) {
    console.error('Error fetching gadgets:', error);
    throw error;
  }
};

/**
 * Get devices with optional filtering
 * 
 * @param {Object} filter Optional MongoDB filter
 * @returns {Promise<Array>} Array of device documents
 */
export const getDevices = async (filter = {}) => {
  try {
    const db = getDb();
    const devices = await db.collection('devicesData').find(filter).toArray();
    console.log('Fetched devices data:', devices.length);
    return devices;
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
};

/**
 * Get all registered users
 * 
 * @returns {Promise<Array>} Array of user documents
 */
export const getAllUsers = async () => {
  try {
    const db = getDb();
    const users = await db.collection('users').find({}).toArray();
    console.log('Fetched users data:', users.length);
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

/**
 * Generic function to get data from any collection
 * 
 * @param {string} collectionName Name of the MongoDB collection
 * @param {Object} filter MongoDB filter criteria
 * @param {string} uniqueField Field to get distinct values for (optional)
 * @returns {Promise<Array>} Array of documents or unique field values
 */
export const getData = async (collectionName, filter = {}, uniqueField = null) => {
  try {
    const db = getDb();
    let result;
    
    if (uniqueField) {
      // If a unique field is provided, use `distinct` to get unique values
      result = await db.collection(collectionName).distinct(uniqueField, filter);
      console.log(`Fetched unique ${uniqueField} from ${collectionName}:`, result.length);
    } else {
      // If no unique field is provided, fetch all data matching the filter
      result = await db.collection(collectionName).find(filter).toArray();
      console.log(`Fetched data from ${collectionName}:`, result.length);
    }

    return result;
  } catch (error) {
    console.error(`Error fetching data from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Delete a user from the system
 * 
 * @param {string} userId ID of the user to delete
 * @returns {Promise<Object>} Operation result
 */
export const deleteUser = async (userId) => {
  try {
    const db = getDb();
    const result = await db.collection('users').deleteOne({ customerId: userId });
    return { 
      success: result.deletedCount > 0,
      message: result.deletedCount > 0 ? 'User deleted successfully' : 'User not found'
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete a gadget from the system
 * 
 * @param {string} gadgetId ID of the gadget to delete
 * @returns {Promise<Object>} Operation result
 */
export const deleteGadget = async (gadgetId) => {
  try {
    const db = getDb();
    const result = await db.collection('gadgetsData').deleteOne({ _id: gadgetId });
    return { 
      success: result.deletedCount > 0,
      message: result.deletedCount > 0 ? 'Gadget deleted successfully' : 'Gadget not found'
    };
  } catch (error) {
    console.error('Error deleting gadget:', error);
    return { success: false, message: error.message };
  }
};

export const deleteGadgetByCategoryAndName = async (categoryName, gadgetName) => {
    try {
      const db = getDb();
      const result = await db.collection('gadgetsData').deleteOne({
        category_name: categoryName,
        gadget_name: gadgetName
      });
  
      return { 
        success: result.deletedCount > 0,
        message: result.deletedCount > 0 ? 'Gadget deleted successfully' : 'Gadget not found'
      };
    } catch (error) {
      console.error('Error deleting gadget by category and name:', error);
      return { success: false, message: error.message };
    }
  };