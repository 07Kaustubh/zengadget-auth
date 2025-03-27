import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';

// Allowed file extensions and their MIME types
const ALLOWED_FILE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Generate a secure random filename with original extension
 * @param {string} originalname - Original filename
 * @returns {string} Secure filename
 */
export const generateSecureFilename = (originalname) => {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const extension = path.extname(originalname).toLowerCase();
  // Remove any path traversal attempts and use only the extension
  const safeExtension = extension.replace(/[^.a-z0-9]/gi, '');
  return `${randomBytes}${safeExtension ? '.' + safeExtension.replace(/^\.+/, '') : ''}`;
};

/**
 * Ensure upload directory exists
 * @param {string} dir - Directory path
 */
export const ensureUploadDir = async (dir) => {
  try {
    await fs.access(dir);
  } catch (error) {
    await fs.mkdir(dir, { recursive: true });
  }
};

/**
 * Configure multer file filter to validate file types
 * @param {Object} req - Express request
 * @param {Object} file - Uploaded file
 * @param {Function} callback - Callback function
 */
export const fileFilter = (req, file, callback) => {
  // Check if the file type is allowed
  if (ALLOWED_FILE_TYPES[file.mimetype]) {
    callback(null, true);
  } else {
    callback(
      new Error(`Invalid file type. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`), 
      false
    );
  }
};

/**
 * Configure multer storage for secure file uploads
 */
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

/**
 * Configured multer upload middleware
 */
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

/**
 * Validate an uploaded file for security
 * @param {Object} file - Uploaded file object
 * @returns {Object} Validation result
 */
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, message: 'No file provided' };
  }

  if (!ALLOWED_FILE_TYPES[file.mimetype]) {
    return { valid: false, message: `Unsupported file type: ${file.mimetype}` };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
  }

  return { valid: true };
};