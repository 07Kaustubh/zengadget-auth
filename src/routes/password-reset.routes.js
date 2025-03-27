import express from 'express';
import { body, validationResult } from 'express-validator';
import { 
  sendPasswordResetEmail,
  verifyOTP,
  resetPassword,
  verifyToken
} from '../services/password-reset.service.js';

const router = express.Router();

/**
 * Request password reset
 * Sends an email with OTP and reset link
 */
router.post('/request', [
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;
  const result = await sendPasswordResetEmail(email);
  
  return res.status(result.success ? 200 : 400).json(result);
});

/**
 * Verify OTP for password reset
 */
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, otp } = req.body;
  const result = await verifyOTP(email, otp);
  
  return res.status(result.success ? 200 : 400).json(result);
});

/**
 * Reset password with token
 */
router.post('/reset', [
  body('token').notEmpty().withMessage('Reset token required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { token, newPassword } = req.body;
  const result = await resetPassword(token, newPassword);
  
  return res.status(result.success ? 200 : 400).json(result);
});

/**
 * Verify if a reset token is valid
 */
router.get('/verify-token', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ success: false, message: "Token is required" });
      }
      
      const result = await verifyToken(token);
      
      if (result.success) {
        return res.status(200).json({ 
          success: true, 
          message: "Token is valid", 
          email: result.email 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: result.message || "Invalid token" 
        });
      }
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }
  });

/**
 * Reset password with token or OTP (combined approach from new.js)
 */
router.post('/reset-combined', async (req, res) => {
    try {
      const { token, otp, newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({ success: false, message: "New password is required" });
      }
      
      if (!token && !otp) {
        return res.status(400).json({ success: false, message: "Token or OTP is required" });
      }
      
      // Password validation (optional - can be implemented with express-validator)
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
      }
      
      const result = await resetPasswordCombined(token, otp, newPassword);
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error("Password reset error:", error);
      return res.status(500).json({ success: false, message: "Failed to reset password" });
    }
  });
  

export default router;