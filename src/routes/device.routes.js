import express from 'express';
import { body, validationResult } from 'express-validator';
import { 
  addDevice, 
  checkDeviceExists, 
  getDevices, 
  getDeviceDetails,
  updateDeviceUser 
} from '../services/device.service.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// ...existing code...

/**
 * GET endpoint to retrieve all devices without filtering
 * Implementation of functionality from new.js
 */
router.get('/all', async (req, res) => {
    try {
      const devices = await getAllDevicesData();
      
      return res.status(200).json({
        devices,
        error: false,
        message: "Success"
      });
    } catch (error) {
      console.error("Error fetching all devices:", error);
      return res.status(500).json({
        error: true,
        message: "Failed to fetch devices"
      });
    }
  });

/**
 * POST endpoint to register a new device
 * Validates that device_id isn't already in use
 */
router.post('/', [
  body('device_id').notEmpty().withMessage('Device ID is required'),
  body('category_name').notEmpty().withMessage('Category name is required'),
  body('gadget_name').notEmpty().withMessage('Gadget name is required')
], async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: errors.array() 
      });
    }

    const { device_id, category_name, gadget_name } = req.body;

    // Check if device_id already exists
    const deviceExists = await checkDeviceExists(device_id);
    if (deviceExists) {
      return res.status(400).json({ 
        success: false, 
        error: "Device ID is already used. Please try another." 
      });
    }

    // Add the new device
    const success = await addDevice({
      category_name,
      gadget_name,
      device_id
    });

    if (success) {
      return res.status(200).json({ 
        success: true, 
        message: "Device added successfully!" 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: "Failed to add the device." 
      });
    }
  } catch (error) {
    console.error("Error adding device:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Something went wrong!" 
    });
  }
});

/**
 * GET endpoint to retrieve devices
 * Optional filtering by device_id, category_name, gadget_name
 */
router.get('/', async (req, res) => {
  try {
    const { device_id, category_name, gadget_name } = req.query;
    const filter = {};
    
    if (device_id) filter.device_id = device_id;
    if (category_name) filter.category_name = category_name;
    if (gadget_name) filter.gadget_name = gadget_name;
    
    const devices = await getDevices(filter);
    
    return res.status(200).json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch devices"
    });
  }
});

/**
 * GET endpoint to get detailed device information by deviceId
 * Returns device and associated gadget information
 */
router.get('/details', async (req, res) => {
  try {
    const { deviceId } = req.query;
    console.log("Requesting device details for:", deviceId);
    
    const result = await getDeviceDetails(deviceId);
    
    // Return response with the appropriate status code
    return res.status(result.error ? (result.code >= 400 ? result.code : 400) : 200).json(result);
  } catch (error) {
    console.error("Error fetching device details:", error);
    return res.status(500).json({
      data: {},
      error: true,
      code: 500,
      message: "Internal Server Error"
    });
  }
});

/**
 * POST endpoint to update a device user
 * Implementation of functionality from new.js
 */
router.post('/update-user', [
    body('device_id').notEmpty().withMessage('Device ID is required'),
    body('user_id').notEmpty().withMessage('User ID is required')
  ], async (req, res) => {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          data: {}, 
          error: true, 
          message: errors.array()[0].msg 
        });
      }
  
      const { device_id, user_id } = req.body;
      console.log("Received Body:", req.body);
  
      // Update the device with the new user ID
      const result = await updateDeviceUser(device_id, user_id);
      
      // Return response with appropriate status code
      const statusCode = result.error ? (result.code >= 400 ? result.code : 404) : 200;
      return res.status(statusCode).json(result);
    } catch (error) {
        console.error("Error updating device:", error);
        return res.status(500).json({ 
          data: {}, 
          error: true, 
          message: "Internal Server Error" 
        });
      }
    });

export default router;