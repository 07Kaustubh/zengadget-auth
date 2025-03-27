import express from 'express';
import { 
  getAllGadgets, 
  getDevices, 
  getAllUsers, 
  deleteUser, 
  deleteGadget,
  deleteGadgetByCategoryAndName 
} from '../services/dashboard.service.js';
import { deleteUserByUsername } from '../services/user.service.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get all dashboard data (protected by authentication)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Check if user has admin role (you may need to add role to your JWT token)
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Fetch all required data
    const [gadgets, devices, users] = await Promise.all([
      getAllGadgets(),
      getDevices(),
      getAllUsers()
    ]);

    return res.status(200).json({
      success: true,
      gadgets,
      devices,
      users
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete a user (admin only)
router.delete('/users/:userId', authMiddleware, async (req, res) => {
  try {
    // Check for admin role
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { userId } = req.params;
    const result = await deleteUser(userId);
    
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete a gadget (admin only)
router.delete('/gadgets/:gadgetId', authMiddleware, async (req, res) => {
  try {
    // Check for admin role
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { gadgetId } = req.params;
    const result = await deleteGadget(gadgetId);
    
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error("Error deleting gadget:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

router.delete('/gadgets/by-category-name', authMiddleware, async (req, res) => {
    try {
      // Check for admin role
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }
  
      const { category_name, gadget_name } = req.body;
  
      if (!category_name || !gadget_name) {
        return res.status(400).json({
          success: false,
          message: "Missing category or gadget name."
        });
      }
  
      const result = await deleteGadgetByCategoryAndName(category_name, gadget_name);
      
      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      console.error("Error deleting gadget:", error);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  });

  router.delete('/users/by-username', authMiddleware, async (req, res) => {
    try {
      // Check for admin role
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }
  
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
      console.error("Error deleting user by username:", error);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  });

export default router;