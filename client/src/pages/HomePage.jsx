import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Clock, Users, UserCheck, Sparkles, ArrowRight, Search } from 'lucide-react';

export const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* Status Hero */}
      <div className="text-center space-y-4">
        <Badge variant="green" size="md" pulse>
          {t('home.badgeOpen', 'Salon Open & Accepting Queue')}
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          {t('home.title', 'Skip the Wait, Save Your Time')}
        </h1>
        <p className="max-w-2xl mx-auto text-salon-textSecondary text-base sm:text-lg">
          {t('home.subtitle', 'Join our live digital queue from anywhere, pick your favorite stylist and services, and get notified when your chair is ready.')}
        </p>
      </div>

      {/* Live Snapshot Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card variant="default" className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-white">4</p>
          <p className="text-xs uppercase tracking-wider text-salon-textMuted font-medium">
            {t('home.waitingCount', 'Currently Waiting')}
          </p>
        </Card>

        <Card variant="default" className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-white">3</p>
          <p className="text-xs uppercase tracking-wider text-salon-textMuted font-medium">
            {t('home.workingBarbers', 'Stylists on Duty')}
          </p>
        </Card>

        <Card variant="default" className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-salon-gold/10 text-salon-gold mx-auto flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-salon-gold">~15 {t('home.mins', 'mins')}</p>
          <p className="text-xs uppercase tracking-wider text-salon-textMuted font-medium">
            {t('home.estWait', 'Avg Wait Time')}
          </p>
        </Card>
      </div>

      {/* Main Action CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Button
          size="xl"
          onClick={() => navigate('/join')}
          icon={Sparkles}
          className="w-full sm:w-auto"
        >
          {t('home.joinBtn', 'Join Live Queue')}
        </Button>

        <Button
          variant="outline"
          size="xl"
          onClick={() => navigate('/status/demo')}
          icon={Search}
          className="w-full sm:w-auto"
        >
          {t('home.trackBtn', 'Track Existing Token')}
        </Button>
      </div>

      {/* Quick Navigation Cards for Testing / Showcase */}
      <div className="pt-8 border-t border-gray-800">
        <p className="text-xs uppercase tracking-wider text-salon-gold text-center font-bold mb-4">
          Quick Access Links (All 7 System Interfaces)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <button
            onClick={() => navigate('/join')}
            className="p-3 rounded-xl bg-salon-surface/60 hover:bg-salon-surface text-left border border-gray-700 hover:border-salon-gold/50 transition-colors"
          >
            <p className="font-semibold text-white">/join</p>
            <p className="text-xs text-gray-400">Join Wizard</p>
          </button>
          <button
            onClick={() => navigate('/status/A-101')}
            className="p-3 rounded-xl bg-salon-surface/60 hover:bg-salon-surface text-left border border-gray-700 hover:border-salon-gold/50 transition-colors"
          >
            <p className="font-semibold text-white">/status/:id</p>
            <p className="text-xs text-gray-400">Customer Tracker</p>
          </button>
          <button
            onClick={() => navigate('/reception')}
            className="p-3 rounded-xl bg-salon-surface/60 hover:bg-salon-surface text-left border border-gray-700 hover:border-salon-gold/50 transition-colors"
          >
            <p className="font-semibold text-white">/reception</p>
            <p className="text-xs text-gray-400">Tablet Dashboard</p>
          </button>
          <button
            onClick={() => navigate('/barber/rajesh')}
            className="p-3 rounded-xl bg-salon-surface/60 hover:bg-salon-surface text-left border border-gray-700 hover:border-salon-gold/50 transition-colors"
          >
            <p className="font-semibold text-white">/barber/:name</p>
            <p className="text-xs text-gray-400">Barber Station</p>
          </button>
          <button
            onClick={() => navigate('/display')}
            className="p-3 rounded-xl bg-salon-surface/60 hover:bg-salon-surface text-left border border-gray-700 hover:border-salon-gold/50 transition-colors"
          >
            <p className="font-semibold text-white">/display</p>
            <p className="text-xs text-gray-400">TV Screen Display</p>
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="p-3 rounded-xl bg-salon-surface/60 hover:bg-salon-surface text-left border border-gray-700 hover:border-salon-gold/50 transition-colors"
          >
            <p className="font-semibold text-white">/admin</p>
            <p className="text-xs text-gray-400">Owner Portal</p>
          </button>
        </div>
      </div>
    </div>
  );
};
