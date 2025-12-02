import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }
  },
  items: [{
    id: Number,
    name: String,
    price: Number,
    quantity: Number,
    unit: String
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'card', 'upi'], 
    required: true 
  },
  date: { type: Date, default: Date.now },
  time: { type: String }
}, {
  timestamps: true
});

export default mongoose.model('Payment', paymentSchema);