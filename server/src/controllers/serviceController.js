import { getActiveServices } from '../services/queueService.js';

export const handleGetServices = async (req, res, next) => {
  try {
    const services = await getActiveServices();
    res.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};
