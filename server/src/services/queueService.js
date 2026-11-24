import mongoose from 'mongoose';
import { Queue } from '../models/Queue.js';
import { Service } from '../models/Service.js';
import { Barber } from '../models/Barber.js';
import { Settings } from '../models/Settings.js';
import { getIO } from '../config/socket.js';

export const INITIAL_SERVICES = [
  {
    _id: '65a000000000000000000001',
    name: {
      en: 'Signature Haircut & Styling',
      gu: 'સિગ્નેચર હેરકટ અને સ્ટાઇલિંગ',
    },
    category: 'HAIR',
    duration: 30,
    price: 350,
    isActive: true,
    displayOrder: 1,
  },
  {
    _id: '65a000000000000000000002',
    name: {
      en: 'Royal Beard Grooming & Hot Towel',
      gu: 'રોયલ બિયર્ડ ગ્રૂમિંગ અને હોટ ટુવાલ',
    },
    category: 'BEARD',
    duration: 20,
    price: 200,
    isActive: true,
    displayOrder: 2,
  },
  {
    _id: '65a000000000000000000003',
    name: {
      en: 'Relaxing Ayurvedic Head Massage',
      gu: 'આયુર્વેદિક હેડ મસાજ',
    },
    category: 'SPA',
    duration: 20,
    price: 250,
    isActive: true,
    displayOrder: 3,
  },
  {
    _id: '65a000000000000000000004',
    name: {
      en: 'Deep Cleansing Charcoal Facial',
      gu: 'ડીપ ક્લીન્ઝિંગ ચારકોલ ફેશિયલ',
    },
    category: 'FACIAL',
    duration: 35,
    price: 500,
    isActive: true,
    displayOrder: 4,
  },
  {
    _id: '65a000000000000000000005',
    name: {
      en: 'Anti-Dandruff Scalp Therapy',
      gu: 'ખોડો વિરોધી સ્કેલ્પ થેરાપી',
    },
    category: 'SPA',
    duration: 30,
    price: 400,
    isActive: true,
    displayOrder: 5,
  },
  {
    _id: '65a000000000000000000006',
    name: {
      en: 'Executive Hair Coloring',
      gu: 'એક્ઝિક્યુટિવ હેર કલરિંગ',
    },
    category: 'HAIR',
    duration: 45,
    price: 650,
    isActive: true,
    displayOrder: 6,
  },
];

export const INITIAL_BARBERS = [
  {
    _id: '65b000000000000000000001',
    name: 'Rajesh Kumar',
    slug: 'rajesh',
    chairNumber: 1,
    isWorkingToday: true,
    isOnBreak: false,
    currentQueueId: null,
  },
  {
    _id: '65b000000000000000000002',
    name: 'Amit Patel',
    slug: 'amit',
    chairNumber: 2,
    isWorkingToday: true,
    isOnBreak: true, // Currently on break for testing
    currentQueueId: null,
  },
  {
    _id: '65b000000000000000000003',
    name: 'Vikram Singh',
    slug: 'vikram',
    chairNumber: 3,
    isWorkingToday: true,
    isOnBreak: false,
    currentQueueId: null,
  },
  {
    _id: '65b000000000000000000004',
    name: 'Hitesh Sharma',
    slug: 'hitesh',
    chairNumber: 4,
    isWorkingToday: false, // Off duty today
    isOnBreak: false,
    currentQueueId: null,
  },
];

export const DEFAULT_SETTINGS = {
  salonName: 'Elite Salon',
  isOnlineQueueOpen: true,
  openingTime: '09:00',
  closingTime: '21:00',
  onlineCutoffMinutes: 30,
  adminPin: '1234',
};

// In-memory fallback repository
let memoryStore = {
  services: [...INITIAL_SERVICES],
  barbers: [...INITIAL_BARBERS],
  settings: { ...DEFAULT_SETTINGS },
  queues: [],
};

const isDbConnected = () => mongoose.connection.readyState === 1;

export const seedInitialData = async () => {
  if (isDbConnected()) {
    try {
      const serviceCount = await Service.countDocuments();
      if (serviceCount === 0) {
        await Service.insertMany(INITIAL_SERVICES);
        console.log('[Seed] Inserted initial services into MongoDB.');
      }

      const barberCount = await Barber.countDocuments();
      if (barberCount === 0) {
        await Barber.insertMany(INITIAL_BARBERS);
        console.log('[Seed] Inserted initial barbers into MongoDB.');
      }

      const settings = await Settings.findOne();
      if (!settings) {
        await Settings.create(DEFAULT_SETTINGS);
        console.log('[Seed] Initialized salon operational settings.');
      }
    } catch (err) {
      console.warn('[Seed Warning]', err.message);
    }
  }
};

export const getActiveServices = async () => {
  if (isDbConnected()) {
    return await Service.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
  }
  return memoryStore.services.filter((s) => s.isActive);
};

export const getBarbers = async () => {
  if (isDbConnected()) {
    return await Barber.find().sort({ chairNumber: 1 }).lean();
  }
  return memoryStore.barbers;
};

export const getSalonSettings = async () => {
  if (isDbConnected()) {
    let settings = await Settings.findOne().lean();
    if (!settings) {
      settings = await Settings.create(DEFAULT_SETTINGS);
    }
    return settings;
  }
  return memoryStore.settings;
};

export const checkSalonOpenStatus = async () => {
  const settings = await getSalonSettings();
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTotalMins = currentHours * 60 + currentMinutes;

  const [openH, openM] = settings.openingTime.split(':').map(Number);
  const [closeH, closeM] = settings.closingTime.split(':').map(Number);
  const openTotalMins = openH * 60 + openM;
  const closeTotalMins = closeH * 60 + closeM;

  const cutoffMins = settings.onlineCutoffMinutes || 30;
  const onlineCutoffTotalMins = closeTotalMins - cutoffMins;

  const isSalonOpen = currentTotalMins >= openTotalMins && currentTotalMins < closeTotalMins;
  const isOnlineIntakeAllowed =
    settings.isOnlineQueueOpen &&
    isSalonOpen &&
    currentTotalMins < onlineCutoffTotalMins;

  return {
    isSalonOpen,
    isOnlineIntakeAllowed,
    isOnlineQueueOpen: settings.isOnlineQueueOpen,
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
    cutoffMinutes: cutoffMins,
  };
};

export const getLiveQueueStats = async () => {
  const today = new Date().toISOString().split('T')[0];

  let waitingList = [];
  let calledList = [];
  let inChairList = [];
  let workingBarbersCount = 0;

  if (isDbConnected()) {
    waitingList = await Queue.find({ status: 'WAITING', dateString: today }).sort({ createdAt: 1 }).lean();
    calledList = await Queue.find({ status: 'CALLED', dateString: today }).lean();
    inChairList = await Queue.find({ status: 'IN_CHAIR', dateString: today }).lean();
    workingBarbersCount = await Barber.countDocuments({ isWorkingToday: true, isOnBreak: false });
  } else {
    waitingList = memoryStore.queues.filter((q) => q.status === 'WAITING' && q.dateString === today);
    calledList = memoryStore.queues.filter((q) => q.status === 'CALLED' && q.dateString === today);
    inChairList = memoryStore.queues.filter((q) => q.status === 'IN_CHAIR' && q.dateString === today);
    workingBarbersCount = memoryStore.barbers.filter((b) => b.isWorkingToday && !b.isOnBreak).length;
  }

  const totalWaitingMinutes = waitingList.reduce((acc, curr) => acc + (curr.totalDuration || 30), 0);
  const effectiveBarbers = Math.max(1, workingBarbersCount);
  const estimatedWaitMinutes = Math.round(totalWaitingMinutes / effectiveBarbers);

  return {
    waitingCount: waitingList.length,
    calledCount: calledList.length,
    inChairCount: inChairList.length,
    workingBarbersCount,
    estimatedWaitMinutes,
  };
};

export const joinQueue = async ({ customerName, customerPhone, serviceIds, preferredBarberId, entryType = 'ONLINE' }) => {
  if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2 || customerName.trim().length > 50) {
    const error = new Error('Please enter a valid customer name (between 2 and 50 characters).');
    error.status = 400;
    throw error;
  }

  const cleanedPhone = String(customerPhone || '').replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
    const error = new Error('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    const error = new Error('Please select at least one service.');
    error.status = 400;
    throw error;
  }
  if (serviceIds.length > 3) {
    const error = new Error('You may select a maximum of 3 services per session.');
    error.status = 400;
    throw error;
  }

  const salonStatus = await checkSalonOpenStatus();
  if (entryType === 'ONLINE' && !salonStatus.isOnlineIntakeAllowed) {
    const error = new Error('Online queue joining is currently closed. Walk-ins remain welcome at the salon reception.');
    error.status = 403;
    error.code = 'ONLINE_QUEUE_CLOSED';
    throw error;
  }

  const today = new Date().toISOString().split('T')[0];
  let existingActiveTicket = null;

  if (isDbConnected()) {
    existingActiveTicket = await Queue.findOne({
      customerPhone: cleanedPhone,
      status: { $in: ['WAITING', 'CALLED', 'IN_CHAIR'] },
    }).lean();
  } else {
    existingActiveTicket = memoryStore.queues.find(
      (q) => q.customerPhone === cleanedPhone && ['WAITING', 'CALLED', 'IN_CHAIR'].includes(q.status)
    );
  }

  if (existingActiveTicket) {
    const error = new Error(
      `You already have an active ticket in the queue (${existingActiveTicket.tokenNumber}). Please wait until your turn is completed.`
    );
    error.status = 409;
    error.existingTicket = existingActiveTicket;
    throw error;
  }

  const allServices = await getActiveServices();
  const selectedServices = allServices
    .filter((s) => serviceIds.includes(String(s._id)))
    .map((s) => ({
      serviceId: s._id,
      name: s.name,
      duration: s.duration,
      price: s.price,
    }));

  if (selectedServices.length === 0) {
    const error = new Error('Selected services could not be found or are inactive.');
    error.status = 400;
    throw error;
  }

  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  let assignedPreferredBarber = null;
  if (preferredBarberId && preferredBarberId !== 'any') {
    const barbers = await getBarbers();
    const barber = barbers.find((b) => String(b._id) === String(preferredBarberId));
    if (!barber || !barber.isWorkingToday) {
      const error = new Error('Selected barber is not on duty today.');
      error.status = 400;
      throw error;
    }
    assignedPreferredBarber = barber._id;
  }

  let todayCount = 0;
  if (isDbConnected()) {
    todayCount = await Queue.countDocuments({ dateString: today });
  } else {
    todayCount = memoryStore.queues.filter((q) => q.dateString === today).length;
  }

  const tokenSequence = todayCount + 1;
  const prefix = entryType === 'WALK_IN' ? 'W-' : 'A-';
  const tokenNumber = `${prefix}${100 + tokenSequence}`;

  const newQueueRecord = {
    _id: isDbConnected() ? new mongoose.Types.ObjectId() : `queue_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    tokenNumber,
    tokenSequence,
    customerName: customerName.trim(),
    customerPhone: cleanedPhone,
    entryType,
    services: selectedServices,
    totalDuration,
    totalPrice,
    preferredBarberId: assignedPreferredBarber,
    assignedBarberId: null,
    status: 'WAITING',
    createdAt: new Date(),
    dateString: today,
  };

  let savedRecord = null;
  if (isDbConnected()) {
    savedRecord = await Queue.create(newQueueRecord);
  } else {
    memoryStore.queues.push(newQueueRecord);
    savedRecord = newQueueRecord;
  }

  // Broadcast real-time queue update
  try {
    const io = getIO();
    const stats = await getLiveQueueStats();
    io.to('queue:global').emit('queue:updated', {
      action: 'CUSTOMER_JOINED',
      tokenNumber,
      stats,
    });
  } catch (socketErr) {
    console.warn('[Socket Emit Warning]', socketErr.message);
  }

  return savedRecord;
};

/**
 * Retrieve ticket details along with calculated queue position and dynamic EWT.
 */
export const getQueueTicketById = async (idOrToken) => {
  const today = new Date().toISOString().split('T')[0];
  let ticket = null;

  if (isDbConnected()) {
    const query = mongoose.Types.ObjectId.isValid(idOrToken)
      ? { _id: idOrToken }
      : { tokenNumber: idOrToken };
    ticket = await Queue.findOne(query).lean();
  } else {
    ticket = memoryStore.queues.find(
      (q) => String(q._id) === String(idOrToken) || q.tokenNumber === idOrToken
    );
  }

  if (!ticket) return null;

  // Retrieve barber details
  const allBarbers = await getBarbers();
  const preferredBarber = ticket.preferredBarberId
    ? allBarbers.find((b) => String(b._id) === String(ticket.preferredBarberId))
    : null;
  const assignedBarber = ticket.assignedBarberId
    ? allBarbers.find((b) => String(b._id) === String(ticket.assignedBarberId))
    : null;

  // If ticket is terminal or in chair, calculate accordingly
  if (['DONE', 'CANCELLED', 'NO_SHOW'].includes(ticket.status)) {
    return {
      ...ticket,
      preferredBarber,
      assignedBarber,
      position: 0,
      waitingAheadCount: 0,
      estimatedWaitMinutes: 0,
    };
  }

  if (ticket.status === 'IN_CHAIR') {
    const elapsedMinutes = ticket.startedAt
      ? Math.max(0, Math.round((Date.now() - new Date(ticket.startedAt).getTime()) / 60000))
      : 0;
    return {
      ...ticket,
      preferredBarber,
      assignedBarber,
      position: 0,
      waitingAheadCount: 0,
      estimatedWaitMinutes: 0,
      elapsedMinutes,
    };
  }

  if (ticket.status === 'CALLED') {
    return {
      ...ticket,
      preferredBarber,
      assignedBarber,
      position: 0,
      waitingAheadCount: 0,
      estimatedWaitMinutes: 0,
    };
  }

  // If WAITING: calculate dynamic position among waiting entries
  let waitingEntries = [];
  if (isDbConnected()) {
    waitingEntries = await Queue.find({ status: 'WAITING', dateString: today })
      .sort({ createdAt: 1 })
      .lean();
  } else {
    waitingEntries = memoryStore.queues
      .filter((q) => q.status === 'WAITING' && q.dateString === today)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  // Find index of this ticket
  const ticketIndex = waitingEntries.findIndex(
    (q) => String(q._id) === String(ticket._id) || q.tokenNumber === ticket.tokenNumber
  );

  const position = ticketIndex >= 0 ? ticketIndex + 1 : 1;
  const waitingAheadCount = Math.max(0, position - 1);

  // Calculate EWT: sum of totalDuration of all waiting customers ahead
  const aheadEntries = waitingEntries.slice(0, ticketIndex >= 0 ? ticketIndex : 0);
  const minutesAhead = aheadEntries.reduce((sum, item) => sum + (item.totalDuration || 30), 0);

  const activeBarbers = allBarbers.filter((b) => b.isWorkingToday && !b.isOnBreak);
  const effectiveBarbersCount = Math.max(1, activeBarbers.length);

  // Buffer: If preferred barber is specifically selected and on break, add 15 mins
  let breakBuffer = 0;
  if (preferredBarber && preferredBarber.isOnBreak) {
    breakBuffer = 15;
  }

  // If position is 1, wait time is between 2-5 mins
  let estimatedWaitMinutes = 5;
  if (position === 1) {
    estimatedWaitMinutes = 3;
  } else {
    estimatedWaitMinutes = Math.max(5, Math.round(minutesAhead / effectiveBarbersCount) + breakBuffer);
  }

  return {
    ...ticket,
    preferredBarber,
    assignedBarber,
    position,
    waitingAheadCount,
    estimatedWaitMinutes,
  };
};

/**
 * Cancel a waiting queue ticket.
 */
export const cancelQueueTicket = async (idOrToken) => {
  let ticket = await getQueueTicketById(idOrToken);
  if (!ticket) {
    const error = new Error('Queue ticket not found');
    error.status = 404;
    throw error;
  }

  if (ticket.status !== 'WAITING') {
    const error = new Error(`Cannot cancel ticket with status "${ticket.status}". Only waiting tickets can be cancelled.`);
    error.status = 400;
    throw error;
  }

  const cancelledAt = new Date();

  if (isDbConnected()) {
    ticket = await Queue.findOneAndUpdate(
      { _id: ticket._id },
      { $set: { status: 'CANCELLED', cancelledAt } },
      { new: true }
    ).lean();
  } else {
    const memoryIdx = memoryStore.queues.findIndex((q) => String(q._id) === String(ticket._id));
    if (memoryIdx >= 0) {
      memoryStore.queues[memoryIdx].status = 'CANCELLED';
      memoryStore.queues[memoryIdx].cancelledAt = cancelledAt;
      ticket = memoryStore.queues[memoryIdx];
    }
  }

  // Notify via Socket.IO
  try {
    const io = getIO();
    const stats = await getLiveQueueStats();
    io.to('queue:global').emit('queue:updated', {
      action: 'CUSTOMER_CANCELLED',
      tokenNumber: ticket.tokenNumber,
      stats,
    });
    io.to(`customer:${ticket._id}`).emit('customer:status_changed', {
      status: 'CANCELLED',
      position: 0,
      estimatedWaitMinutes: 0,
    });
    io.to(`customer:${ticket.tokenNumber}`).emit('customer:status_changed', {
      status: 'CANCELLED',
      position: 0,
      estimatedWaitMinutes: 0,
    });
  } catch (err) {
    console.warn('[Socket Emit Warning]', err.message);
  }

  return ticket;
};

/**
 * Call customer to chair (Transition: WAITING -> CALLED).
 */
export const callQueueTicket = async (idOrToken, barberId = null) => {
  let ticket = await getQueueTicketById(idOrToken);
  if (!ticket) {
    const error = new Error('Queue ticket not found');
    error.status = 404;
    throw error;
  }

  const allBarbers = await getBarbers();
  const selectedBarber = barberId
    ? allBarbers.find((b) => String(b._id) === String(barberId))
    : allBarbers.find((b) => b.isWorkingToday && !b.isOnBreak) || allBarbers[0];

  const assignedBarberId = selectedBarber?._id || null;
  const calledAt = new Date();

  if (isDbConnected()) {
    ticket = await Queue.findOneAndUpdate(
      { _id: ticket._id },
      { $set: { status: 'CALLED', assignedBarberId, calledAt } },
      { new: true }
    ).lean();
  } else {
    const memoryIdx = memoryStore.queues.findIndex((q) => String(q._id) === String(ticket._id));
    if (memoryIdx >= 0) {
      memoryStore.queues[memoryIdx].status = 'CALLED';
      memoryStore.queues[memoryIdx].assignedBarberId = assignedBarberId;
      memoryStore.queues[memoryIdx].calledAt = calledAt;
      ticket = memoryStore.queues[memoryIdx];
    }
  }

  // Emit Real-Time Alerts
  try {
    const io = getIO();
    const stats = await getLiveQueueStats();

    const callPayload = {
      queueId: ticket._id,
      tokenNumber: ticket.tokenNumber,
      customerName: ticket.customerName,
      barberName: selectedBarber?.name || 'Stylist',
      chairNumber: selectedBarber?.chairNumber || 1,
      calledAt,
    };

    io.to('queue:global').emit('queue:updated', { action: 'CUSTOMER_CALLED', ...callPayload, stats });
    io.to('queue:global').emit('display:paged', callPayload);
    io.to(`customer:${ticket._id}`).emit('customer:called', callPayload);
    io.to(`customer:${ticket.tokenNumber}`).emit('customer:called', callPayload);
  } catch (err) {
    console.warn('[Socket Emit Warning]', err.message);
  }

  return { ...ticket, assignedBarber: selectedBarber };
};

/**
 * Mark customer In Chair (Transition: CALLED -> IN_CHAIR).
 */
export const startServiceQueueTicket = async (idOrToken) => {
  let ticket = await getQueueTicketById(idOrToken);
  if (!ticket) throw new Error('Ticket not found');

  const startedAt = new Date();
  if (isDbConnected()) {
    ticket = await Queue.findOneAndUpdate(
      { _id: ticket._id },
      { $set: { status: 'IN_CHAIR', startedAt } },
      { new: true }
    ).lean();
  } else {
    const idx = memoryStore.queues.findIndex((q) => String(q._id) === String(ticket._id));
    if (idx >= 0) {
      memoryStore.queues[idx].status = 'IN_CHAIR';
      memoryStore.queues[idx].startedAt = startedAt;
      ticket = memoryStore.queues[idx];
    }
  }

  try {
    const io = getIO();
    io.to('queue:global').emit('queue:updated', { action: 'SERVICE_STARTED', tokenNumber: ticket.tokenNumber });
    io.to(`customer:${ticket._id}`).emit('customer:status_changed', { status: 'IN_CHAIR' });
    io.to(`customer:${ticket.tokenNumber}`).emit('customer:status_changed', { status: 'IN_CHAIR' });
  } catch (err) {}

  return ticket;
};

/**
 * Mark service as Done (Transition: IN_CHAIR -> DONE).
 */
export const completeQueueTicket = async (idOrToken) => {
  let ticket = await getQueueTicketById(idOrToken);
  if (!ticket) throw new Error('Ticket not found');

  const completedAt = new Date();
  if (isDbConnected()) {
    ticket = await Queue.findOneAndUpdate(
      { _id: ticket._id },
      { $set: { status: 'DONE', completedAt } },
      { new: true }
    ).lean();
  } else {
    const idx = memoryStore.queues.findIndex((q) => String(q._id) === String(ticket._id));
    if (idx >= 0) {
      memoryStore.queues[idx].status = 'DONE';
      memoryStore.queues[idx].completedAt = completedAt;
      ticket = memoryStore.queues[idx];
    }
  }

  try {
    const io = getIO();
    io.to('queue:global').emit('queue:updated', { action: 'SERVICE_COMPLETED', tokenNumber: ticket.tokenNumber });
    io.to(`customer:${ticket._id}`).emit('customer:status_changed', { status: 'DONE' });
    io.to(`customer:${ticket.tokenNumber}`).emit('customer:status_changed', { status: 'DONE' });
  } catch (err) {}

  return ticket;
};
