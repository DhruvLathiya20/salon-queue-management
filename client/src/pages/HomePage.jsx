import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import {
  Clock,
  Users,
  UserCheck,
  Sparkles,
  ArrowRight,
  Search,
  Scissors,
  Coffee,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const HomePage = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salonStatus, setSalonStatus] = useState(null);
  const [stats, setStats] = useState({
    waitingCount: 0,
    workingBarbersCount: 0,
    estimatedWaitMinutes: 0,
  });
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [trackInput, setTrackInput] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [queueData, servicesData, barbersData] = await Promise.all([
        api.getLiveQueue(),
        api.getServices(),
        api.getBarbers(),
      ]);

      if (queueData.data) {
        setStats(queueData.data.stats || {});
        setSalonStatus(queueData.data.salonStatus || {});
      }
      setServices(servicesData.data || []);
      setBarbers(barbersData.data || []);
    } catch (err) {
      console.error('[HomePage] Error loading data:', err);
      setError(err.message || 'Unable to connect to salon server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for real-time queue updates from Socket.IO
    if (socket) {
      socket.emit('join:global');

      const handleQueueUpdate = (payload) => {
        if (payload?.stats) {
          setStats(payload.stats);
        }
      };

      socket.on('queue:updated', handleQueueUpdate);

      return () => {
        socket.off('queue:updated', handleQueueUpdate);
      };
    }
  }, [socket]);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackInput.trim()) return;
    navigate(`/status/${encodeURIComponent(trackInput.trim())}`);
  };

  const isOnlineIntakeAllowed = salonStatus?.isOnlineIntakeAllowed ?? true;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-12">
      {/* 1. Salon Operating Status Hero */}
      <div className="text-center space-y-4">
        {loading ? (
          <div className="flex justify-center">
            <Spinner size="sm" />
          </div>
        ) : isOnlineIntakeAllowed ? (
          <Badge variant="green" size="md" pulse>
            {t('home.badgeOpen', 'Salon Open & Accepting Queue')}
          </Badge>
        ) : salonStatus?.isSalonOpen ? (
          <Badge variant="amber" size="md">
            {t('home.badgeCutoff', 'Online Queue Closed (Walk-ins Only)')}
          </Badge>
        ) : (
          <Badge variant="red" size="md">
            {t('home.badgeClosed', 'Salon Closed')}
          </Badge>
        )}

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          {t('home.title', 'Skip the Wait, Save Your Time')}
        </h1>

        <p className="max-w-2xl mx-auto text-salon-textSecondary text-sm sm:text-base">
          {t(
            'home.subtitle',
            'Join our live digital virtual queue from anywhere, pick your favorite stylist and services, and get notified when your chair is ready.'
          )}
        </p>

        <p className="text-xs text-salon-gold font-semibold tracking-wide">
          {t('brand.hours', 'Operating Hours: 09:00 AM – 09:00 PM')}
        </p>
      </div>

      {/* 2. Live Queue Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card variant="default" className="text-center space-y-2 border-gray-800 hover:border-gray-700 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-white">
            {stats.waitingCount}
          </p>
          <p className="text-xs uppercase tracking-wider text-salon-textMuted font-semibold">
            {t('home.waitingCount', 'Currently Waiting')}
          </p>
        </Card>

        <Card variant="default" className="text-center space-y-2 border-gray-800 hover:border-gray-700 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-white">
            {stats.workingBarbersCount}
          </p>
          <p className="text-xs uppercase tracking-wider text-salon-textMuted font-semibold">
            {t('home.workingBarbers', 'Stylists on Duty')}
          </p>
        </Card>

        <Card variant="goldBorder" className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-salon-gold/10 text-salon-gold mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-salon-gold">
            ~{stats.estimatedWaitMinutes} {t('home.mins', 'mins')}
          </p>
          <p className="text-xs uppercase tracking-wider text-salon-textMuted font-semibold">
            {t('home.estWait', 'Avg Wait Time')}
          </p>
        </Card>
      </div>

      {/* 3. Primary CTAs & Token Tracker */}
      <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 max-w-xl mx-auto">
        <Button
          size="xl"
          onClick={() => navigate('/join')}
          disabled={!isOnlineIntakeAllowed}
          icon={Sparkles}
          className="w-full sm:flex-1"
        >
          {t('home.joinBtn', 'Join Live Queue')}
        </Button>

        <form onSubmit={handleTrackSubmit} className="flex gap-2 w-full sm:flex-1">
          <input
            type="text"
            value={trackInput}
            onChange={(e) => setTrackInput(e.target.value)}
            placeholder={t('home.trackPlaceholder', 'Token e.g. A-101')}
            className="flex-1 px-4 py-3 rounded-xl bg-salon-darker border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-salon-gold"
          />
          <Button
            type="submit"
            variant="outline"
            size="md"
            icon={Search}
            className="shrink-0"
          >
            {t('common.confirm', 'Track')}
          </Button>
        </form>
      </div>

      {/* 4. Active Barbers & Availability Showcase */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-salon-gold" />
            {t('home.ourStylists', 'Our Master Stylists Today')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {barbers.map((barber) => (
            <Card
              key={barber._id}
              variant="default"
              className="p-4 space-y-3 border-gray-800 hover:border-salon-gold/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-salon-surface border border-gray-700 flex items-center justify-center font-bold text-salon-gold">
                  {barber.chairNumber ? `C${barber.chairNumber}` : 'ST'}
                </div>
                {barber.isOnBreak ? (
                  <Badge variant="amber" size="sm">
                    <Coffee className="w-3 h-3 mr-1" />
                    {t('join.onBreak', 'On Break')}
                  </Badge>
                ) : barber.isWorkingToday ? (
                  <Badge variant="green" size="sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t('join.available', 'Available')}
                  </Badge>
                ) : (
                  <Badge variant="gray" size="sm">
                    Off Duty
                  </Badge>
                )}
              </div>

              <div>
                <p className="font-bold text-white text-base">{barber.name}</p>
                <p className="text-xs text-gray-400">Station {barber.chairNumber}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 5. Available Salon Services Catalog */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Scissors className="w-5 h-5 text-salon-gold" />
            {t('home.ourServices', 'Featured Salon Services')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {services.map((service) => {
            const localizedName = service.name?.[language] || service.name?.en || service.name;
            return (
              <Card
                key={service._id}
                variant="default"
                className="p-5 space-y-3 border-gray-800 hover:border-salon-gold/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="gold" size="sm">
                    {service.category}
                  </Badge>
                  <span className="text-base font-extrabold text-salon-gold">
                    ₹{service.price}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm line-clamp-1">
                    {localizedName}
                  </h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3.5 h-3.5 text-salon-gold" />
                    {service.duration} {t('home.mins', 'mins')}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
