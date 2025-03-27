import express from 'express';
import { verifyToken } from '../services/auth.service.js';
import { refreshToken, invalidateToken, verifyJWT } from '../utils/jwt.js';
import authMiddleware from '../middleware/auth.js';
import { clearAuthCookie } from '../utils/cookie.js';

const router = express.Router();

router.get('/tab-close-logout', (req, res) => {
  try {
    console.log("User logged out via tab close");
    const cookieHeader = clearAuthCookie();
    
    res.setHeader("Set-Cookie", cookieHeader);
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (error) {
    console.error('Tab close logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Refresh token endpoint
router.post('/refresh-token', authMiddleware, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const newToken = await refreshToken(token);
    
    res.status(200).json({ accessToken: newToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Unable to refresh token' });
  }
});

// Logout endpoint
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    await invalidateToken(token);

    const cookieHeader = clearAuthCookie();
    res.setHeader("Set-Cookie", cookieHeader);
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Validate token (useful for client-side token validation)
router.post('/validate-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false });
    }
    
    const token = authHeader.split(' ')[1];
    await verifyJWT(token);
    
    res.status(200).json({ valid: true });
  } catch (error) {
    res.status(200).json({ valid: false });
  }
});

export default router;