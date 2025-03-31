import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import express from 'express';
import {deleteCategory, addCategories, getCategories, categoryExists} from '../services/category.service'; 

const router = express.Router();

router.delete('/', catchAsync(async (req, res) => {
    const { categoryName } = req.body;
    const result = await deleteCategory(categoryName);
    res.status(httpStatus.OK).json({
        status: true,
        message: 'Category deleted successfully',
        data: result
    });
}
));
router.post('/', catchAsync(async (req, res) => {
    const categories = req.body.categories;
    const result = await addCategories(categories);
    res.status(httpStatus.CREATED).json({
        status: true,
        message: 'Categories added successfully',
        data: result
    });
}
));
router.get('/', catchAsync(async (req, res) => {
    const categories = await getCategories();
    res.status(httpStatus.OK).json({
        status: true,
        message: 'Categories fetched successfully',
        data: categories
    });
}
));

export default router;