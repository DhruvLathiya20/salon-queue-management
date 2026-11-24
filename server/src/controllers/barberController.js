import {
  getBarbers,
  callNextForBarber,
  toggleBarberBreak,
  getBarberStationData,
} from '../services/queueService.js';

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

export const handleGetBarberStation = async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    const data = await getBarberStationData(slugOrId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const handleCallNextForBarber = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await callNextForBarber(id);
    res.json({
      success: true,
      message: 'Next customer called successfully',
      data: result,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const handleToggleBarberBreak = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedBarber = await toggleBarberBreak(id);
    res.json({
      success: true,
      message: `Barber break status updated to ${updatedBarber.isOnBreak ? 'ON BREAK' : 'AVAILABLE'}`,
      data: updatedBarber,
    });
  } catch (error) {
    next(error);
  }
};
