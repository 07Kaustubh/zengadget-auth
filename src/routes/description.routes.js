import express from 'express';
import multer from 'multer';
import { addDescriptionData, saveProductImage, getDescriptionData } from '../services/description.service.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST endpoint to add a new product description with images
 * Protected by authentication
 */
router.post('/', authMiddleware, upload.array('product_images'), async (req, res) => {
  try {
    // Parse form data
    const categoryName = req.body.categoryName || '';
    const gadgetName = req.body.gadgetName || '';
    const highlight = req.body.highlights ? JSON.parse(req.body.highlights) : [];
    
    // Parse dynamic headings
    const rawHeadings = req.body.dynamicHeadings ? JSON.parse(req.body.dynamicHeadings) : {};
    
    // Process rawHeadings into correct structure
    const processedHeadings = Object.entries(rawHeadings).reduce((acc, [key, value]) => {
      if (Array.isArray(value.highlights)) {
        if (value.highlightFormat === "key-value") {
          acc[key] = value.highlights.reduce((obj, item) => {
            if (typeof item === "object" && item.key && item.value) {
              obj[item.key] = item.value;
            }
            return obj;
          }, {});
          acc[key].Format = "key-value";
        } else if (value.highlightFormat === "roles") {
          acc[key] = {
            values: value.highlights,
            Format: "rows", // Replace "roles" with "rows"
          };
        }
      }
      return acc;
    }, {});
    
    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const host = req.get('host');
      
      for (let i = 0; i < req.files.length; i++) {
        const imageFile = req.files[i];
        const imageUrl = await saveProductImage(imageFile, gadgetName, i, host);
        if (imageUrl) {
          imageUrls.push(imageUrl);
        }
      }
    }
    
    // Construct the data object
    const processedData = {
      categoryName,
      gadgetName,
      highlight: highlight.length > 0 ? highlight : [],
      product_images: imageUrls,
      ...processedHeadings,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to database
    const success = await addDescriptionData(processedData);
    
    if (success) {
      return res.status(201).json({ 
        data: processedData, 
        error: false, 
        code: 201, 
        message: "Description data added successfully" 
      });
    } else {
      return res.status(500).json({ 
        data: {}, 
        error: true, 
        code: 500, 
        message: "Failed to add description data" 
      });
    }
  } catch (error) {
    console.error("Error processing description:", error);
    return res.status(500).json({ 
      data: {}, 
      error: true, 
      code: 500, 
      message: "Internal server error" 
    });
  }
});

/**
 * GET endpoint to retrieve description data
 */
router.get('/', async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { categoryName, gadgetName } = req.query;
    const filter = {};
    
    if (categoryName) filter.categoryName = categoryName;
    if (gadgetName) filter.gadgetName = gadgetName;
    
    const descriptions = await getDescriptionData(filter);
    
    return res.status(200).json({
      data: descriptions,
      error: false,
      code: 200,
      message: "Success"
    });
  } catch (error) {
    console.error("Error fetching description data:", error);
    return res.status(500).json({
      data: [],
      error: true,
      code: 500,
      message: "Failed to fetch description data"
    });
  }
});

router.get('/by-category-gadget', async (req, res) => {
    try {
      const { categoryName, gadgetName } = req.query;
  
      console.log("Received categoryName:", categoryName);
      console.log("Received gadgetName:", gadgetName);
  
      if (!categoryName || !gadgetName) {
        return res.status(400).json({
          data: {},
          error: true,
          message: "Missing category or gadget name",
          code: 400
        });
      }
  
      const descriptions = await getDescriptionData({ categoryName, gadgetName });
      console.log("Description data:", descriptions);
  
      if (!descriptions || descriptions.length === 0) {
        return res.status(404).json({
          data: {},
          error: true,
          message: "Gadget not found",
          code: 404
        });
      }

      const { _id, ...filteredData } = descriptions[0];

      return res.status(200).json({
        data: filteredData,
        error: false,
        message: "Data found",
        code: 200
      });
    } catch (error) {
      console.error("Error fetching gadget details:", error);
      return res.status(500).json({
        data: {},
        error: true,
        message: "Internal Server Error",
        code: 500
      });
    }
  });

/**
 * GET endpoint to retrieve description by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    
    const description = await db.collection('descriptionData').findOne({ 
      _id: new ObjectId(id)
    });
    
    if (!description) {
      return res.status(404).json({
        data: null,
        error: true,
        code: 404,
        message: "Description not found"
      });
    }
    
    return res.status(200).json({
      data: description,
      error: false,
      code: 200,
      message: "Success"
    });
  } catch (error) {
    console.error("Error fetching description:", error);
    return res.status(500).json({
      data: null,
      error: true,
      code: 500,
      message: "Failed to fetch description"
    });
  }
});

export default router;