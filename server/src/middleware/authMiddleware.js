import { getSalonSettings } from '../services/queueService.js';

/**
 * Authorization middleware for Salon Owner / Admin operations.
 * Validates 'x-admin-pin' header or query against the configured salon admin PIN.
 */
export const requireAdminAuth = async (req, res, next) => {
  try {
    const enteredPin =
      req.headers['x-admin-pin'] ||
      req.headers['authorization']?.replace('Bearer ', '') ||
      req.query?.adminPin;

    const settings = await getSalonSettings();
    const validPin = settings.adminPin || '1234';

    if (!enteredPin || String(enteredPin).trim() !== String(validPin).trim()) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or missing Salon Owner PIN',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error: ' + error.message,
    });
  }
};
