import express from 'express';
import multer from 'multer';
import { 
  addGadget,
  checkGadgetExists,
  getGadgets,
  saveGadgetImage,
  getGadgetNames
} from '../services/gadget.service.js';
import { processGadgetsData } from '../utils/gaggetProcessor.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST endpoint to add a new gadget
 * Processes form data including images
 */
router.post('/', upload.fields([
  { name: 'icon', maxCount: 1 },
  { name: 'overviewImage', maxCount: 1 }
]), async (req, res) => {
  try {
    // Extract form data
    const { categoryName, gadgetName, description, backgroundColor, shortDescription, alpha, moduleName } = req.body;
    
    // Validate required fields
    if (!categoryName?.trim() || !gadgetName?.trim() || !description?.trim() || 
        !backgroundColor || !shortDescription?.trim() || 
        !req.files?.icon || !req.files?.overviewImage) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        message: "Please provide all required fields and files" 
      });
    }

    // Check if gadget name already exists in this category
    const gadgetExists = await checkGadgetExists(categoryName, gadgetName);
    if (gadgetExists) {
      return res.status(400).json({ 
        error: "Gadget name already used in this category. Try another one." 
      });
    }

    // Get the host for URL generation
    const host = req.get('host');
    
    // Save icon image
    const iconFile = req.files.icon[0];
    const iconUrl = await saveGadgetImage(iconFile, gadgetName, 'icon', host);
    
    // Save overview image
    const overviewFile = req.files.overviewImage[0];
    const overviewUrl = await saveGadgetImage(overviewFile, gadgetName, 'overview', host);
    
    if (!iconUrl || !overviewUrl) {
      return res.status(500).json({ 
        error: "Failed to save images", 
        message: "Error saving one or more images" 
      });
    }

    // Create gadget data object
    const gadgetData = {
      category_name: categoryName,
      gadget_name: gadgetName,
      description: description,
      background_color: backgroundColor,
      icon: iconUrl,
      short_description: shortDescription,
      alpha: alpha || "0.9", // Default value if not provided
      overview_img: overviewUrl,
      feature_module_name: moduleName || ""
    };

    // Save gadget to database
    const success = await addGadget(gadgetData);
    
    if (success) {
      return res.status(201).json({ 
        data: gadgetData, 
        message: "Gadget added successfully!", 
        error: null 
      });
    } else {
      return res.status(500).json({ 
        data: {}, 
        error: "Failed to add gadget", 
        message: "Database error" 
      });
    }
  } catch (error) {
    console.error("Error adding gadget:", error);
    return res.status(500).json({ 
      data: {}, 
      error: "Server error", 
      message: "Failed to process request" 
    });
  }
});

/**
 * GET endpoint to retrieve gadgets
 * Optional filtering by category and gadget name
 */
router.get('/', async (req, res) => {
  try {
    const { category_name, gadget_name } = req.query;
    const filter = {};
    
    if (category_name) filter.category_name = category_name;
    if (gadget_name) filter.gadget_name = gadget_name;
    
    const gadgets = await getGadgets(filter);
    
    return res.status(200).json({
      data: gadgets,
      error: false,
      message: "Success"
    });
  } catch (error) {
    console.error("Error fetching gadgets:", error);
    return res.status(500).json({
      data: [],
      error: true,
      message: "Failed to fetch gadgets"
    });
  }
});

/**
 * GET endpoint to retrieve gadget names by category
 * Implementation of functionality from new.js
 */
router.get('/names', async (req, res) => {
    try {
      const { category_name } = req.query;
      const filter = {};
      
      if (category_name) {
        filter.category_name = category_name;
      }
      
      const gadgetNames = await getGadgetNames(filter);
      
      return res.status(200).json({
        data: gadgetNames,
        error: false,
        message: "Success"
      });
    } catch (error) {
      console.error("Error fetching gadget names:", error);
      return res.status(500).json({
        data: [],
        error: true,
        message: "Failed to fetch gadget names"
      });
    }
  });

  /**
 * GET endpoint to retrieve gadget categories from JSON file
 * Implementation of functionality from new.js
 */
router.get('/categories-from-file', async (req, res) => {
    try {
      const data = processGadgetsData();
      
      if (data.error) {
        return res.status(404).json({
          error: true,
          message: data.error
        });
      }
      
      return res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching gadget categories:", error);
      return res.status(500).json({
        error: true,
        message: "Failed to process gadget categories"
      });
    }
  });

  export async function get_gadgets(data) {
    return get_data(gadgetsData, data)
  
  }

/**
 * GET endpoint to retrieve categorized gadgets
 * Implementation of functionality from new.js
 */
router.get('/categories', async (req, res) => {
    try {
      const formattedGadgets = await getCategorizedGadgets();
      
      return res.status(200).json(formattedGadgets);
    } catch (error) {
      console.error("Error fetching categorized gadgets:", error);
      return res.status(500).json({
        data: {},
        error: true,
        code: 500,
        message: "Failed to fetch categorized gadgets"
      });
    }
  });

  /**
 * GET endpoint to retrieve categorized gadgets with exact new.js formatting
 */
router.get('/categories-formatted', async (req, res) => {
    try {
      const formattedGadgets = await getFormattedGadgetsNewJs();
      
      return res.status(200).json(formattedGadgets);
    } catch (error) {
      console.error("Error fetching formatted gadgets:", error);
      return res.status(500).json({
        data: {},
        error: true,
        message: "Failed to fetch formatted gadgets"
      });
    }
  });
  
  export default router;