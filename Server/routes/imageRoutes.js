
import express from 'express';
import { 
  uploadImage, 
  getAllImages, 
  getImageInfo, 
  updateImage, 
  deleteImage,
  getOptimizedImage,
  uploadMultipleImages,
  upload 
} from '../controllers/imageController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Debug middleware to catch errors
const debugMiddleware = (handler) => async (req, res, next) => {
  // console.log(` [${req.method}] ${req.url}`);
  // console.log('Headers:', req.headers);
  // console.log('Body:', req.body);
  // console.log('Files:', req.files || req.file);
  
  try {
    await handler(req, res, next);
  } catch (error) {
    // console.error(' ERROR in route handler:', error);
    // console.error('Stack:', error.stack);
    next(error);
  }
};

// Test endpoint
router.get('/test', (req, res) => {
  console.log(' Image routes test endpoint hit');
  res.json({ 
    success: true, 
    message: 'Image routes are working',
    timestamp: new Date().toISOString()
  });
});

// Upload single image 
router.post('/upload', 
  authenticateToken, 
  upload.single('image'), 
  debugMiddleware(uploadImage)  
);

// Upload multiple images
router.post('/upload-multiple', 
  authenticateToken, 
  upload.array('images', 10),
  debugMiddleware(uploadMultipleImages)
);

// Get all images
router.get('/images', debugMiddleware(getAllImages));

// Get image info
router.get('/images/info/:id', debugMiddleware(getImageInfo));

// Get optimized image URL
router.get('/images/optimized/:id', debugMiddleware(getOptimizedImage));

// Update image
router.put('/images/:id', authenticateToken, debugMiddleware(updateImage));

// Delete image
router.delete('/images/:id', authenticateToken, debugMiddleware(deleteImage));

export default router;