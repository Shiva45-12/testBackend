// Server/models/imageModel.js
import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String
  },
  url: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String,
    required: true,
    unique: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  category: {
    type: String,
    enum: ['product', 'banner', 'profile', 'other'],
    default: 'other'
  },
  description: {
    type: String
  },
  format: {
    type: String
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
imageSchema.index({ cloudinaryId: 1 });
imageSchema.index({ category: 1 });
imageSchema.index({ uploadedBy: 1 });
imageSchema.index({ createdAt: -1 });
imageSchema.index({ isActive: 1 });

const Image = mongoose.model('Image', imageSchema);

export default Image;