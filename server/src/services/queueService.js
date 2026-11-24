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
    isOnBreak: false,
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
    isWorkingToday: true,
    isOnBreak: true, // Initially on break for testing
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

// Resilient in-memory fallback store
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

export const getSalonSettings = async ({ includeAdminPin = false } = {}) => {
  let settings;
  if (isDbConnected()) {
    settings = await Settings.findOne().lean();
    if (!settings) {
      settings = await Settings.create(DEFAULT_SETTINGS);
    }
  } else {
    settings = memoryStore.settings;
  }
  if (!includeAdminPin) {
    const { adminPin: _removed, ...safeSettings } = settings;
    return safeSettings;
  }
  return settings;
};

export const updateSalonSettings = async (updateData) => {
  if (isDbConnected()) {
    const updated = await Settings.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true }
    ).lean();
    try {
      getIO().to('queue:global').emit('queue:updated', { action: 'SETTINGS_UPDATED' });
    } catch (e) {}
    return updated;
  }
  memoryStore.settings = { ...memoryStore.settings, ...updateData };
  try {
    getIO().to('queue:global').emit('queue:updated', { action: 'SETTINGS_UPDATED' });
  } catch (e) {}
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
  let completedTodayCount = 0;
  let noShowCount = 0;
  let workingBarbersCount = 0;

  if (isDbConnected()) {
    waitingList = await Queue.find({ status: 'WAITING', dateString: today }).sort({ createdAt: 1 }).lean();
    calledList = await Queue.find({ status: 'CALLED', dateString: today }).lean();
    inChairList = await Queue.find({ status: 'IN_CHAIR', dateString: today }).lean();
    completedTodayCount = await Queue.countDocuments({ status: 'DONE', dateString: today });
    noShowCount = await Queue.countDocuments({ status: 'NO_SHOW', dateString: today });
    workingBarbersCount = await Barber.countDocuments({ isWorkingToday: true, isOnBreak: false });
  } else {
    waitingList = memoryStore.queues.filter((q) => q.status === 'WAITING' && q.dateString === today);
    calledList = memoryStore.queues.filter((q) => q.status === 'CALLED' && q.dateString === today);
    inChairList = memoryStore.queues.filter((q) => q.status === 'IN_CHAIR' && q.dateString === today);
    completedTodayCount = memoryStore.queues.filter((q) => q.status === 'DONE' && q.dateString === today).length;
    noShowCount = memoryStore.queues.filter((q) => q.status === 'NO_SHOW' && q.dateString === today).length;
    workingBarbersCount = memoryStore.barbers.filter((b) => b.isWorkingToday && !b.isOnBreak).length;
  }

  const totalWaitingMinutes = waitingList.reduce((acc, curr) => acc + (curr.totalDuration || 30), 0);
  const effectiveBarbers = Math.max(1, workingBarbersCount);
  const estimatedWaitMinutes = Math.round(totalWaitingMinutes / effectiveBarbers);

  return {
    waitingCount: waitingList.length,
    calledCount: calledList.length,
    inChairCount: inChairList.length,
    completedTodayCount,
    noShowCount,
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

  // Walk-in entries bypass online cutoff
  if (entryType === 'ONLINE') {
    const salonStatus = await checkSalonOpenStatus();
    if (!salonStatus.isOnlineIntakeAllowed) {
      const error = new Error('Online queue joining is currently closed. Walk-ins remain welcome at the salon reception.');
      error.status = 403;
      error.code = 'ONLINE_QUEUE_CLOSED';
      throw error;
    }
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
      `Customer already has an active ticket in the queue (${existingActiveTicket.tokenNumber}).`
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

  const allBarbers = await getBarbers();
  const preferredBarber = ticket.preferredBarberId
    ? allBarbers.find((b) => String(b._id) === String(ticket.preferredBarberId))
    : null;
  const assignedBarber = ticket.assignedBarberId
    ? allBarbers.find((b) => String(b._id) === String(ticket.assignedBarberId))
    : null;

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

  if (ticket.status === 'IN_CHAIR' || ticket.status === 'CALLED') {
    return {
      ...ticket,
      preferredBarber,
      assignedBarber,
      position: 0,
      waitingAheadCount: 0,
      estimatedWaitMinutes: 0,
    };
  }

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

  const ticketIndex = waitingEntries.findIndex(
    (q) => String(q._id) === String(ticket._id) || q.tokenNumber === ticket.tokenNumber
  );

  const position = ticketIndex >= 0 ? ticketIndex + 1 : 1;
  const waitingAheadCount = Math.max(0, position - 1);

  const aheadEntries = waitingEntries.slice(0, ticketIndex >= 0 ? ticketIndex : 0);
  const minutesAhead = aheadEntries.reduce((sum, item) => sum + (item.totalDuration || 30), 0);

  const activeBarbers = allBarbers.filter((b) => b.isWorkingToday && !b.isOnBreak);
  const effectiveBarbersCount = Math.max(1, activeBarbers.length);

  let breakBuffer = 0;
  if (preferredBarber && preferredBarber.isOnBreak) {
    breakBuffer = 15;
  }

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
 * RECEPTION COMMAND CENTER: Retrieve full reception snapshot.
 */
export const getReceptionBoardData = async () => {
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();

  let waiting = [];
  let called = [];
  let inChair = [];
  let barbers = await getBarbers();
  const settings = await getSalonSettings();
  const stats = await getLiveQueueStats();

  if (isDbConnected()) {
    waiting = await Queue.find({ status: 'WAITING', dateString: today }).sort({ createdAt: 1 }).lean();
    called = await Queue.find({ status: 'CALLED', dateString: today }).lean();
    inChair = await Queue.find({ status: 'IN_CHAIR', dateString: today }).lean();
  } else {
    waiting = memoryStore.queues
      .filter((q) => q.status === 'WAITING' && q.dateString === today)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    called = memoryStore.queues.filter((q) => q.status === 'CALLED' && q.dateString === today);
    inChair = memoryStore.queues.filter((q) => q.status === 'IN_CHAIR' && q.dateString === today);
  }

  // Enrich waiting items with elapsed minutes and 60m SLA breach flag
  const enrichedWaiting = waiting.map((item, idx) => {
    const elapsedMins = Math.floor((now - new Date(item.createdAt).getTime()) / 60000);
    const prefBarber = item.preferredBarberId
      ? barbers.find((b) => String(b._id) === String(item.preferredBarberId))
      : null;

    return {
      ...item,
      queuePosition: idx + 1,
      waitingMinutes: Math.max(0, elapsedMins),
      isDelayed: elapsedMins >= 60, // 60-Minute SLA Threshold rule
      preferredBarber: prefBarber,
    };
  });

  // Enrich called items
  const enrichedCalled = called.map((item) => {
    const elapsedMins = item.calledAt
      ? Math.floor((now - new Date(item.calledAt).getTime()) / 60000)
      : 0;
    const assignedBarber = item.assignedBarberId
      ? barbers.find((b) => String(b._id) === String(item.assignedBarberId))
      : null;
    return {
      ...item,
      calledMinutes: Math.max(0, elapsedMins),
      assignedBarber,
    };
  });

  // Enrich inChair items
  const enrichedInChair = inChair.map((item) => {
    const elapsedMins = item.startedAt
      ? Math.floor((now - new Date(item.startedAt).getTime()) / 60000)
      : 0;
    const assignedBarber = item.assignedBarberId
      ? barbers.find((b) => String(b._id) === String(item.assignedBarberId))
      : null;
    return {
      ...item,
      elapsedMinutes: Math.max(0, elapsedMins),
      assignedBarber,
    };
  });

  // Attach active customer to each barber
  const barbersWithActiveChair = barbers.map((barber) => {
    const activeItem =
      enrichedInChair.find((item) => String(item.assignedBarberId) === String(barber._id)) ||
      enrichedCalled.find((item) => String(item.assignedBarberId) === String(barber._id)) ||
      null;

    return {
      ...barber,
      currentCustomer: activeItem,
      isOccupied: Boolean(activeItem),
    };
  });

  return {
    waiting: enrichedWaiting,
    called: enrichedCalled,
    inChair: enrichedInChair,
    barbers: barbersWithActiveChair,
    stats,
    salonSettings: settings,
  };
};

/**
 * EXACT ALGORITHMIC "CALL NEXT" RESOLUTION (Rule 2, Rule 3, Rule 4)
 * For a specific Barber B:
 * 1. Verify Barber is free (Chair Singularity)
 * 2. Find earliest eligible waiting customer where preferredBarberId == B._id OR preferredBarberId == null
 * 3. Atomic transition to CALLED
 */
export const callNextForBarber = async (barberId) => {
  const barbers = await getBarbers();
  const barber = barbers.find((b) => String(b._id) === String(barberId));
  if (!barber) {
    const error = new Error('Barber not found');
    error.status = 404;
    throw error;
  }

  if (barber.isOnBreak) {
    const error = new Error(`${barber.name} is currently on break. Please resume duty before calling customer.`);
    error.status = 400;
    throw error;
  }

  // Check Chair Singularity: is barber already serving or calling someone?
  const today = new Date().toISOString().split('T')[0];
  let activeSession = null;

  if (isDbConnected()) {
    activeSession = await Queue.findOne({
      assignedBarberId: barber._id,
      status: { $in: ['CALLED', 'IN_CHAIR'] },
      dateString: today,
    }).lean();
  } else {
    activeSession = memoryStore.queues.find(
      (q) =>
        String(q.assignedBarberId) === String(barber._id) &&
        ['CALLED', 'IN_CHAIR'].includes(q.status) &&
        q.dateString === today
    );
  }

  if (activeSession) {
    const error = new Error(
      `${barber.name} already has an active customer in chair or paged (${activeSession.tokenNumber}). Please complete or mark no-show first.`
    );
    error.status = 400;
    throw error;
  }

  // Query earliest eligible WAITING customer (Rule 4 FIFO & Barber Affinity)
  let eligibleCustomer = null;
  const calledAt = new Date();

  if (isDbConnected()) {
    eligibleCustomer = await Queue.findOneAndUpdate(
      {
        status: 'WAITING',
        dateString: today,
        $or: [
          { preferredBarberId: barber._id },
          { preferredBarberId: null },
        ],
      },
      {
        $set: {
          status: 'CALLED',
          assignedBarberId: barber._id,
          calledAt,
        },
      },
      {
        sort: { createdAt: 1 }, // Strict FIFO
        new: true,
      }
    ).lean();
  } else {
    const waitingCandidates = memoryStore.queues
      .filter(
        (q) =>
          q.status === 'WAITING' &&
          q.dateString === today &&
          (!q.preferredBarberId || String(q.preferredBarberId) === String(barber._id))
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (waitingCandidates.length > 0) {
      eligibleCustomer = waitingCandidates[0];
      eligibleCustomer.status = 'CALLED';
      eligibleCustomer.assignedBarberId = barber._id;
      eligibleCustomer.calledAt = calledAt;
    }
  }

  if (!eligibleCustomer) {
    const error = new Error(`No eligible waiting customers found for ${barber.name}.`);
    error.status = 404;
    throw error;
  }

  // Update barber's active pointer
  if (isDbConnected()) {
    await Barber.updateOne({ _id: barber._id }, { $set: { currentQueueId: eligibleCustomer._id } });
  } else {
    const bIdx = memoryStore.barbers.findIndex((b) => String(b._id) === String(barber._id));
    if (bIdx >= 0) memoryStore.barbers[bIdx].currentQueueId = eligibleCustomer._id;
  }

  // Broadcast Socket.IO Real-Time Events
  try {
    const io = getIO();
    const stats = await getLiveQueueStats();
    const payload = {
      queueId: eligibleCustomer._id,
      tokenNumber: eligibleCustomer.tokenNumber,
      customerName: eligibleCustomer.customerName,
      barberName: barber.name,
      chairNumber: barber.chairNumber,
      calledAt,
    };

    io.to('queue:global').emit('queue:updated', { action: 'CUSTOMER_CALLED', ...payload, stats });
    io.to('queue:global').emit('display:paged', payload);
    io.to(`customer:${eligibleCustomer._id}`).emit('customer:called', payload);
    io.to(`customer:${eligibleCustomer.tokenNumber}`).emit('customer:called', payload);
    io.to(`barber:${barber._id}`).emit('barber:assigned', payload);
  } catch (err) {
    console.warn('[Socket Emit Warning]', err.message);
  }

  return {
    customer: eligibleCustomer,
    barber,
  };
};

/**
 * Toggle Barber On / Off Break.
 */
export const toggleBarberBreak = async (barberId) => {
  let barber = null;

  if (isDbConnected()) {
    const b = await Barber.findById(barberId);
    if (!b) throw new Error('Barber not found');
    b.isOnBreak = !b.isOnBreak;
    await b.save();
    barber = b.toObject();
  } else {
    const idx = memoryStore.barbers.findIndex((b) => String(b._id) === String(barberId));
    if (idx < 0) throw new Error('Barber not found');
    memoryStore.barbers[idx].isOnBreak = !memoryStore.barbers[idx].isOnBreak;
    barber = memoryStore.barbers[idx];
  }

  try {
    const io = getIO();
    io.to('queue:global').emit('barber:status_changed', {
      barberId: barber._id,
      isOnBreak: barber.isOnBreak,
    });
    io.to('queue:global').emit('queue:updated', { action: 'BARBER_BREAK_TOGGLED' });
  } catch (e) {}

  return barber;
};

/**
 * Mark Customer as NO_SHOW (Rule 6).
 * Frees the barber immediately to serve the next customer.
 */
export const markNoShow = async (idOrToken) => {
  let ticket = await getQueueTicketById(idOrToken);
  if (!ticket) throw new Error('Ticket not found');

  const noShowAt = new Date();

  if (isDbConnected()) {
    ticket = await Queue.findOneAndUpdate(
      { _id: ticket._id },
      { $set: { status: 'NO_SHOW', noShowAt } },
      { new: true }
    ).lean();

    if (ticket.assignedBarberId) {
      await Barber.updateOne(
        { _id: ticket.assignedBarberId },
        { $set: { currentQueueId: null } }
      );
    }
  } else {
    const idx = memoryStore.queues.findIndex((q) => String(q._id) === String(ticket._id));
    if (idx >= 0) {
      memoryStore.queues[idx].status = 'NO_SHOW';
      memoryStore.queues[idx].noShowAt = noShowAt;
      ticket = memoryStore.queues[idx];
    }
    if (ticket.assignedBarberId) {
      const bIdx = memoryStore.barbers.findIndex((b) => String(b._id) === String(ticket.assignedBarberId));
      if (bIdx >= 0) memoryStore.barbers[bIdx].currentQueueId = null;
    }
  }

  try {
    const io = getIO();
    const stats = await getLiveQueueStats();
    io.to('queue:global').emit('queue:updated', { action: 'CUSTOMER_NO_SHOW', tokenNumber: ticket.tokenNumber, stats });
    io.to(`customer:${ticket._id}`).emit('customer:status_changed', { status: 'NO_SHOW' });
    io.to(`customer:${ticket.tokenNumber}`).emit('customer:status_changed', { status: 'NO_SHOW' });
  } catch (e) {}

  return ticket;
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
 * Call customer to chair manually.
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
    if (assignedBarberId) {
      await Barber.updateOne({ _id: assignedBarberId }, { $set: { currentQueueId: ticket._id } });
    }
  } else {
    const memoryIdx = memoryStore.queues.findIndex((q) => String(q._id) === String(ticket._id));
    if (memoryIdx >= 0) {
      memoryStore.queues[memoryIdx].status = 'CALLED';
      memoryStore.queues[memoryIdx].assignedBarberId = assignedBarberId;
      memoryStore.queues[memoryIdx].calledAt = calledAt;
      ticket = memoryStore.queues[memoryIdx];
    }
    if (assignedBarberId) {
      const bIdx = memoryStore.barbers.findIndex((b) => String(b._id) === String(assignedBarberId));
      if (bIdx >= 0) memoryStore.barbers[bIdx].currentQueueId = ticket._id;
    }
  }

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
 * Frees the barber chair.
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

    if (ticket.assignedBarberId) {
      await Barber.updateOne(
        { _id: ticket.assignedBarberId },
        { $set: { currentQueueId: null } }
      );
    }
  } else {
    const idx = memoryStore.queues.findIndex((q) => String(q._id) === String(ticket._id));
    if (idx >= 0) {
      memoryStore.queues[idx].status = 'DONE';
      memoryStore.queues[idx].completedAt = completedAt;
      ticket = memoryStore.queues[idx];
    }
    if (ticket.assignedBarberId) {
      const bIdx = memoryStore.barbers.findIndex((b) => String(b._id) === String(ticket.assignedBarberId));
      if (bIdx >= 0) memoryStore.barbers[bIdx].currentQueueId = null;
    }
  }

  try {
    const io = getIO();
    const stats = await getLiveQueueStats();
    io.to('queue:global').emit('queue:updated', { action: 'SERVICE_COMPLETED', tokenNumber: ticket.tokenNumber, stats });
    io.to(`customer:${ticket._id}`).emit('customer:status_changed', { status: 'DONE' });
    io.to(`customer:${ticket.tokenNumber}`).emit('customer:status_changed', { status: 'DONE' });
  } catch (err) {}

  return ticket;
};

/**
 * Barber Station View: Get barber status, active customer, and next eligible customer.
 */
export const getBarberStationData = async (slugOrId) => {
  const barbers = await getBarbers();
  const barber = barbers.find(
    (b) => String(b._id) === String(slugOrId) || b.slug === slugOrId
  );
  if (!barber) {
    const error = new Error('Barber station not found');
    error.status = 404;
    throw error;
  }

  const today = new Date().toISOString().split('T')[0];

  // 1. Find active customer in chair or called for this barber
  let activeTicket = null;
  if (isDbConnected()) {
    activeTicket = await Queue.findOne({
      assignedBarberId: barber._id,
      status: { $in: ['CALLED', 'IN_CHAIR'] },
      dateString: today,
    }).lean();
  } else {
    activeTicket = memoryStore.queues.find(
      (q) =>
        String(q.assignedBarberId) === String(barber._id) &&
        ['CALLED', 'IN_CHAIR'].includes(q.status) &&
        q.dateString === today
    );
  }

  // Calculate elapsed minutes if active
  let enrichedActive = null;
  if (activeTicket) {
    const elapsedMinutes = activeTicket.startedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(activeTicket.startedAt).getTime()) / 60000))
      : activeTicket.calledAt
      ? Math.max(0, Math.floor((Date.now() - new Date(activeTicket.calledAt).getTime()) / 60000))
      : 0;

    enrichedActive = {
      ...activeTicket,
      elapsedMinutes,
    };
  }

  // 2. Find eligible waiting customers for this barber (FIFO & Barber Affinity)
  let eligibleWaiting = [];
  if (isDbConnected()) {
    eligibleWaiting = await Queue.find({
      status: 'WAITING',
      dateString: today,
      $or: [
        { preferredBarberId: barber._id },
        { preferredBarberId: null },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(5)
      .lean();
  } else {
    eligibleWaiting = memoryStore.queues
      .filter(
        (q) =>
          q.status === 'WAITING' &&
          q.dateString === today &&
          (!q.preferredBarberId || String(q.preferredBarberId) === String(barber._id))
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 5);
  }

  const nextCustomer = eligibleWaiting[0] || null;

  return {
    barber,
    allBarbers: barbers,
    currentCustomer: enrichedActive,
    nextEligibleCustomer: nextCustomer,
    upcomingQueue: eligibleWaiting,
  };
};

/**
 * TV Display Snapshot: Stations grid, next five queue tokens, settings.
 */
export const getDisplayScreenData = async () => {
  const today = new Date().toISOString().split('T')[0];
  const barbers = await getBarbers();
  const settings = await getSalonSettings();
  const stats = await getLiveQueueStats();

  let activeList = [];
  let waitingList = [];

  if (isDbConnected()) {
    activeList = await Queue.find({
      status: { $in: ['CALLED', 'IN_CHAIR'] },
      dateString: today,
    }).lean();
    waitingList = await Queue.find({
      status: 'WAITING',
      dateString: today,
    })
      .sort({ createdAt: 1 })
      .limit(5)
      .lean();
  } else {
    activeList = memoryStore.queues.filter(
      (q) => ['CALLED', 'IN_CHAIR'].includes(q.status) && q.dateString === today
    );
    waitingList = memoryStore.queues
      .filter((q) => q.status === 'WAITING' && q.dateString === today)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 5);
  }

  const stations = barbers.map((barber) => {
    const activeItem = activeList.find(
      (q) => String(q.assignedBarberId) === String(barber._id)
    );

    let status = 'AVAILABLE';
    if (!barber.isWorkingToday) status = 'OFF_DUTY';
    else if (barber.isOnBreak) status = 'ON_BREAK';
    else if (activeItem) {
      status = activeItem.status;
    }

    return {
      chairNumber: barber.chairNumber,
      barberId: barber._id,
      barberName: barber.name,
      status,
      activeCustomer: activeItem
        ? {
            tokenNumber: activeItem.tokenNumber,
            customerName: activeItem.customerName,
            status: activeItem.status,
            totalDuration: activeItem.totalDuration,
          }
        : null,
    };
  });

  const nextFiveTokens = waitingList.map((item, idx) => {
    const prefBarber = item.preferredBarberId
      ? barbers.find((b) => String(b._id) === String(item.preferredBarberId))
      : null;

    return {
      rank: idx + 1,
      tokenNumber: item.tokenNumber,
      preference: prefBarber ? prefBarber.name : 'Any Barber',
      totalDuration: item.totalDuration,
      estimatedWait: `~${(idx + 1) * 10}m`,
    };
  });

  return {
    stations,
    nextFiveTokens,
    salonSettings: settings,
    stats,
  };
};

/**
 * OWNER OPERATIONS: Get all services (both active and disabled).
 */
export const getAllServices = async () => {
  if (isDbConnected()) {
    return await Service.find().sort({ displayOrder: 1, createdAt: 1 }).lean();
  }
  return memoryStore.services;
};

/**
 * OWNER OPERATIONS: Add new service.
 */
export const createService = async ({ name, category, duration, price }) => {
  if (!name || (!name.en && typeof name !== 'string')) {
    const error = new Error('Service name in English is required.');
    error.status = 400;
    throw error;
  }
  const enName = typeof name === 'object' ? name.en : name;
  const guName = typeof name === 'object' ? name.gu || enName : enName;
  const numDuration = Number(duration);
  const numPrice = Number(price);

  if (isNaN(numDuration) || numDuration < 5 || numDuration > 240) {
    const error = new Error('Service duration must be between 5 and 240 minutes.');
    error.status = 400;
    throw error;
  }
  if (isNaN(numPrice) || numPrice < 0) {
    const error = new Error('Service price must be a valid positive number.');
    error.status = 400;
    throw error;
  }

  const newServiceData = {
    _id: isDbConnected() ? new mongoose.Types.ObjectId() : `service_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: {
      en: enName.trim(),
      gu: guName.trim(),
    },
    category: category || 'HAIR',
    duration: numDuration,
    price: numPrice,
    isActive: true,
    displayOrder: 99,
  };

  let saved = null;
  if (isDbConnected()) {
    saved = await Service.create(newServiceData);
  } else {
    memoryStore.services.push(newServiceData);
    saved = newServiceData;
  }

  try {
    getIO().to('queue:global').emit('queue:updated', { action: 'SERVICE_ADDED' });
  } catch (e) {}

  return saved;
};

/**
 * OWNER OPERATIONS: Update service details.
 */
export const updateService = async (id, updateData) => {
  const numDuration = updateData.duration !== undefined ? Number(updateData.duration) : undefined;
  const numPrice = updateData.price !== undefined ? Number(updateData.price) : undefined;

  const sanitized = {};
  if (updateData.name) {
    sanitized.name = {
      en: updateData.name.en ? updateData.name.en.trim() : updateData.name,
      gu: updateData.name.gu ? updateData.name.gu.trim() : (updateData.name.en || updateData.name),
    };
  }
  if (updateData.category) sanitized.category = updateData.category;
  if (numDuration !== undefined && !isNaN(numDuration)) sanitized.duration = numDuration;
  if (numPrice !== undefined && !isNaN(numPrice)) sanitized.price = numPrice;
  if (updateData.isActive !== undefined) sanitized.isActive = Boolean(updateData.isActive);

  let updated = null;
  if (isDbConnected()) {
    updated = await Service.findByIdAndUpdate(id, { $set: sanitized }, { new: true }).lean();
  } else {
    const idx = memoryStore.services.findIndex((s) => String(s._id) === String(id));
    if (idx >= 0) {
      memoryStore.services[idx] = { ...memoryStore.services[idx], ...sanitized };
      updated = memoryStore.services[idx];
    }
  }

  if (!updated) {
    const error = new Error('Service not found');
    error.status = 404;
    throw error;
  }

  try {
    getIO().to('queue:global').emit('queue:updated', { action: 'SERVICE_UPDATED' });
  } catch (e) {}

  return updated;
};

/**
 * OWNER OPERATIONS: Enable/disable service.
 * Disabling immediately hides it from customer /join screen.
 */
export const toggleServiceActive = async (id) => {
  let updated = null;
  if (isDbConnected()) {
    const s = await Service.findById(id);
    if (!s) throw new Error('Service not found');
    s.isActive = !s.isActive;
    await s.save();
    updated = s.toObject();
  } else {
    const idx = memoryStore.services.findIndex((s) => String(s._id) === String(id));
    if (idx < 0) throw new Error('Service not found');
    memoryStore.services[idx].isActive = !memoryStore.services[idx].isActive;
    updated = memoryStore.services[idx];
  }

  try {
    getIO().to('queue:global').emit('queue:updated', {
      action: 'SERVICE_TOGGLED',
      serviceId: id,
      isActive: updated.isActive,
    });
  } catch (e) {}

  return updated;
};

/**
 * OWNER OPERATIONS: Add new barber.
 */
export const createBarber = async ({ name, chairNumber, avatarUrl }) => {
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    const error = new Error('Valid barber name is required.');
    error.status = 400;
    throw error;
  }

  const cleanName = name.trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') + `-${Date.now().toString().slice(-4)}`;
  const chair = Number(chairNumber) || (await getBarbers()).length + 1;

  const newBarberData = {
    _id: isDbConnected() ? new mongoose.Types.ObjectId() : `barber_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: cleanName,
    slug,
    avatarUrl: avatarUrl || '',
    chairNumber: chair,
    isWorkingToday: true,
    isOnBreak: false,
    currentQueueId: null,
  };

  let saved = null;
  if (isDbConnected()) {
    saved = await Barber.create(newBarberData);
  } else {
    memoryStore.barbers.push(newBarberData);
    saved = newBarberData;
  }

  try {
    getIO().to('queue:global').emit('barber:status_changed', { action: 'BARBER_ADDED' });
    getIO().to('queue:global').emit('queue:updated', { action: 'BARBER_ADDED' });
  } catch (e) {}

  return saved;
};

/**
 * OWNER OPERATIONS: Toggle Barber Working Today on duty (isWorkingToday).
 */
export const toggleBarberDuty = async (barberId) => {
  let barber = null;
  if (isDbConnected()) {
    const b = await Barber.findById(barberId);
    if (!b) throw new Error('Barber not found');
    b.isWorkingToday = !b.isWorkingToday;
    await b.save();
    barber = b.toObject();
  } else {
    const idx = memoryStore.barbers.findIndex((b) => String(b._id) === String(barberId));
    if (idx < 0) throw new Error('Barber not found');
    memoryStore.barbers[idx].isWorkingToday = !memoryStore.barbers[idx].isWorkingToday;
    barber = memoryStore.barbers[idx];
  }

  try {
    getIO().to('queue:global').emit('barber:status_changed', {
      barberId: barber._id,
      isWorkingToday: barber.isWorkingToday,
    });
    getIO().to('queue:global').emit('queue:updated', { action: 'BARBER_DUTY_TOGGLED' });
  } catch (e) {}

  return barber;
};

/**
 * OWNER OPERATIONS: Daily Analytics Snapshot.
 */
export const getTodayAnalytics = async () => {
  const today = new Date().toISOString().split('T')[0];

  let todayTickets = [];
  if (isDbConnected()) {
    todayTickets = await Queue.find({ dateString: today }).lean();
  } else {
    todayTickets = memoryStore.queues.filter((q) => q.dateString === today);
  }

  const totalJoined = todayTickets.length;
  const servedTickets = todayTickets.filter((q) => q.status === 'DONE');
  const noShowTickets = todayTickets.filter((q) => q.status === 'NO_SHOW');
  const cancelledTickets = todayTickets.filter((q) => q.status === 'CANCELLED');
  const waitingTickets = todayTickets.filter((q) => q.status === 'WAITING');
  const inChairTickets = todayTickets.filter((q) => q.status === 'IN_CHAIR');

  const totalServed = servedTickets.length;
  const totalNoShow = noShowTickets.length;
  const totalCancelled = cancelledTickets.length;

  const totalRevenue = servedTickets.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  // Compute average waiting time (mins)
  let totalWaitMins = 0;
  let waitCount = 0;
  servedTickets.forEach((item) => {
    if (item.startedAt && item.createdAt) {
      const wait = Math.max(1, Math.round((new Date(item.startedAt).getTime() - new Date(item.createdAt).getTime()) / 60000));
      totalWaitMins += wait;
      waitCount++;
    } else {
      totalWaitMins += 15;
      waitCount++;
    }
  });

  const averageWaitMinutes = waitCount > 0 ? Math.round(totalWaitMins / waitCount) : 15;

  return {
    dateString: today,
    totalJoined,
    totalServed,
    totalNoShow,
    totalCancelled,
    totalWaiting: waitingTickets.length,
    totalInChair: inChairTickets.length,
    totalRevenue,
    averageWaitMinutes,
  };
};
