import { Router } from 'express';
import {
  getSalonSettings,
  updateSalonSettings,
  getTodayAnalytics,
  toggleBarberDuty,
  createBarber,
} from '../services/queueService.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';

const router = Router();

// ─── Public ──────────────────────────────────────────────────────────────────
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await getSalonSettings();
    res.json({ success: true, data: settings });
  } catch (e) {
    next(e);
  }
});

// ─── Owner Protected ─────────────────────────────────────────────────────────
router.patch('/settings', requireAdminAuth, async (req, res, next) => {
  try {
    const updated = await updateSalonSettings(req.body);
    res.json({ success: true, message: 'Settings updated successfully', data: updated });
  } catch (e) {
    next(e);
  }
});

// Daily analytics snapshot
router.get('/analytics/today', requireAdminAuth, async (req, res, next) => {
  try {
    const data = await getTodayAnalytics();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

// Toggle barber working-today duty status
router.patch('/barbers/:id/duty', requireAdminAuth, async (req, res, next) => {
  try {
    const updated = await toggleBarberDuty(req.params.id);
    res.json({ success: true, message: `Barber duty status toggled`, data: updated });
  } catch (e) {
    next(e);
  }
});

// Add new barber
router.post('/barbers', requireAdminAuth, async (req, res, next) => {
  try {
    const barber = await createBarber(req.body);
    res.status(201).json({ success: true, message: 'Barber added', data: barber });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ success: false, message: e.message });
    next(e);
  }
});

export default router;
