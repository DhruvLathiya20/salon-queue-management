import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Clock, Scissors, UserCheck, AlertTriangle, Bell, CheckCircle } from 'lucide-react';

export const MyStatusPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [status, setStatus] = useState('WAITING'); // 'WAITING' | 'CALLED' | 'IN_CHAIR' | 'DONE'

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-wider text-salon-gold font-bold">
          {t('status.title', 'Live Queue Tracker')}
        </p>
        <h1 className="text-2xl font-extrabold text-white">
          Token: <span className="text-salon-gold">{id || 'A-101'}</span>
        </h1>
      </div>

      {/* Main Status Progression Card */}
      <Card
        variant={status === 'CALLED' ? 'goldBorder' : 'default'}
        className="text-center space-y-6 relative overflow-hidden"
      >
        {status === 'CALLED' && (
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-sm font-bold animate-pulse flex items-center justify-center gap-2">
            <Bell className="w-5 h-5 text-salon-gold" />
            {t('status.calledAlert', 'Please proceed to your assigned chair now!')}
          </div>
        )}

        <div className="space-y-2">
          <Badge
            variant={
              status === 'WAITING'
                ? 'blue'
                : status === 'CALLED'
                ? 'amber'
                : status === 'IN_CHAIR'
                ? 'green'
                : 'gray'
            }
            size="md"
            pulse={status === 'CALLED'}
          >
            {status === 'WAITING'
              ? t('status.stateWaiting', 'Waiting in Line')
              : status === 'CALLED'
              ? t('status.stateCalled', "It's Your Turn! Please Proceed")
              : status === 'IN_CHAIR'
              ? t('status.stateInChair', 'Service in Progress')
              : t('status.stateDone', 'Service Completed')}
          </Badge>

          <div className="text-6xl font-black text-salon-gold tracking-tight py-2">
            {id || 'A-101'}
          </div>

          <p className="text-sm text-salon-textSecondary">
            Ramesh Patel • Signature Haircut & Beard Trim
          </p>
        </div>

        {/* Dynamic Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-salon-surface border border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              {t('status.positionLabel', 'Position in Line')}
            </p>
            <p className="text-2xl font-black text-white mt-1">#2</p>
          </div>

          <div className="p-4 rounded-xl bg-salon-surface border border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              {t('status.waitLabel', 'Estimated Wait')}
            </p>
            <p className="text-2xl font-black text-salon-gold mt-1">~12 mins</p>
          </div>
        </div>

        {/* Assigned Stylist */}
        <div className="p-3 rounded-xl bg-salon-surface/60 border border-gray-700/80 text-left flex items-center justify-between text-xs">
          <span className="text-gray-400">Stylist Preference:</span>
          <span className="font-semibold text-white">Any Available Barber (Fastest)</span>
        </div>

        {/* Cancellation Action */}
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

      {/* Simulator Switcher for preview */}
      <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-center space-y-2">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider">Preview Status States</p>
        <div className="flex justify-center gap-2">
          {['WAITING', 'CALLED', 'IN_CHAIR', 'DONE'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-2 py-1 text-xs rounded font-medium ${
                status === s ? 'bg-salon-gold text-black' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirm Cancellation"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsCancelModalOpen(false)}>
              Keep My Spot
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setIsCancelModalOpen(false);
                navigate('/');
              }}
            >
              Yes, Cancel Token
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Are you sure you want to cancel your queue spot? You will lose your current position in
          line and must rejoin at the end if you change your mind.
        </p>
      </Modal>
    </div>
  );
};
