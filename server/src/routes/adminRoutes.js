import { Router } from 'express';
import {
  getSalonSettings,
} from '../services/queueService.js';
import { handleUpdateSettings } from '../controllers/queueController.js';

const router = Router();

router.get('/settings', async (req, res, next) => {
  try {
    const settings = await getSalonSettings();
    res.json({ success: true, data: settings });
  } catch (e) {
    next(e);
  }
});

router.patch('/settings', handleUpdateSettings);

export default router;
