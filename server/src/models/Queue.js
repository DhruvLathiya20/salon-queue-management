import mongoose from 'mongoose';

const QueueSchema = new mongoose.Schema({
  tokenNumber: { type: String, required: true, index: true },
  tokenSequence: { type: Number, required: true },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, index: true },
  entryType: { type: String, enum: ['ONLINE', 'WALK_IN'], default: 'ONLINE' },
  services: [
    {
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
      name: {
        en: String,
        gu: String,
      },
      duration: Number,
      price: Number,
    },
  ],
  totalDuration: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  preferredBarberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Barber', default: null },
  assignedBarberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Barber', default: null },
  status: {
    type: String,
    enum: ['WAITING', 'CALLED', 'IN_CHAIR', 'DONE', 'CANCELLED', 'NO_SHOW'],
    default: 'WAITING',
    index: true,
  },
  createdAt: { type: Date, default: Date.now, index: true },
  calledAt: { type: Date, default: null },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  noShowAt: { type: Date, default: null },
  dateString: { type: String, required: true, index: true },
});

// Compound indexes
QueueSchema.index({ customerPhone: 1, status: 1 });
QueueSchema.index({ status: 1, preferredBarberId: 1, createdAt: 1 });
QueueSchema.index({ dateString: 1, tokenSequence: 1 });

export const Queue = mongoose.models.Queue || mongoose.model('Queue', QueueSchema);
