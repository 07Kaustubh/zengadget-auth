import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { getUserOrCreate } from '../services/auth.service.js';
import { 
  checkUserByEmail,
  findUserByCredentials,
  deleteUserByUsername,
  updateUserProfileWithImage 
} from '../services/user.service.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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

// Check if user exists by email
router.get('/check', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    const result = await checkUserByEmail(email);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error checking user:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
});

// Login with username/password
router.post('/login', [
  body('username').optional().isString(),
  body('password').optional().isString(),
  body('email').optional().isEmail()
], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { username, password, email } = req.body;
    
    // Handle email-based login (OAuth)
    if (email) {
      const user = await checkUserByEmail(email);
      return res.status(200).json({ 
        success: !!user.isReturningUser,
        isReturningUser: user.isReturningUser
      });
    } 
    // Handle username/password login
    else if (username && password) {
      const user = await findUserByCredentials(username, password);
      
      if (user) {
        return res.status(200).json({ 
          success: true, 
          user: { customerId: user.customerId },
          role: user.role 
        });
      } else {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid credentials" 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid login method" 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
});

// Delete user by username
router.delete('/delete-by-username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: "Username is required" 
      });
    }

    const result = await deleteUserByUsername(username);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Error deleting user by username:', error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
});


// Get user session history (for admins)
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    // Check admin permissions
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Admin access required" 
      });
    }
    
    const { uid, email, limit } = req.query;
    const filter = {};
    
    if (uid) filter.uid = uid;
    if (email) filter.email = email;
    
    const db = getDb();
    const sessions = await db.collection('userSessions')
      .find(filter)
      .sort({ lastLogin: -1 })
      .limit(limit ? parseInt(limit) : 100)
      .toArray();
    
    return res.status(200).json({ 
      success: true, 
      data: sessions 
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

router.post('/update-profile', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    const { username, password, address } = req.body;
    const profileImage = req.file;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: "Username is required" 
      });
    }

    const updatedData = {};
    
    if (password) updatedData.password = password;
    if (address) updatedData.address = address;
    
    // Pass image data to the service function
    const result = await updateUserProfileWithImage(username, updatedData, profileImage, req.get('host'));
    
    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        message: "Profile updated successfully!" 
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        message: result.message || "No changes made or user not found" 
      });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to update profile" 
    });
  }
});

export default router;