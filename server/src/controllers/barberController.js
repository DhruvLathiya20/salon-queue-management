import { getBarbers } from '../services/queueService.js';

export const handleGetBarbers = async (req, res, next) => {
  try {
    const barbers = await getBarbers();
    res.json({
      success: true,
      count: barbers.length,
      data: barbers,
    });
  } catch (error) {
    next(error);
  }
};
