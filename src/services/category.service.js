import { getDb } from '../config/database.js';

const CATEGORY_NAME = 'categories'; // Collection/document identifier for categories

/**
 * Delete a category and all its associated gadgets
 * 
 * @param {string} categoryName - Name of category to delete
 * @returns {Promise<boolean>} - Success status
 */
const deleteCategory = async (categoryName) => {
  try {
    if (!categoryName) {
      throw new Error('Category name is required');
    }

    const db = getDb();
    
    // Remove category from the category list
    const categoryResult = await db.collection('rawData').updateOne(
      { type: CATEGORY_NAME },
      { $pull: { value: categoryName } }
    );

    // Delete all gadgets under this category
    const gadgetResult = await db.collection('gadgetsData').deleteMany({ 
      category_name: categoryName 
    });

    if (categoryResult.modifiedCount > 0 || gadgetResult.deletedCount > 0) {
      console.log(`Successfully deleted category: ${categoryName} and its gadgets.`);
      return true;
    } else {
      console.log("No category found for deletion.");
      return false;
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    return false;
  }
};

/**
 * Add categories to the system
 * 
 * @param {Array<string>} categories - Array of category names to add
 * @returns {Promise<boolean>} - Success status
 */
const addCategories = async (categories) => {
  try {
    if (!Array.isArray(categories)) {
      throw new Error('Categories must be an array');
    }

    const db = getDb();
    
    // Check if categories document exists
    const result = await db.collection('rawData').findOne({ type: CATEGORY_NAME });
    
    if (result) {
      // Update existing categories document
      const updateResult = await db.collection('rawData').updateOne(
        { type: CATEGORY_NAME },
        { $set: { value: categories } }
      );
      
      return updateResult.modifiedCount > 0;
    } else {
      // Create new categories document
      const insertResult = await db.collection('rawData').insertOne({
        type: CATEGORY_NAME,
        value: categories
      });
      
      return insertResult.acknowledged;
    }
  } catch (error) {
    console.error("Error adding categories:", error);
    return false;
  }
};

/**
 * Get all categories
 * 
 * @returns {Promise<Array<string>>} - Array of category names
 */
const getAllCategories = async () => {
  try {
    const db = getDb();
    
    const result = await db.collection('rawData').findOne({ type: CATEGORY_NAME });
    
    if (result && result.value) {
      return result.value;
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export {
  deleteCategory,
  addCategories,
  getAllCategories,
  CATEGORY_NAME
};