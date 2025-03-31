import { getDb, getDescriptionCollection } from '../config/database';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { fileURLToPath } from 'url';
import path from 'path';
import { handleFileUpload, getFileUrl } from '../utils/fileUpload';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(path.dirname(path.dirname(__dirname)), 'data');
const imagesDir = path.join(dataDir, 'images');

const addDescriptionData = async (descriptionData) => {
    const db = getDb();
    const descriptionCollection = getDescriptionCollection();
    try {
        if (!descriptionData || typeof descriptionData !== 'object') {
            throw new Error('Invalid description data');
        }
        const result = await descriptionCollection.insertOne({
            ...descriptionData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        if (result.insertedCount === 0) {
            throw new Error('Failed to insert description data');
        }
        return result;
    }
    catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

 const saveProductImage = async (imageFile, gadgetName, index, hostname) => {
    try {
        if (!imageFile || !gadgetName || typeof index !== 'number') {
            throw new Error('Invalid input data');
        }
        const directory = path.join(imagesDir, gadgetName);
        const customFilename = `${gadgetName}-${index}`;
        const uploadResult = await handleFileUpload(imageFile, directory, customFilename);
        if (!uploadResult || !uploadResult.filename) {
            throw new Error('Failed to upload image');
        }
        const imageUrl = getFileUrl(uploadResult.filename, hostname);
        return imageUrl;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to save product image', error);
    }
}

const getDescriptionData = async (gadgetName) => {
    const db = getDb();
    const descriptionCollection = getDescriptionCollection();
    try {
        if (!gadgetName) {
            throw new Error('Gadget name is required');
        }
        const description = await descriptionCollection.findOne({ gadget_name: gadgetName });
        if (!description) {
            throw new Error('Description not found');
        }
        return description;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const updateDescriptionData = async (id, updateData) => {
    const db = getDb();
    const descriptionCollection = getDescriptionCollection();
    try {
        if (!id || !updateData || typeof updateData !== 'object') {
            throw new Error('Invalid input data');
        }
        const result = await descriptionCollection.updateOne({ _id: id }, { $set: updateData, updatedAt: new Date() });
        if (!result || result.matchedCount === 0) {
            throw new Error('Description not found');
        }
        if (result.modifiedCount === 0) {
            throw new Error('Failed to update description data');
        }
        return result;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const deleteDescriptionData = async (id) => {
    const db = getDb();
    const descriptionCollection = getDescriptionCollection();
    try {
        if (!id) {
            throw new Error('ID is required');
        }
        const result = await descriptionCollection.deleteOne({ _id: id });
        if (!result || result.deletedCount === 0) {
            throw new Error('Description not found');
        }
        return result;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

export {
    addDescriptionData,
    saveProductImage,
    getDescriptionData,
    updateDescriptionData,
    deleteDescriptionData
};