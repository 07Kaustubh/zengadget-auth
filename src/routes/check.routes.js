import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import express from 'express';
import { getCheckData, addCheckData } from '../services/check.service';

const router = express.Router();

router.get('/', catchAsync(async (req, res) => {
    const { checkId } = req.query;
    const check = await getCheckData(checkId);
    res.status(httpStatus.OK).json({
        status: true,
        message: 'Check data fetched successfully',
        data: check
    });
}
));
router.post('/', catchAsync(async (req, res) => {
    const checkData = req.body;
    const result = await addCheckData(checkData);
    res.status(httpStatus.CREATED).json({
        status: true,
        message: 'Check data added successfully',
        data: result
    });
}
));

export default router;

