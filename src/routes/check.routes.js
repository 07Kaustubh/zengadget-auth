import express from 'express';
import { addCheckData, getCheckData } from '../services/check.service.js';

const router = express.Router();

/**
 * GET endpoint to fetch all check data
 */
router.get('/', async (req, res) => {
  try {
    const data = await getCheckData();
    res.status(200).json({
      data: data,
      error: false,
      message: "Success"
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ 
      data: {}, 
      error: true, 
      message: "Failed to fetch data" 
    });
  }
});

/**
 * POST endpoint to add new check data
 */
router.post('/', async (req, res) => {
  try {
    // For compatibility with the original code that uses req.text()
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    console.log("Received data:", body);
    
    // Save data to database
    const result = await addCheckData({ message: body });
    
    if (result.success) {
      res.status(200).json({ message: "Data saved successfully" });
    } else {
      res.status(500).json({ error: "Failed to save data" });
    }
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Failed to save data" });
  }
});

export default router;