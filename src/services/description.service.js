import { getDb } from '../config/database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleFileUpload, getFileUrl } from '../utils/fileUpload.js';

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(path.dirname(path.dirname(__dirname)), 'data');
const imagesDir = path.join(dataDir, 'images');

/**
 * Add description data to the database
 * 
 * @param {Object} data - Description data to be stored
 * @returns {Promise<boolean>} - Success status
 */
export const addDescriptionData = async (data) => {
  console.log("Adding description data:", data);
  try {
    const db = getDb();
    const result = await db.collection('descriptionData').insertOne(data);
    return result.acknowledged && result.insertedId;
  } catch (error) {
    console.error("Error inserting description data:", error);
    return false;
  }
};

/**
 * Process and save uploaded image
 * 
 * @param {Blob} imageFile - Image file to save
 * @param {string} gadgetName - Name of the gadget for filename
 * @param {number} index - Index for multiple images
 * @param {string} host - Server host for URL generation
 * @returns {Promise<string|null>} - Generated image URL or null on failure
 */
export const saveProductImage = async (imageFile, gadgetName, index, host) => {
  try {
    // Use the new file upload utility
    const result = await handleFileUpload(
      imageFile, 
      imagesDir, 
      `${gadgetName}_description${index + 1}`
    );
    
    if (!result.success) {
      console.error("Error saving product image:", result.error);
      return null;
    }
    
    // Generate URL for accessing the file
    return getFileUrl(result.filename, host);
  } catch (error) {
    console.error("Error saving product image:", error);
    return null;
  }
};

/**
 * Get description data from the database
 * 
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} - Matching description data
 */
// In the getDescriptionData function - ensure it handles the categoryName and gadgetName fields properly
export const getDescriptionData = async (filter = {}) => {
  try {
    const db = getDb();
    console.log("Fetching description data with filter:", filter);
    return await db.collection('descriptionData').find(filter).toArray();
  } catch (error) {
    console.error("Error fetching description data:", error);
    return [];
  }
};