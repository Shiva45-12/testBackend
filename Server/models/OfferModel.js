// Server/models/offerModel.js
import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['marquee', 'banner', 'popup', 'notification'],
    default: 'marquee'
  },
  active: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  backgroundColor: {
    type: String,
    default: '#ff0000'
  },
  textColor: {
    type: String,
    default: '#ffffff'
  },
  link: {
    type: String,
    default: null
  },
  target: {
    type: String,
    enum: ['_blank', '_self'],
    default: '_self'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for active offers
offerSchema.index({ active: 1, startDate: -1, priority: -1 });

const Offer = mongoose.model('Offer', offerSchema);

export default Offer;