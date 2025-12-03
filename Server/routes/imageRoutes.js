import express from 'express';
import { 
  uploadImage, 
  getImage, 
  getAllImages, 
  getImageInfo, 
  updateImage, 
  deleteImage, 
  upload 
} from '../controllers/imageController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Upload image (with multer middleware)
router.post('/upload', authenticateToken, upload.single('image'), uploadImage);

// Get all images (with pagination and filtering)
router.get('/images', getAllImages);

// Get image by filename (serves the actual file)
router.get('/images/:filename', getImage);

// Get image metadata by ID
router.get('/images/info/:id', getImageInfo);

// Update image metadata
router.put('/images/:id', authenticateToken, updateImage);

// Delete image
router.delete('/images/:id', authenticateToken, deleteImage);

export default router;