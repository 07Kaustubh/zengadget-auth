import { verifyJWT } from '../utils/jwt.js';
import httpStatus from 'http-status';
import { roleRights } from '../config/roles.js';
import ApiError from '../utils/apiResponse.js';


async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await verifyJWT(token);

    if (decodedToken.exp && Date.now() >= decodedToken.exp * 1000) {
      throw new ApiError(401, 'Token expired');
    }
    
    // Get user from database
    const user = await getUserByUid(decodedToken.uid);
    
    if (!user) {
      throw new ApiError(401, 'Please authenticate');
    }
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      customerId: decodedToken.customerId
    };
    
    if (requiredRights.length) {
      const userRights = userRightsCache.get(user.role) || roleRights.get(user.role || 'user');
      if (!userRightsCache.has(user.role)) {
        userRightsCache.set(user.role, userRights);
      }
      const hasRequiredRights = requiredRights.every(
        (requiredRight) => userRights && userRights.includes(requiredRight)
      );
      if (!hasRequiredRights && req.params.userId !== user.customerId.toString()) {
        throw new ApiError(403, 'Forbidden');
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;