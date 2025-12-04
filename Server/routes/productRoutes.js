import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getPopularProducts,
  getProductsByCategory,
  markAsPopular,
  getDiscountedProducts,
  updateProductStock,
  getCategoriesWithCount
} from '../controllers/productController.js';

// ✅ Correct Cloudinary compatible multer (memoryStorage)
import upload from '../middlewares/upload.js';

import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Simple auth middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: "No token provided" 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: "Invalid token" 
    });
  }
};

// Simple role check
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: "Insufficient permissions" 
      });
    }
    
    next();
  };
};

// Public Routes
router.get('/get-product', getProducts); 
router.get('/popular', getPopularProducts); 
router.get('/category/:category', getProductsByCategory); 
router.get('/discounted', getDiscountedProducts); 
router.get('/categories', getCategoriesWithCount); 
router.get('/:id', getProductById); 

// Protected Routes (Admin only)
router.post(
  '/product',
  verifyToken,
  requireRole('admin'),
  upload.single('image'),   // ✅ FIXED
  createProduct
);

router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  upload.single('image'),   // ✅ FIXED
  updateProduct
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  deleteProduct
);

router.patch(
  '/:id/popular',
  verifyToken,
  requireRole('admin'),
  markAsPopular
);

router.patch(
  '/:id/stock',
  verifyToken,
  requireRole('admin'),
  updateProductStock
);

export default router;
