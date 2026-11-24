import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { useAudioAlert } from '../hooks/useAudioAlert';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import {
  Scissors,
  Clock,
  Bell,
  Coffee,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const DisplayPage = () => {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const { playChime } = useAudioAlert();

  // State
  const [displayData, setDisplayData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Turn Paging Flash Banner (Triggered by display:paged socket event)
  const [pagedCustomer, setPagedCustomer] = useState(null);
  const [pagedHighlightStation, setPagedHighlightStation] = useState(null);

  // Digital Clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen support
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const fetchDisplayData = useCallback(async () => {
    try {
      const res = await api.getDisplayData();
      if (res.success && res.data) {
        setDisplayData(res.data);
      }
    } catch (err) {
      console.error('[DisplayPage] Error loading display data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisplayData();

    if (socket) {
      socket.emit('join:global');

      const handleQueueUpdate = () => {
        fetchDisplayData();
      };

      const handleDisplayPaged = (payload) => {
        console.log('[TV Display] Customer paged event received:', payload);
        setPagedCustomer(payload);
        setPagedHighlightStation(payload.chairNumber);
        playChime();

        // Auto dismiss banner after 6 seconds
        setTimeout(() => {
          setPagedCustomer(null);
          setPagedHighlightStation(null);
        }, 6000);

        fetchDisplayData();
      };

      const handleBarberUpdate = () => {
        fetchDisplayData();
      };

      socket.on('queue:updated', handleQueueUpdate);
      socket.on('display:paged', handleDisplayPaged);
      socket.on('barber:status_changed', handleBarberUpdate);

      return () => {
        socket.off('queue:updated', handleQueueUpdate);
        socket.off('display:paged', handleDisplayPaged);
        socket.off('barber:status_changed', handleBarberUpdate);
      };
    }
  }, [socket, playChime, fetchDisplayData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-salon-darker flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" />
        <p className="text-xl text-salon-gold font-bold uppercase tracking-wider">
          Initializing Waiting Area TV Broadcast...
        </p>
      </div>
    );
  }

  const stations = displayData?.stations || [];
  const nextFiveTokens = displayData?.nextFiveTokens || [];
  const salonName = displayData?.salonSettings?.salonName || 'Elite Salon';

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden relative">
      {/* 1. TOP BROADCAST HEADER (Visible from 5+ meters) */}
      <header className="flex items-center justify-between pb-6 border-b border-gray-800">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-salon-gold to-salon-goldHover flex items-center justify-center text-black font-black shadow-gold-glow">
            <Scissors className="w-9 h-9 text-black" />
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase">
              {salonName}
            </h1>
            <p className="text-sm uppercase tracking-widest text-salon-gold font-bold mt-0.5">
              Live Lounge Queue Broadcast
            </p>
          </div>
        </div>

        {/* Right Digital Clock & Fullscreen Control */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-4xl sm:text-5xl font-mono font-black text-white tracking-wider">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-salon-gold uppercase font-bold tracking-widest mt-0.5">
              Live Sync Channel 🟢
            </p>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-salon-gold border border-gray-700 transition-colors"
            title="Toggle TV Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* 2. MAIN 2-COLUMN DISPLAY (Stations 62% | Next 5 Ticker 38%) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-8">
        {/* Left Column: Stylist Stations (62% Width) */}
        <section className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-salon-gold uppercase tracking-wider flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-salon-gold animate-ping" />
              {t('display.nowServing', 'Now Serving at Stations')}
            </h2>
            <span className="text-sm font-semibold text-gray-400">
              Watch for your token number
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {stations.map((st) => {
              const isPaging = st.status === 'CALLED' || pagedHighlightStation === st.chairNumber;
              const isInChair = st.status === 'IN_CHAIR';
              const isOnBreak = st.status === 'ON_BREAK';

              return (
                <div
                  key={st.chairNumber}
                  className={`rounded-3xl p-6 transition-all duration-300 relative border-2 ${
                    isPaging
                      ? 'bg-amber-950/40 border-salon-gold shadow-[0_0_35px_rgba(212,160,23,0.5)] animate-pulse'
                      : isInChair
                      ? 'bg-slate-900/90 border-emerald-500/50 shadow-xl'
                      : 'bg-slate-900/60 border-gray-800'
                  }`}
                >
                  {/* Station Number & Stylist Name */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-800/80">
                    <span className="text-lg uppercase tracking-wider font-extrabold text-gray-300">
                      Station {st.chairNumber} • {st.barberName}
                    </span>

                    <Badge
                      variant={
                        isPaging
                          ? 'amber'
                          : isInChair
                          ? 'green'
                          : isOnBreak
                          ? 'amber'
                          : 'gray'
                      }
                      size="md"
                      pulse={isPaging}
                    >
                      {isPaging ? (
                        <>
                          <Bell className="w-3 h-3 mr-1" />
                          PAGING NOW
                        </>
                      ) : isInChair ? (
                        <>
                          <Scissors className="w-3 h-3 mr-1" />
                          IN SERVICE
                        </>
                      ) : isOnBreak ? (
                        <>
                          <Coffee className="w-3 h-3 mr-1" />
                          ON BREAK
                        </>
                      ) : (
                        'READY'
                      )}
                    </Badge>
                  </div>

                  {/* Gigantic Token Display (Legible from 5+ meters) */}
                  <div className="py-4 text-center">
                    <span
                      className={`text-6xl sm:text-7xl font-mono font-black tracking-tight ${
                        isPaging
                          ? 'text-salon-gold drop-shadow-[0_0_20px_rgba(212,160,23,0.6)]'
                          : isInChair
                          ? 'text-white'
                          : 'text-gray-600'
                      }`}
                    >
                      {st.activeCustomer?.tokenNumber || '---'}
                    </span>
                  </div>

                  {/* Customer Name or Ready Status */}
                  <div className="text-center pt-2 border-t border-gray-800/80">
                    <p className="text-lg font-bold text-gray-300 truncate">
                      {st.activeCustomer?.customerName || (isOnBreak ? 'Stylist on break' : 'Ready for next customer')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Next 5 Upcoming Tokens (38% Width) */}
        <section className="lg:col-span-4 space-y-4">
          <h2 className="text-2xl font-black text-salon-gold uppercase tracking-wider flex items-center gap-3">
            <Clock className="w-6 h-6 text-salon-gold" />
            {t('display.upcoming', 'Upcoming in Queue')}
          </h2>

          <div className="space-y-3">
            {nextFiveTokens.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-gray-800 text-center text-gray-500 italic">
                No upcoming customers in queue.
              </div>
            ) : (
              nextFiveTokens.map((item) => (
                <div
                  key={item.tokenNumber}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-gray-800 flex items-center justify-between shadow-lg hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 text-xl font-mono font-black text-gray-500">
                      #{item.rank}
                    </span>
                    <span className="text-3xl sm:text-4xl font-mono font-black text-white">
                      {item.tokenNumber}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-400">
                      {item.preference}
                    </p>
                    <p className="text-sm font-black text-salon-gold mt-0.5">
                      {item.estimatedWait}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* 3. FOOTER INSTRUCTION BANNER */}
      <footer className="pt-4 border-t border-gray-800 text-center text-sm font-semibold text-gray-400 uppercase tracking-widest">
        Please watch this screen • When your token is called, proceed promptly to your designated chair station
      </footer>

      {/* 4. TURN PAGING 5-SECOND POPUP BANNER (Audio-Visual Alert) */}
      {pagedCustomer && (
        <div className="fixed inset-x-8 top-12 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-amber-600 via-salon-gold to-amber-600 text-black p-6 sm:p-8 rounded-3xl shadow-[0_0_60px_rgba(212,160,23,0.8)] border-4 border-white text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <Bell className="w-10 h-10 animate-spin" />
              <span className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
                NOW CALLING
              </span>
              <Bell className="w-10 h-10 animate-spin" />
            </div>

            <p className="text-6xl sm:text-7xl font-mono font-black tracking-tight">
              TOKEN {pagedCustomer.tokenNumber}
            </p>

            <p className="text-2xl sm:text-3xl font-extrabold uppercase">
              PLEASE PROCEED TO STATION {pagedCustomer.chairNumber} ({pagedCustomer.barberName})
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
