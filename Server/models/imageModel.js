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
    unique: true,
    sparse: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  category: {
    type: String,
    enum: ['product', 'store', 'banner', 'profile', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Object,
    default: {
      width: null,
      height: null,
      format: null,
      bytes: null,
      resource_type: 'image',
      description: ''
    }
  }
}, {
  timestamps: true
});

// Index for searching
imageSchema.index({ cloudinaryId: 1 });
imageSchema.index({ category: 1, isActive: 1 });
imageSchema.index({ uploadedBy: 1, createdAt: -1 });

const Image = mongoose.model('Image', imageSchema);

export default Image;