import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['milk', 'dahi', 'ghee', 'buttermilk', 'cheese', 'cream']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['liter', 'kg', 'gram', 'ml']
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'out-of-stock', 'discontinued'],
    default: 'available'
  }
}, {
  timestamps: true
});

export default mongoose.model('Product', productSchema);