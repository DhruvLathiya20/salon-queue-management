import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { useAudioAlert } from '../hooks/useAudioAlert';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { Modal } from '../components/common/Modal';
import {
  Clock,
  Scissors,
  User,
  Phone,
  AlertTriangle,
  AlertCircle,
  Bell,
  CheckCircle2,
  XCircle,
  Navigation,
  Sparkles,
  ArrowLeft,
  Volume2,
  RefreshCw,
} from 'lucide-react';

export const MyStatusPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { socket, isConnected } = useSocket();
  const { playChime } = useAudioAlert();

  // Primary State
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interaction & Modal States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showTurnModal, setShowTurnModal] = useState(false);
  const [hasPlayedChime, setHasPlayedChime] = useState(false);

  // Determine ticket identifier from URL or localStorage
  const resolveTicketId = useCallback(() => {
    if (id && id !== 'demo') {
      return id;
    }
    try {
      const stored = localStorage.getItem('salon_active_ticket');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.tokenNumber || parsed.id;
      }
    } catch (e) {}
    return id;
  }, [id]);

  const fetchTicketData = useCallback(async (ticketId) => {
    if (!ticketId || ticketId === 'demo') {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const res = await api.getTicketStatus(ticketId);
      if (res.success && res.data) {
        setTicket(res.data);
        // Sync active ticket in localStorage
        try {
          localStorage.setItem(
            'salon_active_ticket',
            JSON.stringify({
              id: res.data._id,
              tokenNumber: res.data.tokenNumber,
              customerPhone: res.data.customerPhone,
              customerName: res.data.customerName,
            })
          );
        } catch (e) {}

        // Trigger turn alert if status is CALLED and chime not yet played
        if (res.data.status === 'CALLED') {
          setShowTurnModal(true);
        }
      }
    } catch (err) {
      console.error('[MyStatusPage] Error loading ticket status:', err);
      setError(err.message || 'Unable to retrieve your queue ticket.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling fallback
  useEffect(() => {
    const targetId = resolveTicketId();
    if (targetId && targetId !== 'demo') {
      fetchTicketData(targetId);
    } else {
      setLoading(false);
    }
  }, [resolveTicketId, fetchTicketData]);

  // Socket.IO Room Joining & Real-Time Event Handlers
  useEffect(() => {
    if (!socket || !ticket) return;

    const ticketId = ticket._id;
    const tokenNumber = ticket.tokenNumber;

    // Join customer-specific socket rooms
    socket.emit('join:customer', ticketId);
    socket.emit('join:customer', tokenNumber);

    // Event: Turn Called (Highest priority)
    const handleCustomerCalled = (payload) => {
      console.log('[Socket] Customer turn called:', payload);
      setTicket((prev) => (prev ? { ...prev, status: 'CALLED', ...payload } : prev));
      setShowTurnModal(true);
      if (!hasPlayedChime) {
        playChime();
        setHasPlayedChime(true);
      }
    };

    // Event: Status progression
    const handleStatusChanged = (payload) => {
      console.log('[Socket] Customer status changed:', payload);
      setTicket((prev) => (prev ? { ...prev, ...payload } : prev));
      if (payload.status === 'CALLED') {
        setShowTurnModal(true);
        playChime();
      }
    };

    // Event: Broad queue updates (recalculates position & EWT)
    const handleQueueUpdated = () => {
      if (ticket.status === 'WAITING') {
        fetchTicketData(ticket.tokenNumber || ticket._id);
      }
    };

    socket.on('customer:called', handleCustomerCalled);
    socket.on('customer:status_changed', handleStatusChanged);
    socket.on('queue:updated', handleQueueUpdated);

    return () => {
      socket.off('customer:called', handleCustomerCalled);
      socket.off('customer:status_changed', handleStatusChanged);
      socket.off('queue:updated', handleQueueUpdated);
    };
  }, [socket, ticket, hasPlayedChime, playChime, fetchTicketData]);

  // Handle Cancellation
  const handleConfirmCancel = async () => {
    if (!ticket) return;
    try {
      setCancelling(true);
      const res = await api.cancelTicket(ticket.tokenNumber || ticket._id);
      if (res.success && res.data) {
        setTicket(res.data);
        setIsCancelModalOpen(false);
        try {
          localStorage.removeItem('salon_active_ticket');
        } catch (e) {}
      }
    } catch (err) {
      alert(err.message || 'Could not cancel ticket');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-400">{t('common.loading', 'Retrieving live queue status...')}</p>
      </div>
    );
  }

  // Not found or no active ticket
  if (!ticket || error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 mx-auto flex items-center justify-center text-salon-gold">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">No Active Queue Ticket</h1>
          <p className="text-sm text-salon-textSecondary mt-1">
            {error || "We could not find an active queue entry with this code. Please check your token or join the queue."}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/join')} icon={Sparkles}>
            {t('home.joinBtn', 'Join Live Queue')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            {t('common.back', 'Go Home')}
          </Button>
        </div>
      </div>
    );
  }

  const {
    tokenNumber,
    customerName,
    customerPhone,
    status,
    position = 1,
    estimatedWaitMinutes = 15,
    services = [],
    totalPrice = 0,
    totalDuration = 0,
    preferredBarber,
    assignedBarber,
  } = ticket;

  // Mask phone for privacy (e.g. ******4821)
  const maskedPhone = customerPhone
    ? `******${customerPhone.slice(-4)}`
    : '';

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* 1. Header & Live Connection Indicator */}
      <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-800">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-gray-400 hover:text-salon-gold transition-colors font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('common.back', 'Back')}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTicketData(ticket.tokenNumber || ticket._id)}
            className="p-1 rounded text-gray-400 hover:text-salon-gold transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-salon-darker border border-gray-700 text-[11px] font-medium text-gray-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>
              {isConnected
                ? t('status.connected', 'Connected Live')
                : t('status.reconnecting', 'Reconnecting...')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Priority Position Notifications */}
      {status === 'WAITING' && position === 2 && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 shadow-gold-glow flex items-start gap-3 text-amber-200 animate-pulse">
          <Navigation className="w-6 h-6 text-salon-gold shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-white text-base">
              {t('status.startComingAlert', 'Start Coming! You are 2nd in line. Please head towards the salon.')}
            </p>
            <p className="text-xs text-amber-300/80 mt-0.5">
              Your turn is fast approaching. Arrive early so you do not miss your call!
            </p>
          </div>
        </div>
      )}

      {status === 'WAITING' && position === 1 && (
        <div className="p-4 rounded-2xl bg-salon-gold/20 border-2 border-salon-gold shadow-gold-glow flex items-start gap-3 text-white">
          <Sparkles className="w-6 h-6 text-salon-gold shrink-0 mt-0.5 animate-bounce" />
          <div>
            <p className="font-extrabold text-salon-gold text-base">
              {t('status.nextAlert', 'You are NEXT! Please wait near the salon entrance.')}
            </p>
            <p className="text-xs text-gray-200 mt-0.5">
              The next available chair is being prepared for you right now.
            </p>
          </div>
        </div>
      )}

      {status === 'CALLED' && (
        <div
          onClick={() => setShowTurnModal(true)}
          className="p-4 rounded-2xl bg-salon-gold/25 border-2 border-salon-gold shadow-gold-glow cursor-pointer flex items-center justify-between text-white animate-pulse"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-salon-gold shrink-0" />
            <div>
              <p className="font-black text-lg text-salon-gold">
                {t('status.calledAlert', 'Please proceed to your assigned chair now!')}
              </p>
              <p className="text-xs text-gray-300">
                {assignedBarber
                  ? `Station ${assignedBarber.chairNumber} • Stylist ${assignedBarber.name}`
                  : 'Your chair is ready!'}
              </p>
            </div>
          </div>
          <Button size="sm" variant="gold">
            View
          </Button>
        </div>
      )}

      {/* 3. Central Token Pass Card */}
      <Card
        variant={status === 'CALLED' ? 'goldBorder' : 'default'}
        className="space-y-6 text-center relative overflow-hidden"
      >
        {/* State Badge */}
        <div>
          <Badge
            variant={
              status === 'WAITING'
                ? position <= 2
                  ? 'amber'
                  : 'blue'
                : status === 'CALLED'
                ? 'amber'
                : status === 'IN_CHAIR'
                ? 'green'
                : status === 'DONE'
                ? 'gray'
                : 'red'
            }
            size="md"
            pulse={status === 'CALLED' || (status === 'WAITING' && position <= 2)}
          >
            {status === 'WAITING'
              ? t('status.stateWaiting', 'Waiting in Line')
              : status === 'CALLED'
              ? t('status.stateCalled', "It's Your Turn! Please Proceed")
              : status === 'IN_CHAIR'
              ? t('status.stateInChair', 'Service in Progress')
              : status === 'DONE'
              ? t('status.stateDone', 'Service Completed')
              : status === 'CANCELLED'
              ? t('status.stateCancelled', 'Queue Entry Cancelled')
              : t('status.stateNoShow', 'Marked as No-Show')}
          </Badge>
        </div>

        {/* Large Token Identifier */}
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
            {t('status.tokenLabel', 'Your Token Number')}
          </p>
          <div className="text-6xl sm:text-7xl font-black text-salon-gold tracking-tight py-1 font-mono">
            {tokenNumber}
          </div>
          <p className="text-sm font-semibold text-white">
            {customerName} {maskedPhone && <span className="text-gray-400 font-normal">({maskedPhone})</span>}
          </p>
        </div>

        {/* Dynamic Queue Metrics (When WAITING) */}
        {status === 'WAITING' && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-salon-surface border border-gray-700">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                {t('status.positionLabel', 'Position in Line')}
              </p>
              <p className="text-3xl font-black text-white mt-1">
                #{position}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {position === 1 ? 'Next to be called' : `${position - 1} ahead of you`}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-salon-surface border border-gray-700">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                {t('status.waitLabel', 'Estimated Wait')}
              </p>
              <p className="text-3xl font-black text-salon-gold mt-1">
                ~{estimatedWaitMinutes}m
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Approximate turnaround
              </p>
            </div>
          </div>
        )}

        {/* Contextual Card: IN_CHAIR */}
        {status === 'IN_CHAIR' && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm space-y-1">
            <p className="font-bold">
              {t('status.inChairMsg', 'Relax and enjoy your service. Our stylist is attending to you.')}
            </p>
            {assignedBarber && (
              <p className="text-xs text-gray-300">
                Stylist: <span className="font-bold text-white">{assignedBarber.name}</span> (Station {assignedBarber.chairNumber})
              </p>
            )}
          </div>
        )}

        {/* Contextual Card: DONE */}
        {status === 'DONE' && (
          <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 text-sm space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-bold text-white">
              {t('status.thankYouMsg', 'Thank you for visiting Elite Salon! We hope to see you again soon.')}
            </p>
            <Button size="sm" onClick={() => navigate('/join')} className="mt-2">
              {t('status.rejoinBtn', 'Join Queue Again')}
            </Button>
          </div>
        )}

        {/* Contextual Card: CANCELLED */}
        {status === 'CANCELLED' && (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-800/40 text-red-300 text-sm space-y-2">
            <XCircle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="font-bold">
              {t('status.cancelledMsg', "This queue token has been cancelled. Feel free to join again whenever you're ready.")}
            </p>
            <Button size="sm" onClick={() => navigate('/join')} className="mt-2">
              {t('status.rejoinBtn', 'Join Queue Again')}
            </Button>
          </div>
        )}

        {/* Contextual Card: NO_SHOW */}
        {status === 'NO_SHOW' && (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-700 text-red-300 text-sm space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="font-bold">
              {t('status.noShowMsg', 'You were marked as No-Show because you did not arrive when called. Please speak with reception or rejoin the queue.')}
            </p>
            <Button size="sm" onClick={() => navigate('/join')} className="mt-2">
              {t('status.rejoinBtn', 'Join Queue Again')}
            </Button>
          </div>
        )}

        {/* 4. Booked Services Summary */}
        <div className="p-4 rounded-xl bg-salon-darker border border-gray-800 text-left space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span>{t('status.servicesBooked', 'Booked Services')}</span>
            <span>~{totalDuration} mins • ₹{totalPrice}</span>
          </div>

          <div className="divide-y divide-gray-800 text-xs">
            {services.map((item, idx) => {
              const localizedName = item.name?.[language] || item.name?.en || item.name;
              return (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <span className="font-semibold text-white">{localizedName}</span>
                  <span className="text-gray-400 font-medium">
                    {item.duration}m • ₹{item.price}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-400">{t('join.preferredStylist', 'Stylist Preference')}:</span>
            <span className="font-bold text-salon-gold">
              {preferredBarber
                ? `${preferredBarber.name} (Station ${preferredBarber.chairNumber})`
                : t('join.anyBarber', 'Any Available Barber')}
            </span>
          </div>
        </div>

        {/* 5. Cancel Spot Action (Only when WAITING) */}
        {status === 'WAITING' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCancelModalOpen(true)}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 w-full"
          >
            {t('status.cancelBtn', 'Cancel My Queue Spot')}
          </Button>
        )}
      </Card>

      {/* 6. Audio Notification Test / Sound Status Pill */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
        <Volume2 className="w-3.5 h-3.5 text-salon-gold" />
        <span>Audio alert chime enabled for when your turn is paged</span>
        <button
          onClick={playChime}
          className="text-salon-gold underline ml-1 hover:text-white"
        >
          Test Chime
        </button>
      </div>

      {/* 7. Full-Screen "IT'S YOUR TURN" Modal Banner */}
      <Modal
        isOpen={showTurnModal}
        onClose={() => setShowTurnModal(false)}
        title="🔔 IT'S YOUR TURN!"
        maxWidth="max-w-lg"
        footer={
          <Button
            size="lg"
            variant="gold"
            onClick={() => setShowTurnModal(false)}
            className="w-full font-extrabold text-base py-3"
          >
            {t('status.dismissBtn', 'I Am Heading In Now')}
          </Button>
        }
      >
        <div className="text-center space-y-6 py-2">
          <div className="w-20 h-20 rounded-full bg-salon-gold/20 border-2 border-salon-gold text-salon-gold mx-auto flex items-center justify-center animate-bounce shadow-gold-glow">
            <Bell className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {t('status.fullScreenTitle', "IT'S YOUR TURN!")}
            </h2>
            <p className="text-sm text-salon-textSecondary">
              {t('status.fullScreenSubtitle', 'Your chair is ready! Please proceed immediately.')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-salon-darker border-2 border-salon-gold/60 space-y-2">
            <p className="text-xs uppercase tracking-widest text-salon-gold font-bold">
              {t('status.tokenLabel', 'Token Number')}
            </p>
            <p className="text-5xl font-black text-white font-mono">{tokenNumber}</p>

            <div className="pt-2 border-t border-gray-800 text-sm">
              <span className="text-gray-400">
                {t('status.stationAssigned', 'Proceed to Station')}:
              </span>
              <p className="text-lg font-black text-salon-gold mt-0.5">
                Station {assignedBarber?.chairNumber || 1} • {assignedBarber?.name || 'Stylist'}
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* 8. Cancellation Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={t('status.cancelConfirmTitle', 'Confirm Cancellation')}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
            >
              {t('status.cancelKeepBtn', 'Keep My Spot')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancelling}
              onClick={handleConfirmCancel}
            >
              {t('status.cancelDoBtn', 'Yes, Cancel Spot')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm">
            {t(
              'status.cancelConfirmMsg',
              'Are you sure you want to give up your spot in line? You will lose your token and must rejoin at the end if you change your mind.'
            )}
          </p>
        </div>
      </Modal>
    </div>
  );
};
