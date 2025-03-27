import { getDb } from '../config/database.js';
import path from 'path';
import { writeFile } from 'fs/promises';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { getAllCategories } from './category.service.js';

// Get current directory path for file operations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(path.dirname(path.dirname(__dirname)), 'data');
const imagesDir = path.join(dataDir, 'images');

/**
 * Add a new gadget to the database
 * 
 * @param {Object} gadgetData - Data for the new gadget
 * @returns {Promise<boolean>} - Success status
 */
export const addGadget = async (gadgetData) => {
  try {
    const db = getDb();
    const result = await db.collection('gadgetsData').insertOne(gadgetData);
    console.log('Inserted gadget:', result);
    return result.acknowledged && result.insertedId;
  } catch (error) {
    console.error('Error inserting gadget data:', error);
    return false;
  }
};

/**
 * Check if a gadget name already exists in a category
 * 
 * @param {string} categoryName - Category to check
 * @param {string} gadgetName - Gadget name to check
 * @returns {Promise<boolean>} - True if gadget exists, false otherwise
 */
export const checkGadgetExists = async (categoryName, gadgetName) => {
  try {
    const db = getDb();
    const gadget = await db.collection('gadgetsData').findOne({
      category_name: categoryName,
      gadget_name: gadgetName
    });
    return !!gadget;
  } catch (error) {
    console.error('Error checking gadget existence:', error);
    throw error;
  }
};

/**
 * Get gadgets with optional filtering
 * 
 * @param {Object} filter - MongoDB filter criteria
 * @returns {Promise<Array>} - Array of matching gadgets
 */
export const getGadgets = async (filter = {}) => {
  try {
    const db = getDb();
    const gadgets = await db.collection('gadgetsData').find(filter).toArray();
    return gadgets;
  } catch (error) {
    console.error('Error fetching gadgets:', error);
    return [];
  }
};

/**
 * Save icon or overview image for a gadget
 * 
 * @param {Object} file - The file object from multer
 * @param {string} gadgetName - Name of the gadget
 * @param {string} fileType - Type of file ('icon' or 'overview')
 * @param {string} host - Server host for URL generation
 * @returns {Promise<string|null>} - URL of the saved image or null on failure
 */
export const saveGadgetImage = async (file, gadgetName, fileType, host) => {
  try {
    // Ensure directories exist
    try {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.mkdir(imagesDir, { recursive: true });
    } catch (err) {
      console.log('Directory already exists or cannot be created');
    }

    // Get file buffer and extension
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop();
    
    // Create filename with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const fileName = `${timestamp}_${gadgetName}_${fileType}.${fileExtension}`;
    const filePath = path.join(imagesDir, fileName);
    
    // Write file to disk
    await writeFile(filePath, buffer);
    console.log(`✅ ${fileType} image saved: ${filePath}`);
    
    // Return URL for accessing the image
    return `http://${host}/api/images/${fileName}`;
  } catch (error) {
    console.error(`Error saving ${fileType} image:`, error);
    return null;
  }
};

/**
 * Get gadget names by category
 * 
 * @param {Object} filter - Filter criteria including category_name
 * @returns {Promise<Array>} - Array of gadget names
 */
export const getGadgetNames = async (filter = {}) => {
    try {
      const db = getDb();
      const gadgets = await db.collection('gadgetsData').find(filter).toArray();
      
      // Extract just the gadget names
      const gadgetNames = gadgets.map(gadget => gadget.gadget_name);
      console.log('Gadget names fetched:', gadgetNames);
      
      return gadgetNames;
    } catch (error) {
      console.error('Error fetching gadget names:', error);
      return [];
    }
  };


/**
 * Get categorized gadgets with formatting similar to new.js
 * 
 * @returns {Promise<Object>} - Formatted gadget categories
 */
export const getCategorizedGadgets = async () => {
  try {
    // Get all categories
    const categories = await getAllCategories();
    
    if (!categories || categories.length === 0) {
      return { 
        data: {}, 
        error: true, 
        code: 404, 
        message: "data-not-found" 
      };
    }
    
    // Initialize response data structure
    const resdata = { 'gadget-categories': [] };
    
    // Process each category
    for (const categoryName of categories) {
      const gadgets = await getGadgets({ category_name: categoryName });
      
      const tmpJson = {
        category: categoryName,
        gadgets: []
      };
      
      // Process each gadget in the category
      for (const gadget of gadgets) {
        tmpJson.gadgets.push({
          name: gadget.gadget_name || "",
          background_color: gadget.background_color || "",
          alpha: gadget.alpha || 0,
          icon: gadget.icon || "",
          module_name: gadget.feature_module_name || "",
          description: gadget.short_description || ""
        });
      }
      
      resdata["gadget-categories"].push(tmpJson);
    }
    
    return { 
      data: resdata, 
      error: false, 
      code: 200, 
      message: "success" 
    };
  } catch (error) {
    console.error('Error fetching categorized gadgets:', error);
    return { 
      data: {}, 
      error: true, 
      code: 500, 
      message: error.message 
    };
  }
};

// Add this after the getCategorizedGadgets function

/**
 * Get categorized gadgets with exact formatting from new.js
 * 
 * @returns {Promise<Object>} - Formatted gadget categories
 */
export const getFormattedGadgetsNewJs = async () => {
    try {
      // Get all categories
      const categories = await getAllCategories();
      
      if (!categories || categories.length === 0) {
        return { data: {}, error: true, code: 404, message: "data-not-found" };
      }
      
      // Initialize response data structure exactly as in new.js
      let resdata = { "gadget-category": [] };
      
      // Process each category
      for (const categoryName of categories) {
        const gadgets = await getGadgets({ category_name: categoryName });
        
        let tmpJson = {
          category: categoryName,
          "gadgets": []
        };
        
        // Process each gadget in the category (simpler format as in new.js)
        for (const gadget of gadgets) {
          tmpJson.gadgets.push({
            "name": gadget.gadget_name || ""
          });
        }
        
        resdata["gadget-category"].push(tmpJson);
      }
      
      return { data: resdata, error: false, code: 200, message: "success" };
    } catch (error) {
      console.error('Error getting formatted gadgets:', error);
      return { data: {}, error: true, code: 500, message: "Failed to process gadgets data" };
    }
  };