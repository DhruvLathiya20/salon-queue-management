import { Router } from 'express';
import {
  handleJoinQueue,
  handleWalkIn,
  handleGetLiveQueue,
  handleGetReceptionBoard,
  handleGetTicketStatus,
  handleCancelTicket,
  handleCallTicket,
  handleStartTicket,
  handleCompleteTicket,
  handleMarkNoShow,
  handleGetDisplayData,
} from '../controllers/queueController.js';

const router = Router();

// Intake endpoints
router.post('/join', handleJoinQueue);
router.post('/walkin', handleWalkIn);

// Snapshots
router.get('/live', handleGetLiveQueue);
router.get('/reception', handleGetReceptionBoard);
router.get('/display', handleGetDisplayData);
router.get('/status/:id', handleGetTicketStatus);

// Transitions
router.patch('/:id/cancel', handleCancelTicket);
router.patch('/:id/call', handleCallTicket);
router.patch('/:id/start', handleStartTicket);
router.patch('/:id/done', handleCompleteTicket);
router.patch('/:id/no-show', handleMarkNoShow);

export default router;
