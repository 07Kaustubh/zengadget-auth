import { getDb } from '../config/database.js';

/**
 * Check if a device with given device_id already exists
 * 
 * @param {string} deviceId - Device ID to check
 * @returns {Promise<boolean>} - True if device exists, false otherwise
 */
export const checkDeviceExists = async (deviceId) => {
  try {
    const db = getDb();
    const device = await db.collection('devicesData').findOne({ device_id: deviceId });
    return !!device;
  } catch (error) {
    console.error('Error checking device existence:', error);
    throw error;
  }
};

/**
 * Add a new device to the database
 * 
 * @param {Object} deviceData - Device data to add
 * @returns {Promise<boolean>} - Success status
 */
export const addDevice = async (deviceData) => {
  try {
    const db = getDb();
    const result = await db.collection('devicesData').insertOne({
      category_name: deviceData.category_name,
      gadget_name: deviceData.gadget_name,
      device_id: deviceData.device_id,
      user_id: null,
      sub_user_id: [],
      subscription: null
    });
    
    return result.acknowledged && result.insertedId;
  } catch (error) {
    console.error('Error adding device:', error);
    return false;
  }
};

/**
 * Get devices with optional filtering
 * 
 * @param {Object} filter - MongoDB filter criteria
 * @returns {Promise<Array>} - Array of matching devices
 */
export const getDevices = async (filter = {}) => {
  try {
    const db = getDb();
    return await db.collection('devicesData').find(filter).toArray();
  } catch (error) {
    console.error('Error fetching devices:', error);
    return [];
  }
};

/**
 * Get all devices from the devices_data collection
 * This implements the functionality from new.js but adapted to the existing codebase
 * 
 * @returns {Promise<Array>} - Array of all devices
 */
export const getAllDevicesData = async () => {
    try {
      const db = getDb();
      // Note: Using 'devicesData' collection as in existing code rather than 'devices_data'
      // from new.js to maintain consistency with your codebase
      return await db.collection('devicesData').find().toArray();
    } catch (error) {
      console.error('Error fetching all devices:', error);
      throw error;
    }
  };

/**
 * Get device details by device ID along with associated gadget information
 * 
 * @param {string} deviceId - Device ID to fetch
 * @returns {Promise<Object>} - Result object with device and gadget data
 */
export const getDeviceDetails = async (deviceId) => {
  try {
    if (!deviceId) {
      return { 
        data: {}, 
        error: true, 
        code: 400, 
        message: "Please enter deviceId" 
      };
    }

    const db = getDb();
    const device = await db.collection('devicesData').findOne({ device_id: deviceId });
    
    if (!device) {
      return { 
        data: {}, 
        error: true, 
        code: 6051, 
        message: "No data found for this deviceId" 
      };
    }

    if (device.user_id !== null) {
      return { 
        data: {}, 
        error: true, 
        code: 6052, 
        message: "User already exists for this deviceId" 
      };
    }

    // Get gadget data for this device
    const gadget = await db.collection('gadgetsData').findOne({ 
      category_name: device.category_name, 
      gadget_name: device.gadget_name 
    });

    if (!gadget) {
      return { 
        data: {}, 
        error: true, 
        code: 6053, 
        message: "Associated gadget not found" 
      };
    }

    const deviceData = {
      name: device.gadget_name || "",
      description: device.description || "",
      category: device.category_name || "",
      feature_module_name: gadget?.feature_module_name || "",
      short_description: gadget?.short_description || "",
      image: gadget?.overview_img || "",
      background_color: gadget?.background_color || "",
      alpha: gadget?.alpha || 0,
      icon: gadget?.icon || "",
      device: {
        id: device.device_id,
        user_id: device.user_id,
        sub_users: device.sub_user_id,
        subscription: device.subscription
      }
    };

    return { 
      data: deviceData, 
      error: false, 
      code: 202, 
      message: "data-found" 
    };
  } catch (error) {
    console.error('Error getting device details:', error);
    return { 
      data: {}, 
      error: true, 
      code: 500, 
      message: "Server error" 
    };
  }
};

/**
 * Update a device's user ID
 * Implementation of functionality from new.js
 * 
 * @param {string} deviceId - Device ID to update
 * @param {string} userId - New user ID to assign
 * @returns {Promise<Object>} - Result object with success status
 */
export const updateDeviceUser = async (deviceId, userId) => {
  try {
    if (!deviceId) {
      return { 
        data: {}, 
        error: true, 
        message: "Device ID is required" 
      };
    }

    const db = getDb();
    
    // Check if device exists first (from new.js)
    const device = await db.collection('devicesData').findOne({ device_id: deviceId });
    
    if (!device) {
      return { 
        data: {}, 
        error: true, 
        message: "Device ID not available" 
      };
    }

    // Update the device with new user_id
    const updateResult = await db.collection('devicesData').updateOne(
      { device_id: deviceId },
      { $set: { user_id: userId } }
    );

    if (updateResult.modifiedCount > 0) {
      return { 
        data: { deviceId, userId }, 
        error: false, 
        message: "Device updated successfully" 
      };
    } else {
      return { 
        data: {}, 
        error: true, 
        message: "Failed to update device" 
      };
    }
  } catch (error) {
    console.error('Error updating device user:', error);
    return { 
      data: {}, 
      error: true, 
      message: "Internal Server Error" 
    };
  }
};