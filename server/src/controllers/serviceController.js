import {
  getActiveServices,
  getAllServices,
  createService,
  updateService,
  toggleServiceActive,
} from '../services/queueService.js';

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

export const handleGetAllServices = async (req, res, next) => {
  try {
    const services = await getAllServices();
    res.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

export const handleCreateService = async (req, res, next) => {
  try {
    const service = await createService(req.body);
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
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

export const handleUpdateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await updateService(id, req.body);
    res.json({
      success: true,
      message: 'Service updated successfully',
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

export const handleToggleServiceActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await toggleServiceActive(id);
    res.json({
      success: true,
      message: `Service ${updated.isActive ? 'enabled' : 'disabled'} successfully`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
