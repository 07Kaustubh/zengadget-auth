import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { APIError } from '../errors/APIError.js';
import { HttpStatus } from '../constants/httpStatus.js';

// Allowed file extensions and their MIME types
const ALLOWED_FILE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const generateSecureFilename = (originalname) => {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(originalname).toLowerCase();
    // Remove any path traversal attempts and use only the extension
    const safeExtension = extension.replace(/[^.a-z0-9]/gi, '');
    return `${randomBytes}${safeExtension ? '.' + safeExtension.replace(/^\.+/, '') : ''}`;
  };

  export const ensureUploadDir = async (dir) => {
    try {
      await fs.access(dir);
    } catch (error) {
      await fs.mkdir(dir, { recursive: true });
    }
  };

  export const fileFilter = (req, file, callback) => {
    // Check if the file type is allowed
    if (ALLOWED_FILE_TYPES[file.mimetype]) {
      callback(null, true);
    } else {
      callback(
        new APIError(
          `Invalid file type. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`,
          HttpStatus.BAD_REQUEST
        ), 
        false
      );
    }
  };

  export const storage = multer.diskStorage({
    destination: async (req, file, callback) => {
      const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
      await ensureUploadDir(uploadsDir);
      callback(null, uploadsDir);
    },
    filename: (req, file, callback) => {
      callback(null, generateSecureFilename(file.originalname));
    }
  });

  export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE
    }
  });

  export const validateFile = (file) => {
    if (!file) {
      throw new APIError('No file provided', HttpStatus.BAD_REQUEST);
    }
  
    if (!ALLOWED_FILE_TYPES[file.mimetype]) {
      throw new APIError(`Unsupported file type: ${file.mimetype}`, HttpStatus.BAD_REQUEST);
    }
    
    if (file.size > MAX_FILE_SIZE) {
      throw new APIError(
        `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        HttpStatus.BAD_REQUEST
      );
    }
  
    return true;
  };

  export const getFileUrl = (filename, host) => {
    return `http://${host}/api/images/${filename}`;
  };

  export const handleFileUpload = async (file, directory, customFilename = null) => {
    try {
      // Validate the file
      validateFile(file);
  
      // Ensure the upload directory exists
      await ensureUploadDir(directory);
  
      // Generate filename (either custom or secure random)
      let filename;
      if (customFilename) {
        // Get extension from original file
        const originalExt = path.extname(file.originalname).toLowerCase();
        // Use custom filename with original extension
        filename = `${customFilename}${originalExt}`;
      } else {
        filename = generateSecureFilename(file.originalname);
      }
  
      // Full path where the file will be saved
      const filepath = path.join(directory, filename);
  
      // Save the file
      await fs.writeFile(filepath, file.buffer);
  
      return {
        success: true,
        filename,
        path: filepath
      };
    } catch (error) {
      console.error('Error handling file upload:', error);
      
      // If it's already an APIError, rethrow it
      if (error instanceof APIError) {
        throw error;
      }
      
      // Otherwise, wrap it in an APIError
      throw new APIError(
        'Failed to process the file upload',
        HttpStatus.INTERNAL_SERVER_ERROR,
        error
      );
    }
  };