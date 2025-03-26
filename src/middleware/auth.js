import { verifyJWT } from '../utils/jwt.js';

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await verifyJWT(token);
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      customerId: decodedToken.customerId
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
}

export default authMiddleware;