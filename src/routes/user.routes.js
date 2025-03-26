import express from 'express';
import { body, validationResult } from 'express-validator';
import { getUserOrCreate } from '../services/auth.service.js';

const router = express.Router();

// Authenticate with Firebase ID token
router.post('/authenticate', [
  body('idToken')
    .notEmpty().withMessage('ID token is required')
    .isString().withMessage('ID token must be a string')
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { idToken } = req.body;
    const result = await getUserOrCreate(idToken);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

export default router;