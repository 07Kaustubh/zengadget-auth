import { getDb, getCategoriesCollection } from '../config/database';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';

const deleteCategory = async (categoryName) => {
    const db = getDb();
    const categoriesCollection = getCategoriesCollection();
    try{
        if(!categoryName) {
            throw new Error();
        }
        const result = await categoriesCollection.deleteOne({ name: categoryName });
        const gadgetResult = await db.collection('gadgetsData').deleteMany(
            { category_name: categoryName }
        );
        if (gadgetResult.deletedCount === 0) {
            throw new Error();
        }
        if (result.deletedCount === 0) {
            throw new Error();
        }
        return result;
    }
    catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const addCategories = async (categories) => {
    try{
        if(!Array.isArray(categories) || categories.length === 0) {
            throw new Error();
        }
        const db = getDb();
        const categoriesCollection = getCategoriesCollection();
        const existingCategories = await categoriesCollection.find({}).toArray();
        const existingCategoryNames = existingCategories.map(category => category.name);
        const newCategories = categories.filter(category => !existingCategoryNames.includes(category));
        if (newCategories.length === 0) {
            throw new Error();
        }
        const result = await categoriesCollection.insertMany(newCategories.map(category => ({ name: category })));
        if (result.insertedCount === 0) {
            throw new Error();
        }
        return result;
    }
    catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const getCategories = async () => {
    try{
        const db = getDb();
        const categoriesCollection = getCategoriesCollection();
        const categories = await categoriesCollection.find({}).toArray();
        if (!categories || categories.length === 0) {
            throw new Error();
        }
        return categories.map(category => category.name);
    }
    catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const categoryExists = async (categoryName) => {
    try{
        if(!categoryName) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Category name is required');
        }
        const db = getDb();
        const categoriesCollection = getCategoriesCollection();
        const category = await categoriesCollection.findOne({ name: categoryName });
        if (!category) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
        }
        return !!category;
    }
    catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    }
}

const categoryService = {
    deleteCategory,
    addCategories,
    getCategories,
    categoryExists
}