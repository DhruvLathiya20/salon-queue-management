import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Scissors, Users, Settings, BarChart3, Plus } from 'lucide-react';

export const AdminPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('services'); // 'services' | 'barbers' | 'operations' | 'analytics'

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {t('admin.title', 'Salon Administration')}
          </h1>
          <p className="text-xs text-gray-400">Owner Portal & Configuration Controls</p>
        </div>
        <Badge variant="gold" size="md">PIN Protected Session</Badge>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-2 pb-2">
        {[
          { id: 'services', label: t('admin.servicesTab', 'Services Catalog'), icon: Scissors },
          { id: 'barbers', label: t('admin.barbersTab', 'Barber Roster'), icon: Users },
          { id: 'operations', label: t('admin.operationsTab', 'Salon Operations'), icon: Settings },
          { id: 'analytics', label: t('admin.analyticsTab', 'Daily Analytics'), icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-salon-gold text-black'
                  : 'text-gray-400 hover:text-white bg-salon-surface/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Services Catalog */}
      {activeTab === 'services' && (
        <Card variant="default" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Active Salon Services</h2>
            <Button size="sm" icon={Plus}>Add New Service</Button>
          </div>

          <div className="divide-y divide-gray-800 text-sm">
            {[
              { name: 'Signature Haircut', category: 'HAIR', duration: '30 mins', price: '₹350' },
              { name: 'Beard Grooming & Shape', category: 'BEARD', duration: '20 mins', price: '₹200' },
              { name: 'Head Massage & Wash', category: 'SPA', duration: '15 mins', price: '₹250' },
            ].map((s, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.category} • {s.duration}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-salon-gold">{s.price}</span>
                  <Button variant="secondary" size="sm">Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 2: Barber Roster */}
      {activeTab === 'barbers' && (
        <Card variant="default" className="space-y-4">
          <h2 className="text-lg font-bold text-white">Staff Roster & Today's Attendance</h2>
          <div className="space-y-3">
            {[
              { name: 'Rajesh Kumar', chair: 'Station 1', working: true },
              { name: 'Amit Patel', chair: 'Station 2', working: true },
              { name: 'Vikram Singh', chair: 'Station 3', working: false },
            ].map((b, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-salon-surface border border-gray-700 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-white">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.chair}</p>
                </div>
                <Badge variant={b.working ? 'green' : 'gray'} size="sm">
                  {b.working ? 'Working Today' : 'Off Duty'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 3: Operations */}
      {activeTab === 'operations' && (
        <Card variant="default" className="space-y-4">
          <h2 className="text-lg font-bold text-white">Operating Hours & Online Cut-off</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-salon-surface border border-gray-700">
              <p className="text-xs text-gray-400 font-semibold uppercase">Salon Hours</p>
              <p className="text-lg font-bold text-white mt-1">09:00 AM – 09:00 PM</p>
            </div>
            <div className="p-4 rounded-xl bg-salon-surface border border-gray-700">
              <p className="text-xs text-gray-400 font-semibold uppercase">Online Queue Cut-off</p>
              <p className="text-lg font-bold text-salon-gold mt-1">30 mins before closing</p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card variant="default" className="text-center">
            <p className="text-3xl font-black text-white">28</p>
            <p className="text-xs text-gray-400 uppercase mt-1">Served Today</p>
          </Card>
          <Card variant="default" className="text-center">
            <p className="text-3xl font-black text-salon-gold">14m</p>
            <p className="text-xs text-gray-400 uppercase mt-1">Avg Wait Time</p>
          </Card>
          <Card variant="default" className="text-center">
            <p className="text-3xl font-black text-white">2</p>
            <p className="text-xs text-gray-400 uppercase mt-1">No-Shows</p>
          </Card>
          <Card variant="default" className="text-center">
            <p className="text-3xl font-black text-emerald-400">₹9,800</p>
            <p className="text-xs text-gray-400 uppercase mt-1">Estimated Revenue</p>
          </Card>
        </div>
      )}
    </div>
  );
};
