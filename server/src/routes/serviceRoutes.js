import { Router } from 'express';
import {
  handleGetServices,
  handleGetAllServices,
  handleCreateService,
  handleUpdateService,
  handleToggleServiceActive,
} from '../controllers/serviceController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public: Get active services for customer screens
router.get('/', handleGetServices);

// Owner / Admin: Get all services (active + disabled)
router.get('/all', handleGetAllServices);

// Owner / Admin Mutations: Protected with requireAdminAuth
router.post('/', requireAdminAuth, handleCreateService);
router.put('/:id', requireAdminAuth, handleUpdateService);
router.patch('/:id/toggle', requireAdminAuth, handleToggleServiceActive);

export default router;
