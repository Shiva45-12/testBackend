import cloudinary from 'cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
// FIXED: Use only one configuration method
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/summer-sale');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Configuration for File Upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'summer-sale-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// FIXED: Helper function to remove local file
const removeLocalFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Upload Summer Sale Image
export const uploadSummerSaleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image file'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'dairy-app/summer-sale',
      resource_type: 'auto',
      transformation: [
        { width: 1200, height: 600, crop: 'fill' }, // Perfect for banner
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      tags: ['summer-sale', 'dairy', 'banner']
    });

    // Remove local file after upload
    removeLocalFile(req.file.path);

    res.status(201).json({
      success: true,
      message: 'Summer sale image uploaded successfully',
      data: {
        id: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        created_at: result.created_at,
        tags: result.tags
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up local file if exists
    if (req.file && req.file.path) {
      removeLocalFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get All Summer Sale Images
export const getSummerSaleImages = async (req, res) => {
  try {
    // Fetch images from Cloudinary folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'dairy-app/summer-sale',
      max_results: 10,
      tags: true
    });

    const images = result.resources.map(image => ({
      id: image.public_id,
      url: image.secure_url,
      format: image.format,
      width: image.width,
      height: image.height,
      size: image.bytes,
      created_at: image.created_at,
      tags: image.tags || []
    }));

    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });

  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch images',
      error: error.message
    });
  }
};

// Get Single Summer Sale Image
export const getSummerSaleImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const result = await cloudinary.api.resource(imageId);

    res.status(200).json({
      success: true,
      data: {
        id: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        created_at: result.created_at,
        tags: result.tags || []
      }
    });

  } catch (error) {
    console.error('Fetch error:', error);
    
    if (error.message && error.message.includes('Resource not found')) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch image',
      error: error.message
    });
  }
};

// Update Summer Sale Image (Replace)
export const updateSummerSaleImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a new image file'
      });
    }

    // Extract public_id without extension if needed
    let publicId = imageId;
    if (imageId.includes('/')) {
      // If it's a full path, use it as is
      publicId = imageId;
    } else {
      // Otherwise, prepend the folder
      publicId = `dairy-app/summer-sale/${imageId}`;
    }

    // Upload new image (Cloudinary will replace if same public_id)
    const result = await cloudinary.uploader.upload(req.file.path, {
      public_id: publicId,
      overwrite: true,
      resource_type: 'auto',
      transformation: [
        { width: 1200, height: 600, crop: 'fill' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      tags: ['summer-sale', 'dairy', 'banner', 'updated']
    });

    // Remove local file
    removeLocalFile(req.file.path);

    res.status(200).json({
      success: true,
      message: 'Summer sale image updated successfully',
      data: {
        id: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        created_at: result.created_at,
        tags: result.tags
      }
    });

  } catch (error) {
    console.error('Update error:', error);
    
    // Clean up local file
    if (req.file && req.file.path) {
      removeLocalFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update image',
      error: error.message
    });
  }
};

// Delete Summer Sale Image
export const deleteSummerSaleImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    let publicId = imageId;
    if (!imageId.includes('/')) {
      publicId = `dairy-app/summer-sale/${imageId}`;
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Summer sale image deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found or already deleted'
      });
    }

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

// Generate Optimized URL for Summer Sale Banner
export const generateOptimizedImageUrl = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { width = 1200, height = 600, quality = 'auto' } = req.query;

    let publicId = imageId;
    if (!imageId.includes('/')) {
      publicId = `dairy-app/summer-sale/${imageId}`;
    }

    // Generate optimized URL
    const optimizedUrl = cloudinary.url(publicId, {
      width: parseInt(width),
      height: parseInt(height),
      crop: 'fill',
      quality: quality,
      fetch_format: 'auto',
      secure: true
    });

    res.status(200).json({
      success: true,
      data: {
        original_id: publicId,
        optimized_url: optimizedUrl,
        width: parseInt(width),
        height: parseInt(height),
        quality: quality
      }
    });

  } catch (error) {
    console.error('URL generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate optimized URL',
      error: error.message
    });
  }
};

// FIXED: Add middleware for error handling
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};