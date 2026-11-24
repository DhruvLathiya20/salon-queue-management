import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { UserCheck, Coffee, CheckCircle, Bell, Clock } from 'lucide-react';

export const BarberPage = () => {
  const { name } = useParams();
  const { t } = useTranslation();

  const [isOnBreak, setIsOnBreak] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState({
    token: 'A-102',
    name: 'Sanjay Verma',
    services: 'Signature Haircut + Beard Shape',
    duration: 50,
    elapsedMinutes: 20,
    status: 'IN_CHAIR', // 'NONE' | 'CALLED' | 'IN_CHAIR'
  });

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Barber Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-black text-white capitalize">
            {name || 'Rajesh'} - Station 1
          </h1>
          <p className="text-xs text-gray-400">Barber Station Mobile Control</p>
        </div>

        <button
          onClick={() => setIsOnBreak(!isOnBreak)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
            isOnBreak
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          {isOnBreak ? t('barber.onBreak', 'On Break') : t('barber.available', 'Available')}
        </button>
      </div>

      {/* Main Chair Active Stage */}
      {activeCustomer ? (
        <Card variant="goldBorder" className="space-y-6 text-center">
          <Badge variant="green" size="md">
            Customer In Chair
          </Badge>

          <div>
            <div className="text-5xl font-black text-salon-gold tracking-tight">
              {activeCustomer.token}
            </div>
            <p className="text-lg font-bold text-white mt-1">{activeCustomer.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{activeCustomer.services}</p>
          </div>

          {/* Stopwatch / Progress */}
          <div className="p-4 rounded-xl bg-salon-surface border border-gray-700 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-gray-400">
              <span>Elapsed</span>
              <span>Total Duration: {activeCustomer.duration}m</span>
            </div>
            <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-salon-gold h-full rounded-full transition-all"
                style={{ width: `${(activeCustomer.elapsedMinutes / activeCustomer.duration) * 100}%` }}
              />
            </div>
            <p className="text-xl font-black text-salon-gold">
              {activeCustomer.elapsedMinutes} / {activeCustomer.duration} mins
            </p>
          </div>

          <Button
            size="xl"
            icon={CheckCircle}
            className="w-full"
            onClick={() => setActiveCustomer(null)}
          >
            {t('barber.completeService', 'Complete Service (Done)')}
          </Button>
        </Card>
      ) : (
        <Card variant="default" className="text-center space-y-6 py-10">
          <p className="text-sm text-gray-400">
            {t('barber.noActive', 'No customer currently in chair.')}
          </p>
          <Button
            size="xl"
            icon={Bell}
            className="w-full"
            onClick={() =>
              setActiveCustomer({
                token: 'W-103',
                name: 'Anil Desai',
                services: 'Haircut',
                duration: 30,
                elapsedMinutes: 0,
                status: 'IN_CHAIR',
              })
            }
          >
            {t('barber.callNext', 'Call Next Customer')}
          </Button>
        </Card>
      )}
    </div>
  );
};
