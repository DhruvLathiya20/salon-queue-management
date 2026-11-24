import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  salonName: { type: String, default: 'Elite Salon' },
  isOnlineQueueOpen: { type: Boolean, default: true },
  openingTime: { type: String, default: '09:00' }, // "HH:mm"
  closingTime: { type: String, default: '21:00' }, // "HH:mm"
  onlineCutoffMinutes: { type: Number, default: 30 },
  adminPin: { type: String, default: '1234' },
}, { timestamps: true });

export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
