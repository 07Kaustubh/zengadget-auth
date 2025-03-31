import { getDb, getGadgetsCollection, getDeviceCollection, getUsersCollection } from '../config/database';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { getGadgets } from './gadget.services';

const getAllGadgets = async () => {
    