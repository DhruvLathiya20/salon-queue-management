import { Router } from 'express';
import { handleGetServices } from '../controllers/serviceController.js';

const router = Router();

router.get('/', handleGetServices);

export default router;
