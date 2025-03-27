import express from 'express';
import { deleteCategory, addCategories, getAllCategories } from '../services/category.service.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

/**
 * Route to delete a category and its gadgets
 * Protected by authentication
 */
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const { category_name } = req.body;
    
    if (!category_name) {
      return res.status(400).json({ 
        success: false, 
        message: "Category name required" 
      });
    }

    const success = await deleteCategory(category_name);

    if (success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(404).json({ 
        success: false, 
        message: "Category not found or already deleted" 
      });
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * Route to add categories
 * Protected by authentication
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { values } = req.body;
    
    if (!values || !Array.isArray(values)) {
      return res.status(400).json({
        success: false,
        message: "Categories array required"
      });
    }

    const success = await addCategories(values);

    if (success) {
      return res.status(200).json({ 
        success: true,
        message: "Categories added successfully"
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to add categories"
      });
    }
  } catch (error) {
    console.error('Error adding categories:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Route to get all categories
 * No authentication required for reading categories
 */
router.get('/', async (req, res) => {
  try {
    const categories = await getAllCategories();
    
    return res.status(200).json({
      data: { values: categories },
      error: false,
      message: "Success"
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      data: {},
      error: true,
      message: error.message || "Failed to fetch categories"
    });
  }
});

export default router;