import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleFileUpload, getFileUrl } from '../utils/fileUpload.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(path.dirname(path.dirname(__dirname)), 'data', 'uploads');

/**
 * POST endpoint for single file upload
 */
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file received'
      });
    }

    const result = await handleFileUpload(req.file, uploadDir);

    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: result.error || 'Error uploading file'
      });
    }

    // Generate URL for accessing the file
    const fileUrl = getFileUrl(result.filename, req.get('host'));

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      filename: result.filename,
      fileUrl
    });
  } catch (error) {
    console.error('Error in upload route:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while uploading file'
    });
  }
});

/**
 * POST endpoint for multiple file uploads
 */
router.post('/files', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files received'
      });
    }

    const uploadResults = [];
    const host = req.get('host');

    for (const file of req.files) {
      const result = await handleFileUpload(file, uploadDir);
      
      if (result.success) {
        uploadResults.push({
          originalName: file.originalname,
          filename: result.filename,
          fileUrl: getFileUrl(result.filename, host)
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${uploadResults.length} files uploaded successfully`,
      files: uploadResults
    });
  } catch (error) {
    console.error('Error in multiple upload route:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while uploading files'
    });
  }
});

export default router;