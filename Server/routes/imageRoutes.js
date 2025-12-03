// Server/routes/imageRoutes.js
import express from 'express';
import upload from '../middlewares/upload.js';
import { uploadImage, getAllImages, deleteImage } from '../controllers/imageController.js';
// import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Upload Image
router.post('/upload', upload.single('image'), uploadImage);

// Get All Images
router.get('/images', getAllImages);

// Delete Image
router.delete('/:id', deleteImage);

export default router;
