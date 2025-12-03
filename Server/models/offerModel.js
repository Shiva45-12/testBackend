// Server/models/offerModel.js
import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Offer = mongoose.model('Offer', offerSchema);

export default Offer;