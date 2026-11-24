import mongoose from 'mongoose';

const BarberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  avatarUrl: { type: String, default: '' },
  chairNumber: { type: Number, required: true },
  isWorkingToday: { type: Boolean, default: true },
  isOnBreak: { type: Boolean, default: false },
  currentQueueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue', default: null },
}, { timestamps: true });

export const Barber = mongoose.models.Barber || mongoose.model('Barber', BarberSchema);
