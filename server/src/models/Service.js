import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true },
    gu: { type: String, required: true },
  },
  category: {
    type: String,
    enum: ['HAIR', 'BEARD', 'FACIAL', 'SPA'],
    required: true,
  },
  duration: { type: Number, required: true }, // in minutes
  price: { type: Number, required: true },    // in INR
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

export const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);
