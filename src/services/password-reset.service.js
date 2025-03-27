import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';

// Store OTPs temporarily (in production, consider using Redis or another solution)
const otpStore = new Map();

/**
 * Verify if a reset token is valid
 * 
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object>} - Verification result
 */
export const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    if (!decoded?.email || decoded.purpose !== 'password-reset') {
      return { success: false, message: "Invalid token" };
    }
    
    return { success: true, message: "Token is valid", email: decoded.email };
  } catch (error) {
    console.error("Token verification error:", error);
    return { success: false, message: "Invalid or expired token" };
  }
};

/**
 * Reset password with either token or OTP
 * Enhanced to support both methods as in new.js
 * 
 * @param {string} token - Reset token (optional)
 * @param {string} otp - One-time password (optional)
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Password reset result
 */
export const resetPasswordCombined = async (token, otp, newPassword) => {
  try {
    if (!newPassword) {
      return { success: false, message: "New password is required" };
    }

    let email = null;

    if (token) {
      // Token-based reset
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        if (!decoded?.email || decoded.purpose !== 'password-reset') {
          return { success: false, message: "Invalid token" };
        }
        
        email = decoded.email;
      } catch (error) {
        return { success: false, message: "Invalid or expired token" };
      }
    } else if (otp) {
      // OTP-based reset
      for (const [userEmail, storedData] of otpStore.entries()) {
        if (storedData.otp === otp) {
          if (storedData.expires < Date.now()) {
            otpStore.delete(userEmail);
            return { success: false, message: "OTP has expired" };
          }
          
          email = userEmail;
          break;
        }
      }
      
      if (!email) {
        return { success: false, message: "Invalid OTP" };
      }
    } else {
      return { success: false, message: "Invalid request. Token or OTP required." };
    }

    // Update password in database
    const db = getDb();
    const result = await db.collection('users').updateOne(
      { email },
      { 
        $set: { 
          password: newPassword, // In production: use hashed password
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return { success: false, message: "User not found" };
    }
    
    // Clean up OTP if used
    if (otp && email) {
      otpStore.delete(email);
    }
    
    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, message: "Failed to reset password" };
  }
};


/**
 * Generate and send password reset OTP or link
 * 
 * @param {string} email - User's email address
 * @returns {Promise<Object>} - Operation result
 */
export const sendPasswordResetEmail = async (email) => {
  try {
    if (!email) {
      return { success: false, message: "Email is required" };
    }
    
    // Check if user exists
    const db = getDb();
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      // Still return success to avoid leaking information about registered emails
      return { success: true, message: "If your email is registered, you'll receive a reset link" };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, {
      otp,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes expiration
    });
    
    // Generate JWT token for reset link
    const token = jwt.sign(
      { email, purpose: 'password-reset' }, 
      process.env.JWT_SECRET_KEY, 
      { expiresIn: '10m' }
    );

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email with OTP and reset link
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset for your account.</p>
        <p><strong>Your OTP:</strong> ${otp}</p>
        <p>Or reset via this link: <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}">Reset Password</a></p>
        <p>This OTP and link will expire in 10 minutes.</p>
        <p>If you did not request this reset, please ignore this email.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    return { 
      success: true, 
      message: "Password reset instructions sent to your email" 
    };
  } catch (error) {
    console.error("Error sending reset email:", error);
    return { 
      success: false, 
      message: "Failed to send reset email. Please try again later." 
    };
  }
};

/**
 * Verify password reset OTP
 * 
 * @param {string} email - User's email address
 * @param {string} otp - OTP to verify
 * @returns {Promise<Object>} - Verification result
 */
export const verifyOTP = async (email, otp) => {
  try {
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      return { success: false, message: "OTP expired or not found" };
    }
    
    if (storedData.expires < Date.now()) {
      otpStore.delete(email);
      return { success: false, message: "OTP has expired" };
    }
    
    if (storedData.otp !== otp) {
      return { success: false, message: "Invalid OTP" };
    }
    
    // Generate a token for password reset
    const resetToken = jwt.sign(
      { email, purpose: 'confirm-reset' },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '5m' }
    );
    
    // Clean up OTP after successful verification
    otpStore.delete(email);
    
    return { 
      success: true, 
      message: "OTP verified successfully", 
      resetToken 
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, message: "Verification failed" };
  }
};

/**
 * Reset user password
 * 
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Password reset result
 */
export const resetPassword = async (token, newPassword) => {
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    if (decoded.purpose !== 'confirm-reset') {
      return { success: false, message: "Invalid reset token" };
    }
    
    const { email } = decoded;
    
    // In a real application, hash the password before storing it
    const db = getDb();
    const result = await db.collection('users').updateOne(
      { email },
      { 
        $set: { 
          password: newPassword, // In production: use hashed password
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return { success: false, message: "User not found" };
    }
    
    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return { success: false, message: "Invalid or expired token" };
    }
    
    console.error("Error resetting password:", error);
    return { success: false, message: "Failed to reset password" };
  }
};