import mongoose from 'mongoose';
import { Queue } from '../models/Queue.js';
import { Service } from '../models/Service.js';
import { Barber } from '../models/Barber.js';
import { Settings } from '../models/Settings.js';
import { getIO } from '../config/socket.js';

// Default initial seed datasets for realistic testing
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
    _id: '65a00000000000000000006',
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
    isOnBreak: true, // Currently on break for realistic testing
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

// Resilient in-memory fallback state in case MongoDB daemon is offline
let memoryStore = {
  services: [...INITIAL_SERVICES],
  barbers: [...INITIAL_BARBERS],
  settings: { ...DEFAULT_SETTINGS },
  queues: [],
};

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Seed initial records into MongoDB or memory store.
 */
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

/**
 * Get active services catalog.
 */
export const getActiveServices = async () => {
  if (isDbConnected()) {
    return await Service.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
  }
  return memoryStore.services.filter((s) => s.isActive);
};

/**
 * Get staff barbers list with today's status.
 */
export const getBarbers = async () => {
  if (isDbConnected()) {
    return await Barber.find().sort({ chairNumber: 1 }).lean();
  }
  return memoryStore.barbers;
};

/**
 * Get salon operational settings.
 */
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

/**
 * Check if the salon is currently within operating hours and online queue cut-off window.
 */
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

/**
 * Compute real-time queue statistics.
 */
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

  // Calculate rolling estimated wait time
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

/**
 * Customer Joins Queue (Strict business rule validation).
 */
export const joinQueue = async ({ customerName, customerPhone, serviceIds, preferredBarberId, entryType = 'ONLINE' }) => {
  // 1. Validate Customer Name
  if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2 || customerName.trim().length > 50) {
    const error = new Error('Please enter a valid customer name (between 2 and 50 characters).');
    error.status = 400;
    throw error;
  }

  // 2. Validate Normalized 10-digit Phone
  const cleanedPhone = String(customerPhone || '').replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
    const error = new Error('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
    error.status = 400;
    throw error;
  }

  // 3. Validate Service Selection (1 to 3 items)
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

  // 4. Validate Salon Operating Cut-off
  const salonStatus = await checkSalonOpenStatus();
  if (entryType === 'ONLINE' && !salonStatus.isOnlineIntakeAllowed) {
    const error = new Error('Online queue joining is currently closed. Walk-ins remain welcome at the salon reception.');
    error.status = 403;
    error.code = 'ONLINE_QUEUE_CLOSED';
    throw error;
  }

  // 5. Enforce Phone Uniqueness Constraint
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

  // 6. Fetch Services and calculate totals
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

  // 7. Validate Barber Selection if specific
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

  // 8. Generate Daily Incremental Token Number (e.g. A-101 for online, W-101 for walk-in)
  let todayCount = 0;
  if (isDbConnected()) {
    todayCount = await Queue.countDocuments({ dateString: today });
  } else {
    todayCount = memoryStore.queues.filter((q) => q.dateString === today).length;
  }

  const tokenSequence = todayCount + 1;
  const prefix = entryType === 'WALK_IN' ? 'W-' : 'A-';
  const tokenNumber = `${prefix}${100 + tokenSequence}`;

  // 9. Create and Persist Queue Record
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

  // 10. Broadcast Real-Time Socket Event
  try {
    const io = getIO();
    const stats = await getLiveQueueStats();
    io.to('queue:global').emit('queue:updated', {
      action: 'CUSTOMER_JOINED',
      tokenNumber,
      stats,
    });
  } catch (socketErr) {
    // Socket emit is non-blocking
    console.warn('[Socket Emit Warning]', socketErr.message);
  }

  return savedRecord;
};

/**
 * Get details of a single ticket by ID or tokenNumber.
 */
export const getQueueTicketById = async (idOrToken) => {
  if (isDbConnected()) {
    const query = mongoose.Types.ObjectId.isValid(idOrToken)
      ? { _id: idOrToken }
      : { tokenNumber: idOrToken };
    return await Queue.findOne(query).populate('preferredBarberId assignedBarberId').lean();
  }

  return memoryStore.queues.find(
    (q) => String(q._id) === String(idOrToken) || q.tokenNumber === idOrToken
  );
};
