import {
  joinQueue,
  getLiveQueueStats,
  checkSalonOpenStatus,
  getQueueTicketById,
  cancelQueueTicket,
  callQueueTicket,
  startServiceQueueTicket,
  completeQueueTicket,
} from '../services/queueService.js';

export const handleJoinQueue = async (req, res, next) => {
  try {
    const { customerName, customerPhone, serviceIds, preferredBarberId, entryType } = req.body;
    const ticket = await joinQueue({
      customerName,
      customerPhone,
      serviceIds,
      preferredBarberId,
      entryType: entryType || 'ONLINE',
    });

    res.status(201).json({
      success: true,
      message: 'Queue entry created successfully',
      data: ticket,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        code: error.code,
        existingTicket: error.existingTicket,
      });
    }
    next(error);
  }
};

export const handleGetLiveQueue = async (req, res, next) => {
  try {
    const stats = await getLiveQueueStats();
    const salonStatus = await checkSalonOpenStatus();
    res.json({
      success: true,
      data: {
        stats,
        salonStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await getQueueTicketById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Queue ticket not found',
      });
    }
    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const handleCancelTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await cancelQueueTicket(id);
    res.json({
      success: true,
      message: 'Queue ticket cancelled successfully',
      data: updated,
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

export const handleCallTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { barberId } = req.body || {};
    const updated = await callQueueTicket(id, barberId);
    res.json({
      success: true,
      message: 'Customer called to chair',
      data: updated,
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

export const handleStartTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await startServiceQueueTicket(id);
    res.json({
      success: true,
      message: 'Service started',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const handleCompleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await completeQueueTicket(id);
    res.json({
      success: true,
      message: 'Service completed',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
