// Server/controllers/imageController.js
import multer from 'multer';
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Image from '../models/imageModel.js';
import { v4 as uuidv4 } from 'uuid';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: async (req, file) => {
    return {
      folder: 'dairy-products',
      public_id: `${Date.now()}-${uuidv4().slice(0, 8)}`,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' }
      ]
    };
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Create multer instance
export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Upload image to Cloudinary
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get Cloudinary result
    const cloudinaryResult = req.file;

    // Save to database
    const image = new Image({
      filename: cloudinaryResult.filename,
      originalName: req.file.originalname || cloudinaryResult.originalname,
      mimeType: req.file.mimetype || cloudinaryResult.mimetype,
      size: cloudinaryResult.size || req.file.size,
      path: cloudinaryResult.path,
      url: cloudinaryResult.secure_url || cloudinaryResult.url,
      cloudinaryId: cloudinaryResult.public_id,
      uploadedBy: req.user ? req.user.id : null,
      category: req.body.category || 'other',
      metadata: {
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
        bytes: cloudinaryResult.bytes,
        resource_type: cloudinaryResult.resource_type,
        created_at: cloudinaryResult.created_at,
        description: req.body.description
      }
    });

    await image.save();

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully to Cloudinary',
      image: {
        id: image._id,
        url: image.url,
        cloudinaryId: image.cloudinaryId,
        originalName: image.originalName,
        size: image.size,
        category: image.category,
        metadata: {
          width: image.metadata.width,
          height: image.metadata.height,
          format: image.metadata.format
        }
      }
    });

  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Upload failed',
      error: err.message 
    });
  }
};

// Get all images
export const getAllImages = async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('url cloudinaryId originalName size category metadata createdAt');

    const total = await Image.countDocuments(query);

    res.json({
      success: true,
      images,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch images',
      error: err.message 
    });
  }
};

// Get image info
export const getImageInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ 
        success: false,
        message: 'Image not found' 
      });
    }

    res.json({
      success: true,
      image
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch image info',
      error: err.message 
    });
  }
};

// Update image metadata
export const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, isActive, description } = req.body;

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ 
        success: false,
        message: 'Image not found' 
      });
    }

    if (category) image.category = category;
    if (isActive !== undefined) image.isActive = isActive;
    
    if (description) {
      image.metadata.description = description;
    }

    await image.save();

    res.json({
      success: true,
      message: 'Image updated successfully',
      image
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Update failed',
      error: err.message 
    });
  }
};

// Delete image from Cloudinary and database
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ 
        success: false,
        message: 'Image not found' 
      });
    }

    // Delete from Cloudinary
    if (image.cloudinaryId) {
      try {
        await cloudinary.v2.uploader.destroy(image.cloudinaryId);
        console.log(`Deleted from Cloudinary: ${image.cloudinaryId}`);
      } catch (cloudinaryErr) {
        console.error('Cloudinary delete error:', cloudinaryErr);
        // Continue with DB deletion even if Cloudinary fails
      }
    }

    // Delete from database
    await Image.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Image deleted successfully from Cloudinary and database'
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Delete failed',
      error: err.message 
    });
  }
};

// Get optimized image URL with transformations
export const getOptimizedImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { width, height, quality, crop } = req.query;

    const image = await Image.findById(id);

    if (!image || !image.cloudinaryId) {
      return res.status(404).json({ 
        success: false,
        message: 'Image not found' 
      });
    }

    // Generate transformed URL
    const transformations = [];
    
    if (width || height) {
      transformations.push({
        width: width ? parseInt(width) : null,
        height: height ? parseInt(height) : null,
        crop: crop || 'fill'
      });
    }
    
    if (quality) {
      transformations.push({ quality: quality });
    }

    const transformedUrl = cloudinary.v2.url(image.cloudinaryId, {
      transformation: transformations
    });

    res.json({
      success: true,
      originalUrl: image.url,
      optimizedUrl: transformedUrl,
      transformations: {
        width: width || 'original',
        height: height || 'original',
        quality: quality || 'auto'
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate optimized URL',
      error: err.message 
    });
  }
};

// Upload multiple images
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No files uploaded' 
      });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const image = new Image({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        url: file.secure_url || file.url,
        cloudinaryId: file.public_id,
        uploadedBy: req.user ? req.user.id : null,
        category: req.body.category || 'other',
        metadata: {
          width: file.width,
          height: file.height,
          format: file.format,
          bytes: file.bytes
        }
      });

      await image.save();
      uploadedImages.push(image);
    }

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      images: uploadedImages.map(img => ({
        id: img._id,
        url: img.url,
        cloudinaryId: img.cloudinaryId,
        originalName: img.originalName
      }))
    });
  } catch (err) {
    console.error('Multiple upload error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Multiple upload failed',
      error: err.message 
    });
  }
};

// Make sure ALL exports are listed
export default {
  upload,
  uploadImage,
  getAllImages,
  getImageInfo,
  updateImage,
  deleteImage,
  getOptimizedImage,
  uploadMultipleImages
};