import { Router } from 'express';
import { handleGetBarbers } from '../controllers/barberController.js';

const router = Router();

router.get('/', handleGetBarbers);

export default router;
