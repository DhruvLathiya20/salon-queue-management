import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import {
  Scissors,
  Coffee,
  CheckCircle2,
  Bell,
  Clock,
  User,
  Users,
  ChevronRight,
  AlertCircle,
  Play,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const BarberPage = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { socket, isConnected } = useSocket();

  // State
  const [stationData, setStationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Live stopwatch for active customer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const barberSlug = name || 'rajesh';

  const fetchStationData = useCallback(async () => {
    try {
      setError(null);
      const res = await api.getBarberStation(barberSlug);
      if (res.success && res.data) {
        setStationData(res.data);
        if (res.data.currentCustomer?.startedAt) {
          const diffSec = Math.floor(
            (Date.now() - new Date(res.data.currentCustomer.startedAt).getTime()) / 1000
          );
          setElapsedSeconds(Math.max(0, diffSec));
        } else {
          setElapsedSeconds(0);
        }
      }
    } catch (err) {
      console.error('[BarberPage] Error loading station data:', err);
      setError(err.message || 'Unable to load barber station');
    } finally {
      setLoading(false);
    }
  }, [barberSlug]);

  useEffect(() => {
    fetchStationData();

    if (socket) {
      socket.emit('join:global');

      const handleQueueUpdate = () => {
        fetchStationData();
      };
      const handleBarberUpdate = () => {
        fetchStationData();
      };

      socket.on('queue:updated', handleQueueUpdate);
      socket.on('barber:status_changed', handleBarberUpdate);

      return () => {
        socket.off('queue:updated', handleQueueUpdate);
        socket.off('barber:status_changed', handleBarberUpdate);
      };
    }
  }, [socket, fetchStationData]);

  // Stopwatch timer interval
  useEffect(() => {
    let interval = null;
    if (stationData?.currentCustomer?.status === 'IN_CHAIR') {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stationData?.currentCustomer?.status]);

  // Handle Call Next Customer (Rule 4)
  const handleCallNext = async () => {
    if (!stationData?.barber) return;
    try {
      setActionLoading(true);
      const res = await api.callNextForBarber(stationData.barber._id);
      if (res.success) {
        await fetchStationData();
      }
    } catch (err) {
      alert(err.message || 'Could not call customer');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Start Service (Transition: CALLED -> IN_CHAIR)
  const handleStartService = async () => {
    const cust = stationData?.currentCustomer;
    if (!cust) return;
    try {
      setActionLoading(true);
      await api.startService(cust.tokenNumber || cust._id);
      await fetchStationData();
    } catch (err) {
      alert(err.message || 'Could not start service');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Mark Done (Transition: IN_CHAIR -> DONE)
  const handleCompleteService = async () => {
    const cust = stationData?.currentCustomer;
    if (!cust) return;
    try {
      setActionLoading(true);
      await api.completeService(cust.tokenNumber || cust._id);
      await fetchStationData();
    } catch (err) {
      alert(err.message || 'Could not mark service as completed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Break Toggle
  const handleToggleBreak = async () => {
    if (!stationData?.barber) return;
    try {
      setActionLoading(true);
      await api.toggleBarberBreak(stationData.barber._id);
      await fetchStationData();
    } catch (err) {
      alert(err.message || 'Could not toggle break status');
    } finally {
      setActionLoading(false);
    }
  };

  const formatStopwatch = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-400">Connecting to barber styling station...</p>
      </div>
    );
  }

  if (error || !stationData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-salon-gold mx-auto" />
        <h1 className="text-xl font-bold text-white">Barber Station Error</h1>
        <p className="text-sm text-gray-400">{error || 'Station not found'}</p>
        <Button onClick={fetchStationData}>Retry</Button>
      </div>
    );
  }

  const {
    barber,
    allBarbers = [],
    currentCustomer,
    nextEligibleCustomer,
    upcomingQueue = [],
  } = stationData;

  const isOnBreak = barber.isOnBreak;
  const isOccupied = Boolean(currentCustomer);
  const isCalling = currentCustomer?.status === 'CALLED';
  const isInChair = currentCustomer?.status === 'IN_CHAIR';

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5">
      {/* 1. Header with Station Switcher & Break Toggle */}
      <div className="bg-salon-darker border border-gray-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-salon-gold to-salon-goldHover text-black flex items-center justify-center font-black text-sm shadow-gold-glow">
              C{barber.chairNumber}
            </div>
            <div>
              <h1 className="font-black text-lg text-white leading-tight">{barber.name}</h1>
              <p className="text-xs text-gray-400">Station {barber.chairNumber} • Mobile Controls</p>
            </div>
          </div>

          {/* Available / On Break Toggle Button */}
          <button
            onClick={handleToggleBreak}
            disabled={actionLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              isOnBreak
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-gold-glow'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>{isOnBreak ? t('barber.onBreak', 'On Break') : t('barber.available', 'Available')}</span>
          </button>
        </div>

        {/* Quick Station Switcher Tabs */}
        <div className="pt-2 border-t border-gray-800 flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-[10px] uppercase font-bold text-gray-500 shrink-0 mr-1">Station:</span>
          {allBarbers.map((b) => (
            <button
              key={b._id}
              onClick={() => navigate(`/barber/${b.slug}`)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                b.slug === barber.slug
                  ? 'bg-salon-gold text-black shadow-sm font-bold'
                  : 'bg-salon-surface/60 text-gray-400 hover:text-white'
              }`}
            >
              C{b.chairNumber} {b.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 2. MAIN ACTIVE CUSTOMER STAGE */}
      {currentCustomer ? (
        <Card
          variant={isCalling ? 'goldBorder' : 'default'}
          className={`space-y-5 text-center p-6 ${
            isCalling ? 'border-2 border-salon-gold shadow-gold-glow' : 'border-emerald-500/40'
          }`}
        >
          {/* Status Badge */}
          <div className="flex justify-center">
            {isCalling ? (
              <Badge variant="amber" size="md" pulse>
                <Bell className="w-3.5 h-3.5 mr-1" />
                PAGING CUSTOMER TO CHAIR
              </Badge>
            ) : (
              <Badge variant="green" size="md">
                <Scissors className="w-3.5 h-3.5 mr-1" />
                CUSTOMER IN CHAIR
              </Badge>
            )}
          </div>

          {/* Token & Customer Info */}
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-salon-gold font-bold">
              Current Ticket
            </p>
            <div className="text-6xl font-black text-white font-mono tracking-tight">
              {currentCustomer.tokenNumber}
            </div>
            <p className="text-lg font-bold text-salon-textPrimary mt-1">
              {currentCustomer.customerName}
            </p>
          </div>

          {/* Services Requested Breakdown */}
          <div className="p-3.5 rounded-xl bg-salon-darker border border-gray-800 text-left space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
              Selected Services:
            </p>
            <div className="space-y-1">
              {currentCustomer.services?.map((s, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="font-semibold text-white">{s.name?.en || s.name}</span>
                  <span className="text-salon-gold font-medium">{s.duration}m • ₹{s.price}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-gray-800 flex justify-between text-xs font-bold">
              <span className="text-gray-400">Total:</span>
              <span className="text-white">~{currentCustomer.totalDuration} mins • ₹{currentCustomer.totalPrice}</span>
            </div>
          </div>

          {/* Stopwatch / Progress Timer (When IN_CHAIR) */}
          {isInChair && (
            <div className="p-4 rounded-xl bg-salon-surface border border-gray-700 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-salon-gold" />
                  Service Stopwatch
                </span>
                <span>Est. {currentCustomer.totalDuration}m</span>
              </div>

              <div className="text-3xl font-black text-emerald-400 font-mono tracking-wider">
                {formatStopwatch(elapsedSeconds)}
              </div>

              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(
                      100,
                      (elapsedSeconds / (currentCustomer.totalDuration * 60)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          {isCalling ? (
            <Button
              size="xl"
              variant="gold"
              icon={Play}
              loading={actionLoading}
              onClick={handleStartService}
              className="w-full font-black text-base py-4 shadow-gold-glow"
            >
              {t('barber.startService', 'Start Service (Customer Arrived)')}
            </Button>
          ) : (
            <Button
              size="xl"
              variant="gold"
              icon={Check}
              loading={actionLoading}
              onClick={handleCompleteService}
              className="w-full font-black text-base py-4 bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg"
            >
              {t('barber.completeService', 'Complete Service (Mark Done)')}
            </Button>
          )}
        </Card>
      ) : (
        /* Chair is Empty / Vacant */
        <Card variant="default" className="text-center p-8 space-y-6 border-dashed border-2 border-gray-700">
          <div className="w-16 h-16 rounded-2xl bg-salon-surface border border-gray-700 mx-auto flex items-center justify-center text-salon-gold">
            <Scissors className="w-8 h-8 text-salon-gold" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Chair is Vacant</h2>
            <p className="text-xs text-gray-400">
              {isOnBreak
                ? 'You are currently on break. Resume duty to take customers.'
                : 'Ready for next customer. Tap below to call from queue.'}
            </p>
          </div>

          {/* Call Next Action */}
          <Button
            size="xl"
            variant="gold"
            icon={Bell}
            disabled={isOnBreak || actionLoading}
            loading={actionLoading}
            onClick={handleCallNext}
            className="w-full font-black text-base py-4 shadow-gold-glow"
          >
            {t('barber.callNext', 'Call Next Customer')}
          </Button>
        </Card>
      )}

      {/* 3. NEXT ELIGIBLE CUSTOMER PREVIEW CARD (FIFO & Barber Affinity) */}
      <Card variant="default" className="p-4 space-y-3 border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-salon-gold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Next Eligible in Line
          </h3>
          <span className="text-[11px] text-gray-400">
            {upcomingQueue.length} in your pool
          </span>
        </div>

        {nextEligibleCustomer ? (
          <div className="p-3.5 rounded-xl bg-salon-surface/70 border border-gray-700/80 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-base text-salon-gold">
                  {nextEligibleCustomer.tokenNumber}
                </span>
                <span className="font-bold text-white text-sm">
                  {nextEligibleCustomer.customerName}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {nextEligibleCustomer.services?.map((s) => s.name?.en || s.name).join(', ')} • ~{nextEligibleCustomer.totalDuration}m
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <Badge variant={nextEligibleCustomer.preferredBarberId ? 'amber' : 'blue'} size="sm">
                  {nextEligibleCustomer.preferredBarberId ? 'Requested You' : 'Any Barber'}
                </Badge>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-salon-darker text-center text-xs text-gray-500 italic">
            No waiting customers currently in your queue pool.
          </div>
        )}
      </Card>
    </div>
  );
};
