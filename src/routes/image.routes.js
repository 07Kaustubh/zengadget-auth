import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(path.dirname(path.dirname(__dirname)), 'data', 'images');

/**
 * Serve static images with content-type detection
 */
router.get('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // Sanitize filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    const imagePath = path.join(imagesDir, sanitizedFilename);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        error: true,
        message: "Image not found"
      });
    }
    
    // Determine content type based on the file extension
    const ext = path.extname(sanitizedFilename).toLowerCase();
    let contentType = "application/octet-stream";
    
    if (ext === ".png") contentType = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    if (ext === ".webp") contentType = "image/webp";
    if (ext === ".gif") contentType = "image/gif";
    if (ext === ".svg") contentType = "image/svg+xml";
    
    // Read and send the file with proper content type
    const imageBuffer = fs.readFileSync(imagePath);
    res.set("Content-Type", contentType);
    res.send(imageBuffer);
  }
  catch (error) {
    console.error("Error serving image:", error);
    res.status(500).json({
      error: true,
      message: "Failed to serve image"
    });
  }
});

/**
 * Download images (implementing functionality from new.js)
 */
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        error: true, 
        message: "File name is required"
      });
    }
    
    // Sanitize filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    const imagePath = path.join(imagesDir, sanitizedFilename);
    
    console.log("File path is", imagePath);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        error: true,
        message: "File not found"
      });
    }
    
    // Read the file content
    const fileBuffer = fs.readFileSync(imagePath);
    
    // Serve the file for download with appropriate headers (from new.js)
    res.status(200);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error("Error in image download API:", error);
    
    return res.status(500).json({
      error: true,
      message: "Failed to process the request. Please try again later."
    });
  }
});

export default router;