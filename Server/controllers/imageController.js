import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Image from '../models/imageModel.js';  // This will now work
import { v4 as uuidv4 } from 'uuid';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/images';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `${uniqueId}${extension}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Upload image
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Construct URL (adjust based on your domain)
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/api/images/${req.file.filename}`;

    // Save to database
    const image = new Image({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: imageUrl,
      uploadedBy: req.user ? req.user.id : null,
      category: req.body.category || 'other',
      metadata: {
        width: req.body.width,
        height: req.body.height,
        description: req.body.description
      }
    });

    await image.save();

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: {
        id: image._id,
        filename: image.filename,
        url: image.url,
        originalName: image.originalName,
        size: image.size,
        category: image.category
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Get image by filename
export const getImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const image = await Image.findOne({ filename });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.sendFile(path.resolve(image.path));
  } catch (err) {
    res.status(500).json({ message: err.message });
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
      .select('filename url originalName size category createdAt');

    const total = await Image.countDocuments(query);

    res.json({
      images,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get image info
export const getImageInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.json(image);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update image
export const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, isActive, description } = req.body;

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    if (category) image.category = category;
    if (isActive !== undefined) image.isActive = isActive;
    
    if (description) {
      image.metadata.description = description;
    }

    await image.save();

    res.json({
      message: 'Image updated successfully',
      image
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete image
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(image.path)) {
      fs.unlinkSync(image.path);
    }

    await Image.findByIdAndDelete(id);

    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// REMOVE THE MODEL DEFINITION FROM HERE - IT SHOULD BE IN A SEPARATE FILE