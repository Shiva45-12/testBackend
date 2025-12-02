import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  customer: { type: String, required: true },
  product: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  amount: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'shipped', 'cancelled'], 
    default: 'pending' 
  },
  deliveryBoy: { type: String },
  address: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);