import { getDb, getDeviceCollection, getGadgetsCollection } from '../config/database';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';

const checkDeviceExists = async (deviceId) => {
    const db = getDb();
    const deviceCollection = getDeviceCollection();
    try {
        if (!deviceId) {
            throw new Error('Device ID is required');
        }
        const device = await deviceCollection.findOne({ device_id: deviceId });
        if (!device) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Device not found');
        }
        return device;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const addDevice = async (deviceData) => {
    const db = getDb();
    const deviceCollection = getDeviceCollection();
    try {
        if (!deviceData || typeof deviceData !== 'object') {
            throw new Error('Invalid device data');
        }
        const result = await deviceCollection.insertOne({
            category_name: deviceData.category_name,
            gadget_name: deviceData.gadget_name,
            device_id: deviceData.device_id,
            user_id: null,
            sub_user_id: [],
            subscription: null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        if (result.insertedCount === 0) {
            throw new Error('Failed to insert device data');
        }
        return result;
    }
    catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const getAllDevicesData = async () => {
    const db = getDb();
    const deviceCollection = getDeviceCollection();
    try {
        const devices = await deviceCollection.find({}).toArray();
        if (!devices || devices.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, 'No devices found');
        }
        return devices;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const getDeviceDetails = async (deviceId) => {
    const db = getDb();
    const deviceCollection = getDeviceCollection();
    const gadgetsCollection = getGadgetsCollection();

    try {
        if (!deviceId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Device ID is required');
        }

        const device = await deviceCollection.findOne({ device_id: deviceId });
        if (!device) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Device not found');
        }

        const gadget = await gadgetsCollection.findOne({ 
            category_name: device.category_name, 
            gadget_name: device.gadget_name 
        });

        if (!gadget) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Gadget not found');
        }

        return {
            name: gadget.gadget_name,
            description: gadget.description,
            category: gadget.category_name,
            feature_module_name: gadget.feature_module_name,
            short_description: gadget.short_description,
            image: gadget.overview_img,
            background_color: gadget.background_color,
            alpha: gadget.alpha,
            icon: gadget.icon,
            device: {
                id: device.device_id,
                user_id: device.user_id,
                sub_users: device.sub_user_id,
                subscription: device.subscription
            }
        };
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const updateDeviceUser = async (deviceId, userId) => {
    const db = getDb();
    const deviceCollection = getDeviceCollection();
    try {
        if (!deviceId || !userId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Device ID and User ID are required');
        }
        const result = await deviceCollection.updateOne(
            { device_id: deviceId },
            { $set: { user_id: userId, updatedAt: new Date() } }
        );
        if (result.modifiedCount === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Device not found or no changes made');
        }
        return result;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const updateDeviceSubscription = async (deviceId, subscriptionData) => {
    const db = getDb();
    const deviceCollection = getDeviceCollection();
    try {
        if (!deviceId || !subscriptionData) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Device ID and subscription data are required');
        }
        const result = await deviceCollection.updateOne(
            { device_id: deviceId },
            { $set: { subscription: subscriptionData, updatedAt: new Date() } }
        );
        if (result.modifiedCount === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Device not found or no changes made');
        }
        return result;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

export {
    checkDeviceExists,
    addDevice,
    getAllDevicesData,
    getDeviceDetails,
    updateDeviceUser,
    updateDeviceSubscription
};