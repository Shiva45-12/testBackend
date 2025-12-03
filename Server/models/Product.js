import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // Product Image from Cloudinary
  image: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  
  // Product Details
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['milk', 'ghee', 'curd', 'paneer', 'cheese', 'butter', 'other'],
    lowercase: true
  },
  
  // Pricing
  originalPrice: {
    type: Number,
    required: [true, 'Original price is required'],
    min: [1, 'Price must be at least 1']
  },
  
  discountedPrice: {
    type: Number,
    required: [true, 'Discounted price is required'],
    min: [1, 'Discounted price must be at least 1'],
    validate: {
      validator: function(value) {
        return value <= this.originalPrice;
      },
      message: 'Discounted price cannot be higher than original price'
    }
  },
  
  // Discount Information
  discountPercentage: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0
  },
  
  // Product Description
  description: {
    type: String,
    trim: true
  },
  
  // Tags for search/filter
  tags: [{
    type: String,
    lowercase: true
  }],
  
  // Stock and Availability
  inStock: {
    type: Boolean,
    default: true
  },
  
  stockQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  
  // Ratings and Reviews
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // Popularity Metrics
  views: {
    type: Number,
    default: 0
  },
  
  salesCount: {
    type: Number,
    default: 0
  },
  
  // Featured/Popular Flags
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isPopular: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
  
}, {
  timestamps: true
});

// Calculate discount percentage before saving
productSchema.pre('save', function(next) {
  if (this.originalPrice && this.discountedPrice) {
    const discount = ((this.originalPrice - this.discountedPrice) / this.originalPrice) * 100;
    this.discountPercentage = Math.round(discount);
  }
  next();
});

// Indexes for better query performance
productSchema.index({ category: 1, isPopular: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ discountPercentage: -1 });

// Virtual for saving amount
productSchema.virtual('savingAmount').get(function() {
  return this.originalPrice - this.discountedPrice;
});

const Product = mongoose.model('Product', productSchema);

export default Product;