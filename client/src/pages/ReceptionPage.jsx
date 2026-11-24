import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { UserPlus, Clock, Phone, AlertCircle, Check, X, Bell } from 'lucide-react';

export const ReceptionPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('waiting'); // 'waiting' | 'called' | 'chairs'

  const demoWaiting = [
    {
      id: 'q1',
      token: 'A-101',
      name: 'Ramesh Patel',
      phone: '9876543210',
      services: 'Haircut + Beard',
      duration: 45,
      barber: 'Any Barber',
      waitMinutes: 24,
      isDelayed: false,
    },
    {
      id: 'q2',
      token: 'W-102',
      name: 'Ketan Shah',
      phone: '9822334455',
      services: 'Signature Haircut',
      duration: 30,
      barber: 'Rajesh',
      waitMinutes: 65,
      isDelayed: true, // Over 60 mins!
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Reception Header & Operational Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {t('reception.title', 'Reception Dashboard')}
          </h1>
          <p className="text-xs text-gray-400">Tablet Landscape Operational Command Center</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="green" size="md">Online Queue: OPEN</Badge>
          <Button variant="secondary" size="sm">Toggle Cut-off</Button>
        </div>
      </div>

      {/* Split View: Walk-in intake (Left 35%) & Active Queue Board (Right 65%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Intake Panel */}
        <div className="lg:col-span-4 space-y-4">
          <Card variant="elevated" className="space-y-4">
            <h2 className="text-base font-bold text-salon-gold flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              {t('reception.walkInTitle', 'Quick Walk-in Intake')}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="Walk-in Customer Name"
                  className="w-full px-3 py-2 rounded-lg bg-salon-darker border border-gray-700 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Phone (10 Digits)
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  className="w-full px-3 py-2 rounded-lg bg-salon-darker border border-gray-700 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Select Barber
                </label>
                <select className="w-full px-3 py-2 rounded-lg bg-salon-darker border border-gray-700 text-white text-sm">
                  <option value="any">Any Available Barber</option>
                  <option value="b1">Rajesh Kumar</option>
                  <option value="b2">Amit Patel</option>
                </select>
              </div>

              <Button size="lg" className="w-full mt-2">
                Generate Walk-in Token
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Queue Table & Columns */}
        <div className="lg:col-span-8 space-y-4">
          <Card variant="default" className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-gray-800 pb-3 gap-3">
              <button
                onClick={() => setActiveTab('waiting')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'waiting'
                    ? 'bg-salon-gold text-black'
                    : 'text-gray-400 hover:text-white bg-salon-surface'
                }`}
              >
                {t('reception.waitingTab', 'Waiting Queue')} ({demoWaiting.length})
              </button>
              <button
                onClick={() => setActiveTab('called')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'called'
                    ? 'bg-salon-gold text-black'
                    : 'text-gray-400 hover:text-white bg-salon-surface'
                }`}
              >
                {t('reception.calledTab', 'Paging / Called')} (1)
              </button>
            </div>

            {/* Waiting List */}
            <div className="space-y-3">
              {demoWaiting.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    item.isDelayed
                      ? 'bg-red-950/20 border-red-600/60 shadow-lg shadow-red-950/30'
                      : 'bg-salon-surface border-gray-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-salon-gold">{item.token}</span>
                      <span className="text-sm font-bold text-white">{item.name}</span>
                      {item.isDelayed && (
                        <Badge variant="red" size="sm" pulse>
                          {t('reception.delayAlert', 'DELAY > 60m')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {item.services} • {item.duration} mins • Preference: {item.barber}
                    </p>
                    <p className="text-xs text-salon-textMuted flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Waiting for {item.waitMinutes} mins
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button variant="gold" size="sm" icon={Bell}>
                      {t('reception.callNextBtn', 'Call Next')}
                    </Button>
                    <Button variant="danger" size="sm">
                      {t('reception.markNoShowBtn', 'No-Show')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
