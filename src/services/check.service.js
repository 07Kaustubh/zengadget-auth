import { getDb, getCheckCollection } from '../config/database';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';

const getCheckData = async (checkId) => {
    const db = getDb();
    const checkCollection = getCheckCollection();
    try {
        if (!checkId) {
            throw new Error('Check ID is required');
        }
        const check = await checkCollection.find({});
        if (!check) {
            throw new Error('Check not found');
        }
        return check;
    }
    catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const addCheckData = async (checkData) => {
    const db = getDb();
    const checkCollection = getCheckCollection();
    try {
        if (!checkData || typeof data !== 'object') {
            throw new Error('Invalid check data');
        }
        const result = await checkCollection.insertOne(checkData);
        if (result.insertedCount === 0) {
            throw new Error('Failed to insert check data');
        }
        return result;
    }
    catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

export {
    getCheckData,
    addCheckData
};