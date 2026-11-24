import { Router } from 'express';
import {
  handleGetBarbers,
  handleCallNextForBarber,
  handleToggleBarberBreak,
  handleGetBarberStation,
} from '../controllers/barberController.js';

const router = Router();

router.get('/', handleGetBarbers);
router.get('/station/:slugOrId', handleGetBarberStation);
router.post('/:id/call-next', handleCallNextForBarber);
router.patch('/:id/break', handleToggleBarberBreak);

export default router;
