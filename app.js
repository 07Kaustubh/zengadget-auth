import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { setupTokenBlacklist } from './src/utils/jwt.js';
import { connectToDatabase } from './src/config/database.js';
import { setupSessionCollection } from './src/services/session.service.js';
import userRoutes from './src/routes/user.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import categoryRoutes from './src/routes/category.routes.js';
import checkRoutes from './src/routes/check.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import descriptionRoutes from './src/routes/description.routes.js';
import imageRoutes from './src/routes/image.routes.js';
import deviceRoutes from './src/routes/device.routes.js';
import passwordResetRoutes from './src/routes/password-reset.routes.js';
import gadgetRoutes from './src/routes/gadget.routes.js'; 
import uploadRoutes from './src/routes/upload.routes.js'; // Import the new upload routes
import { ensureUploadDir } from './src/utils/fileUpload.js'; // Import directory creation utility
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/check', checkRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/descriptions', descriptionRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/gadgets', gadgetRoutes);
app.use('/api/upload', uploadRoutes); // Register new upload routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Ensure upload directories exist
    const dataDir = path.join(__dirname, 'data');
    const imagesDir = path.join(dataDir, 'images');
    const uploadsDir = path.join(dataDir, 'uploads');
    
    await ensureUploadDir(dataDir);
    await ensureUploadDir(imagesDir);
    await ensureUploadDir(uploadsDir);
    
    await connectToDatabase();
    await setupTokenBlacklist();
    await setupSessionCollection();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();