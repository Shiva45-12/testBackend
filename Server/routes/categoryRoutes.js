import express from 'express';
import { 
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryHierarchy,
  getFeaturedCategories,
  createDefaultCategories
} from '../controllers/categoryController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { upload } from '../controllers/imageController.js';

const router = express.Router();

// Public routes
router.get('/categories', getAllCategories);
router.get('/categories/featured', getFeaturedCategories);
router.get('/categories/hierarchy', getCategoryHierarchy);
router.get('/categories/:identifier', getCategory); // Can be ID or slug

// Admin routes (protected)
router.post('/categories/default', authenticateToken, createDefaultCategories);
router.post('/categories', authenticateToken, upload.single('image'), createCategory);
router.put('/categories/:id', authenticateToken, upload.single('image'), updateCategory);
router.delete('/categories/:id', authenticateToken, deleteCategory);

export default router;