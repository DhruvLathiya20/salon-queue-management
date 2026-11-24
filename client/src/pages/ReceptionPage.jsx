import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { Modal } from '../components/common/Modal';
import {
  UserPlus,
  Clock,
  Phone,
  AlertTriangle,
  Bell,
  CheckCircle2,
  XCircle,
  Coffee,
  Scissors,
  Users,
  UserCheck,
  Check,
  RefreshCw,
  Power,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const ReceptionPage = () => {
  const { t, language } = useTranslation();
  const { socket, isConnected } = useSocket();

  // Board Data States
  const [board, setBoard] = useState({
    waiting: [],
    called: [],
    inChair: [],
    barbers: [],
    stats: {},
    salonSettings: {},
  });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Walk-in Modal Form States
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServices, setWalkInServices] = useState([]);
  const [walkInBarber, setWalkInBarber] = useState('any');
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState(null);

  // Action Loading State
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Digital Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Full Reception Snapshot
  const loadBoardData = useCallback(async () => {
    try {
      setError(null);
      const [boardRes, servicesRes] = await Promise.all([
        api.getReceptionBoard(),
        api.getServices(),
      ]);

      if (boardRes.success && boardRes.data) {
        setBoard(boardRes.data);
      }
      setServices(servicesRes.data || []);
    } catch (err) {
      console.error('[Reception] Error loading board:', err);
      setError(err.message || 'Failed to load reception board');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and Socket.IO real-time subscription
  useEffect(() => {
    loadBoardData();

    if (socket) {
      socket.emit('join:global');

      const handleQueueUpdate = () => {
        loadBoardData();
      };

      const handleBarberUpdate = () => {
        loadBoardData();
      };

      socket.on('queue:updated', handleQueueUpdate);
      socket.on('barber:status_changed', handleBarberUpdate);

      return () => {
        socket.off('queue:updated', handleQueueUpdate);
        socket.off('barber:status_changed', handleBarberUpdate);
      };
    }
  }, [socket, loadBoardData]);

  // Periodic 30s auto-refresh for waiting minutes counters
  useEffect(() => {
    const interval = setInterval(() => {
      loadBoardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadBoardData]);

  // Handle Online Queue Toggle
  const handleToggleOnlineQueue = async () => {
    try {
      const currentState = board.salonSettings?.isOnlineQueueOpen ?? true;
      const res = await api.updateSalonSettings({ isOnlineQueueOpen: !currentState });
      if (res.success) {
        setBoard((prev) => ({
          ...prev,
          salonSettings: { ...prev.salonSettings, isOnlineQueueOpen: !currentState },
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update online queue setting');
    }
  };

  // Handle Algorithmic "Call Next" for a Barber
  const handleCallNextForBarber = async (barberId) => {
    try {
      setActionLoadingId(barberId);
      const res = await api.callNextForBarber(barberId);
      if (res.success) {
        await loadBoardData();
      }
    } catch (err) {
      alert(err.message || 'Could not call customer');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Barber Break Toggle
  const handleToggleBreak = async (barberId) => {
    try {
      setActionLoadingId(`break-${barberId}`);
      const res = await api.toggleBarberBreak(barberId);
      if (res.success) {
        await loadBoardData();
      }
    } catch (err) {
      alert(err.message || 'Could not toggle break status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Customer Seated (IN_CHAIR)
  const handleStartService = async (ticketId) => {
    try {
      setActionLoadingId(`start-${ticketId}`);
      await api.startService(ticketId);
      await loadBoardData();
    } catch (err) {
      alert(err.message || 'Could not seat customer');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Customer Service Done (DONE)
  const handleCompleteService = async (ticketId) => {
    try {
      setActionLoadingId(`done-${ticketId}`);
      await api.completeService(ticketId);
      await loadBoardData();
    } catch (err) {
      alert(err.message || 'Could not complete service');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Mark No-Show (NO_SHOW)
  const handleMarkNoShow = async (ticketId) => {
    if (!window.confirm('Mark this customer as No-Show? This will release the barber.')) return;
    try {
      setActionLoadingId(`noshow-${ticketId}`);
      await api.markNoShow(ticketId);
      await loadBoardData();
    } catch (err) {
      alert(err.message || 'Could not mark no-show');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Cancellation from Reception
  const handleCancelTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to cancel this waiting queue ticket?')) return;
    try {
      setActionLoadingId(`cancel-${ticketId}`);
      await api.cancelTicket(ticketId);
      await loadBoardData();
    } catch (err) {
      alert(err.message || 'Could not cancel ticket');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Walk-in Submission
  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setWalkInError(null);

    if (!walkInName.trim() || walkInName.trim().length < 2) {
      setWalkInError('Please enter a valid customer name.');
      return;
    }

    const cleanedPhone = walkInPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      setWalkInError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (walkInServices.length === 0) {
      setWalkInError('Please select at least 1 service.');
      return;
    }

    try {
      setWalkInSubmitting(true);
      const payload = {
        customerName: walkInName.trim(),
        customerPhone: cleanedPhone,
        serviceIds: walkInServices,
        preferredBarberId: walkInBarber === 'any' ? null : walkInBarber,
      };

      const res = await api.addWalkIn(payload);
      if (res.success) {
        setIsWalkInModalOpen(false);
        setWalkInName('');
        setWalkInPhone('');
        setWalkInServices([]);
        setWalkInBarber('any');
        await loadBoardData();
      }
    } catch (err) {
      setWalkInError(err.message || 'Failed to register walk-in');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const toggleWalkInService = (serviceId) => {
    const idStr = String(serviceId);
    if (walkInServices.includes(idStr)) {
      setWalkInServices(walkInServices.filter((id) => id !== idStr));
    } else {
      if (walkInServices.length >= 3) return;
      setWalkInServices([...walkInServices, idStr]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-400">{t('common.loading', 'Loading reception board...')}</p>
      </div>
    );
  }

  const {
    waiting = [],
    called = [],
    inChair = [],
    barbers = [],
    stats = {},
    salonSettings = {},
  } = board;

  const isOnlineOpen = salonSettings?.isOnlineQueueOpen ?? true;

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* 1. TOP UTILITY HEADER (Optimized for 10" Tablet Landscape) */}
      <div className="bg-salon-darker border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Left Title & Digital Clock */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-salon-gold/15 border border-salon-gold/40 flex items-center justify-center text-salon-gold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {t('reception.title', 'Reception Command Center')}
            </h1>
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <span className="font-mono font-bold text-salon-gold">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span>•</span>
              <span className="text-gray-300 font-medium">10" Tablet Landscape Mode</span>
            </p>
          </div>
        </div>

        {/* Center Live KPI Summary Strip */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-salon-surface border border-gray-700 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
              {t('reception.metricsWaiting', 'Waiting')}
            </p>
            <p className="text-lg font-black text-white">{waiting.length}</p>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-salon-surface border border-gray-700 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
              {t('reception.metricsInChair', 'In Chair')}
            </p>
            <p className="text-lg font-black text-emerald-400">{inChair.length}</p>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-salon-surface border border-gray-700 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
              {t('reception.metricsDone', 'Completed')}
            </p>
            <p className="text-lg font-black text-salon-gold">{stats.completedTodayCount || 0}</p>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-salon-surface border border-gray-700 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
              {t('reception.metricsAvgWait', 'Avg Wait')}
            </p>
            <p className="text-lg font-black text-salon-gold">
              ~{stats.estimatedWaitMinutes || 0}m
            </p>
          </div>
        </div>

        {/* Right Controls: Online Queue Switch & Walk-In Intake Trigger */}
        <div className="flex items-center gap-3">
          {/* Online Queue Switch */}
          <button
            onClick={handleToggleOnlineQueue}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              isOnlineOpen
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/15 border-red-500/40 text-red-300'
            }`}
            title="Click to toggle online queue open/close"
          >
            <Power className="w-3.5 h-3.5" />
            <span>
              Online: {isOnlineOpen ? t('reception.onlineOpen', 'OPEN') : t('reception.onlineClosed', 'CLOSED')}
            </span>
          </button>

          {/* Quick Refresh */}
          <button
            onClick={loadBoardData}
            className="p-2.5 rounded-xl bg-salon-surface border border-gray-700 text-gray-300 hover:text-salon-gold hover:border-salon-gold transition-colors"
            title="Refresh Board"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Add Walk-in Primary Action */}
          <Button
            size="md"
            variant="gold"
            icon={UserPlus}
            onClick={() => {
              setIsWalkInModalOpen(true);
              setWalkInError(null);
            }}
            className="font-bold shadow-gold-glow"
          >
            {t('reception.walkInBtn', '+ Add Walk-in')}
          </Button>
        </div>
      </div>

      {/* 2. BARBER CHAIR STATION STRIP (Chair Singularity & Call Next) */}
      <div className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-salon-gold flex items-center gap-2">
          <Scissors className="w-4 h-4" />
          {t('reception.barberStations', 'Barber Stations & Chair Singularity')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {barbers.map((barber) => {
            const isOccupied = barber.isOccupied;
            const currentCust = barber.currentCustomer;
            const isOnBreak = barber.isOnBreak;
            const isActionLoading = actionLoadingId === barber._id;

            return (
              <Card
                key={barber._id}
                variant={isOccupied ? 'goldBorder' : 'default'}
                className="p-4 space-y-3 relative border-gray-800"
              >
                {/* Station & Status Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-salon-surface border border-gray-700 flex items-center justify-center font-bold text-xs text-salon-gold">
                      C{barber.chairNumber}
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm leading-tight">{barber.name}</p>
                      <p className="text-[11px] text-gray-400">Station {barber.chairNumber}</p>
                    </div>
                  </div>

                  <div>
                    {isOnBreak ? (
                      <Badge variant="amber" size="sm">
                        <Coffee className="w-3 h-3 mr-1" />
                        {t('reception.onBreak', 'On Break')}
                      </Badge>
                    ) : isOccupied ? (
                      <Badge
                        variant={currentCust?.status === 'CALLED' ? 'amber' : 'green'}
                        size="sm"
                        pulse={currentCust?.status === 'CALLED'}
                      >
                        {currentCust?.status === 'CALLED'
                          ? t('reception.calling', 'Paging')
                          : t('reception.occupied', 'In Chair')}
                      </Badge>
                    ) : (
                      <Badge variant="green" size="sm">
                        {t('reception.available', 'Available')}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Assigned Customer Mini Banner */}
                <div className="p-2.5 rounded-xl bg-salon-darker border border-gray-800 text-xs min-h-[58px] flex flex-col justify-center">
                  {currentCust ? (
                    <div>
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-salon-gold font-mono text-sm">
                          {currentCust.tokenNumber}
                        </span>
                        <span className="text-gray-300 truncate max-w-[120px]">
                          {currentCust.customerName}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {currentCust.services?.map((s) => s.name?.en || s.name).join(', ')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 text-center italic">
                      Chair is vacant • Ready for next
                    </p>
                  )}
                </div>

                {/* Barber Station Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Call Next Button (Rule 3 & Rule 4) */}
                  <Button
                    size="sm"
                    variant="gold"
                    disabled={isOccupied || isOnBreak || isActionLoading}
                    loading={isActionLoading}
                    icon={Bell}
                    onClick={() => handleCallNextForBarber(barber._id)}
                    className="text-xs py-1.5 font-bold"
                  >
                    {t('reception.callNext', 'Call Next')}
                  </Button>

                  {/* Toggle Break Button */}
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Coffee}
                    onClick={() => handleToggleBreak(barber._id)}
                    className="text-xs py-1.5"
                  >
                    {isOnBreak
                      ? t('reception.endBreak', 'Resume')
                      : t('reception.takeBreak', 'Break')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 3. CALLED & IN-CHAIR CARDS (If any customer is paged or seated) */}
      {(called.length > 0 || inChair.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Section: Currently Paged / Called */}
          {called.length > 0 && (
            <Card variant="goldBorder" className="p-4 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Bell className="w-4 h-4 text-salon-gold animate-bounce" />
                {t('reception.calledSection', 'Paging / Called Customers')} ({called.length})
              </h3>

              <div className="space-y-2">
                {called.map((item) => (
                  <div
                    key={item._id}
                    className="p-3 rounded-xl bg-salon-darker border border-amber-500/40 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-salon-gold">
                          {item.tokenNumber}
                        </span>
                        <span className="font-bold text-white text-sm">{item.customerName}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Assigned: Station {item.assignedBarber?.chairNumber} ({item.assignedBarber?.name}) • Paging {item.calledMinutes}m ago
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="gold"
                        icon={CheckCircle2}
                        onClick={() => handleStartService(item._id)}
                      >
                        {t('reception.seatBtn', 'Seat in Chair')}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={XCircle}
                        onClick={() => handleMarkNoShow(item._id)}
                      >
                        {t('reception.markNoShowBtn', 'No-Show')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Section: Active In-Chair Services */}
          {inChair.length > 0 && (
            <Card variant="default" className="p-4 space-y-3 border-emerald-500/30">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-emerald-400" />
                {t('reception.inChairSection', 'Active in Chairs')} ({inChair.length})
              </h3>

              <div className="space-y-2">
                {inChair.map((item) => (
                  <div
                    key={item._id}
                    className="p-3 rounded-xl bg-salon-darker border border-gray-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-emerald-400">
                          {item.tokenNumber}
                        </span>
                        <span className="font-bold text-white text-sm">{item.customerName}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Station {item.assignedBarber?.chairNumber} ({item.assignedBarber?.name}) • Elapsed: {item.elapsedMinutes}m / {item.totalDuration}m
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="gold"
                      icon={Check}
                      onClick={() => handleCompleteService(item._id)}
                    >
                      {t('reception.markDoneBtn', 'Mark Done')}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 4. WAITING QUEUE TABLE (Strict FIFO Order + 60m SLA Breach Highlight) */}
      <Card variant="default" className="p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-800">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-salon-gold" />
            {t('reception.waitingTableTitle', 'Live Waiting Queue (FIFO Order)')} ({waiting.length})
          </h3>
          <span className="text-xs text-gray-400">
            Sorted by arrival timestamp (First-Come, First-Served)
          </span>
        </div>

        {waiting.length === 0 ? (
          <div className="py-12 text-center text-gray-500 space-y-2">
            <Users className="w-8 h-8 mx-auto text-gray-600" />
            <p className="text-sm">{t('reception.noWaiting', 'No customers currently waiting in line.')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">{t('reception.colToken', 'Token')}</th>
                  <th className="py-2.5 px-3">{t('reception.colCustomer', 'Customer')}</th>
                  <th className="py-2.5 px-3">{t('reception.colServices', 'Services')}</th>
                  <th className="py-2.5 px-3">{t('reception.colDurationPrice', 'Duration & Price')}</th>
                  <th className="py-2.5 px-3">{t('reception.colBarber', 'Barber Preference')}</th>
                  <th className="py-2.5 px-3">{t('reception.colWait', 'Wait Duration')}</th>
                  <th className="py-2.5 px-3 text-right">{t('reception.colActions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {waiting.map((item) => {
                  const isDelayed = item.isDelayed; // > 60 minutes SLA breach

                  return (
                    <tr
                      key={item._id}
                      className={`transition-colors ${
                        isDelayed
                          ? 'bg-red-950/25 border-l-4 border-l-red-500 hover:bg-red-950/35'
                          : 'hover:bg-salon-surface/40'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-3 font-bold text-gray-400">
                        #{item.queuePosition}
                      </td>

                      {/* Token Identifier */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-black text-base text-salon-gold">
                          {item.tokenNumber}
                        </span>
                        <span className="block text-[10px] text-gray-500">
                          {item.entryType}
                        </span>
                      </td>

                      {/* Customer Name & Phone */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-white text-sm leading-tight">
                          {item.customerName}
                        </p>
                        <p className="text-gray-400 text-[11px] font-mono mt-0.5">
                          {item.customerPhone}
                        </p>
                      </td>

                      {/* Selected Services */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {item.services?.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-salon-darker border border-gray-700 text-[11px] text-gray-300 whitespace-nowrap"
                            >
                              {s.name?.[language] || s.name?.en || s.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Total Duration & Price */}
                      <td className="py-3 px-3">
                        <p className="font-semibold text-white">~{item.totalDuration} mins</p>
                        <p className="text-salon-gold font-bold">₹{item.totalPrice}</p>
                      </td>

                      {/* Preferred Barber */}
                      <td className="py-3 px-3">
                        {item.preferredBarber ? (
                          <Badge variant="amber" size="sm">
                            {item.preferredBarber.name} (C{item.preferredBarber.chairNumber})
                          </Badge>
                        ) : (
                          <Badge variant="blue" size="sm">
                            Any Barber
                          </Badge>
                        )}
                      </td>

                      {/* Waiting Duration & 60m SLA Delay Highlight */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              isDelayed ? 'text-red-400 font-black' : 'text-gray-300'
                            }`}
                          >
                            {item.waitingMinutes} mins
                          </span>

                          {isDelayed && (
                            <Badge variant="red" size="sm" pulse>
                              {t('reception.delayAlert', 'DELAY > 60m')}
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelTicket(item._id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs py-1"
                        >
                          {t('reception.cancelBtn', 'Cancel')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 5. QUICK WALK-IN REGISTRATION MODAL */}
      <Modal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        title={t('reception.walkInModalTitle', 'Fast Walk-in Registration')}
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsWalkInModalOpen(false)}
            >
              {t('common.close', 'Close')}
            </Button>
            <Button
              size="md"
              variant="gold"
              loading={walkInSubmitting}
              onClick={handleWalkInSubmit}
              icon={Check}
            >
              Generate Walk-in Token
            </Button>
          </>
        }
      >
        <form onSubmit={handleWalkInSubmit} className="space-y-4">
          {walkInError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs">
              {walkInError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              required
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              placeholder="e.g. Ramesh Patel"
              className="w-full px-3 py-2.5 rounded-xl bg-salon-darker border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-salon-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
              Mobile Number (10 Digits) *
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={walkInPhone}
              onChange={(e) => setWalkInPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="9876543210"
              className="w-full px-3 py-2.5 rounded-xl bg-salon-darker border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-salon-gold"
            />
          </div>

          {/* Quick Service Selection */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-300 uppercase">Select Services (Max 3) *</span>
              <span className="text-gray-400">{walkInServices.length}/3 selected</span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {services.map((s) => {
                const isSelected = walkInServices.includes(String(s._id));
                const isDisabled = !isSelected && walkInServices.length >= 3;
                return (
                  <div
                    key={s._id}
                    onClick={() => !isDisabled && toggleWalkInService(s._id)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? 'border-salon-gold bg-salon-gold/15 text-white'
                        : isDisabled
                        ? 'border-gray-800 opacity-40 cursor-not-allowed text-gray-500'
                        : 'border-gray-700 bg-salon-darker text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <p className="font-semibold truncate">{s.name?.en || s.name}</p>
                      <p className="text-[10px] text-gray-400">₹{s.price} • {s.duration}m</p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-salon-gold shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barber Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
              Preferred Stylist / Barber
            </label>
            <select
              value={walkInBarber}
              onChange={(e) => setWalkInBarber(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-salon-darker border border-gray-700 text-white text-sm focus:outline-none focus:border-salon-gold"
            >
              <option value="any">Any Available Barber (Fastest)</option>
              {barbers
                .filter((b) => b.isWorkingToday)
                .map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} (Station {b.chairNumber}){b.isOnBreak ? ' - [On Break]' : ''}
                  </option>
                ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
