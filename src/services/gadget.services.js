import { getDb, getGadgetsCollection } from '../config/database';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { handleFileUpload, getFileUrl } from '../utils/fileUpload';
import e from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(path.dirname(path.dirname(__dirname)), 'data');
const imagesDir = path.join(dataDir, 'images');

const saveGadgetImage = async (imageFile, gadgetName, filetype, hostname) => {
    try {
        if (!imageFile || !gadgetName || !filetype) {
            throw new Error('Invalid input data');
        }
        const directory = path.join(imagesDir, gadgetName);
        const customFilename = `${gadgetName}-${filetype}`;
        const uploadResult = await handleFileUpload(imageFile, directory, customFilename);
        if (!uploadResult || !uploadResult.filename) {
            throw new Error('Failed to upload image');
        }
        const imageUrl = getFileUrl(uploadResult.filename, hostname);
        return imageUrl;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to save gadget image', error);
    }
}

const addGadget = async (gadgetData) => {
    const db = getDb();
    const gadgetsCollection = getGadgetsCollection();
    try {
        if (!gadgetData || typeof gadgetData !== 'object') {
            throw new Error('Invalid gadget data');
        }
        const result = await gadgetsCollection.insertOne(
            gadgetData
        );
        if (result.insertedCount === 0) {
            throw new Error('Failed to insert gadget data');
        }
        return result;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const checkGadgetExists = async (categoryName, gadgetName) => {
    const db = getDb();
    const gadgetsCollection = getGadgetsCollection();
    try {
        if (!categoryName || !gadgetName) {
            throw new Error('Category name and gadget name are required');
        }
        const gadget = await gadgetsCollection.findOne({ category_name: categoryName, gadget_name: gadgetName });
        if (!gadget) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Gadget not found');
        }
        return gadget;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
} 

const getGadgets = async () => {
    const db = getDb();
    const gadgetsCollection = getGadgetsCollection();
    try {
        const gadgets = await gadgetsCollection.find({}).toArray();
        if (!gadgets || gadgets.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, 'No gadgets found');
        }
        return gadgets;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const getCategorizedGadgets = async (categoryName) => {
    const db = getDb();
    const gadgetsCollection = getGadgetsCollection();
    try {
        if (!categoryName) {
            throw new Error('Category name is required');
        }
        const gadgets = await gadgetsCollection.find({ category_name: categoryName }).toArray();
        if (!gadgets || gadgets.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, 'No gadgets found for this category');
        }
        return gadgets;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

export {
    addGadget,
    saveGadgetImage,
    checkGadgetExists,
    getGadgets,
    getCategorizedGadgets
};