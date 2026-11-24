import { Router } from 'express';
import {
  handleJoinQueue,
  handleGetLiveQueue,
  handleGetTicketStatus,
} from '../controllers/queueController.js';

const router = Router();

router.post('/join', handleJoinQueue);
router.get('/live', handleGetLiveQueue);
router.get('/status/:id', handleGetTicketStatus);

export default router;
