import { getDb } from '../config/database.js';

/**
 * Add check data to the database
 * 
 * @param {Object} data - Data to be stored
 * @returns {Promise<Object>} - Result with success status
 */
export const addCheckData = async (data) => {
  console.log("Adding form data:", data);
  try {
    const db = getDb();
    await db.collection('checkData').insertOne(data);
    return { success: true };
  } catch (error) {
    console.error("Database insert error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get check data from the database
 * 
 * @param {Object} filter - MongoDB filter criteria
 * @returns {Promise<Array>} - Array of matching documents
 */
export const getCheckData = async (filter = {}) => {
  console.log("Fetching form data with filter:", filter);
  try {
    const db = getDb();
    return await db.collection('checkData').find(filter).toArray();
  } catch (error) {
    console.error("Database fetch error:", error);
    return [];
  }
};