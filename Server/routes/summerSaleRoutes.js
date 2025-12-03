import express from 'express';
import {
  uploadSummerSaleImage,
  getSummerSaleImages,
  getSummerSaleImage,
  updateSummerSaleImage,
  deleteSummerSaleImage,
  generateOptimizedImageUrl,
  upload,
  handleMulterError
} from '../controllers/summerSaleController.js';

const router = express.Router();

// Routes with proper error handling
router.post('/upload-sale', 
  upload.single('image'), 
  handleMulterError,
  uploadSummerSaleImage
);

router.get('/get-sale', getSummerSaleImages);

router.get('/:imageId', getSummerSaleImage);

router.put('/:imageId', 
  upload.single('image'), 
  handleMulterError,
  updateSummerSaleImage
);

router.delete('/:imageId', deleteSummerSaleImage);

router.get('/:imageId/optimize', generateOptimizedImageUrl);

export default router;