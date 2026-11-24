import { Router } from 'express';
import {
  handleJoinQueue,
  handleGetLiveQueue,
  handleGetTicketStatus,
  handleCancelTicket,
  handleCallTicket,
  handleStartTicket,
  handleCompleteTicket,
} from '../controllers/queueController.js';

const router = Router();

router.post('/join', handleJoinQueue);
router.get('/live', handleGetLiveQueue);
router.get('/status/:id', handleGetTicketStatus);

// Ticket lifecycle mutations
router.patch('/:id/cancel', handleCancelTicket);
router.patch('/:id/call', handleCallTicket);
router.patch('/:id/start', handleStartTicket);
router.patch('/:id/done', handleCompleteTicket);

export default router;
