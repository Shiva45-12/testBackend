import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    url: String,
    filename: String,
    path: String
  },
  icon: {
    type: String,
    default: '🥛' // Default icon for dairy
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  metadata: {
    type: Object,
    default: {
      color: '#4CAF50',
      // Add any other metadata specific to dairy products
    }
  }
}, {
  timestamps: true
});

// Create index for faster queries
categorySchema.index({ slug: 1, status: 1 });
categorySchema.index({ parentCategory: 1, displayOrder: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;