import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { Modal } from '../components/common/Modal';
import {
  User,
  Phone,
  Scissors,
  Check,
  Clock,
  Sparkles,
  AlertTriangle,
  Coffee,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

export const JoinQueuePage = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState('any');

  // UI & Network States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [salonStatus, setSalonStatus] = useState(null);

  // Validation & Error States
  const [errors, setErrors] = useState({});
  const [activeTicketConflict, setActiveTicketConflict] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [servicesRes, barbersRes, queueRes] = await Promise.all([
          api.getServices(),
          api.getBarbers(),
          api.getLiveQueue(),
        ]);

        const activeServices = servicesRes.data || [];
        setServices(activeServices);
        // Pre-select first service if available
        if (activeServices.length > 0) {
          setSelectedServices([String(activeServices[0]._id)]);
        }

        setBarbers(barbersRes.data || []);
        if (queueRes.data?.salonStatus) {
          setSalonStatus(queueRes.data.salonStatus);
        }
      } catch (err) {
        console.error('[JoinQueuePage] Error loading form data:', err);
        setGeneralError(err.message || 'Unable to load salon services');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Live calculation of selected service durations and prices
  const selectedServiceObjects = services.filter((s) =>
    selectedServices.includes(String(s._id))
  );

  const totalDuration = selectedServiceObjects.reduce(
    (acc, curr) => acc + (curr.duration || 0),
    0
  );

  const totalPrice = selectedServiceObjects.reduce(
    (acc, curr) => acc + (curr.price || 0),
    0
  );

  // Toggle service selection with max 3 rule
  const handleToggleService = (serviceId) => {
    const idStr = String(serviceId);
    if (selectedServices.includes(idStr)) {
      setSelectedServices(selectedServices.filter((id) => id !== idStr));
      if (errors.services) {
        setErrors((prev) => ({ ...prev, services: null }));
      }
    } else {
      if (selectedServices.length >= 3) {
        setErrors((prev) => ({
          ...prev,
          services: t('join.servicesMaxNotice', 'Maximum 3 services can be selected per session.'),
        }));
        return;
      }
      setSelectedServices([...selectedServices, idStr]);
      setErrors((prev) => ({ ...prev, services: null }));
    }
  };

  // Field validation
  const validateForm = () => {
    const newErrors = {};

    if (!customerName || customerName.trim().length < 2 || customerName.trim().length > 50) {
      newErrors.name = t('join.nameError', 'Name must be between 2 and 50 characters.');
    }

    const cleanedPhone = customerPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      newErrors.phone = t('join.phoneError', 'Please enter a valid 10-digit Indian mobile number.');
    }

    if (selectedServices.length === 0) {
      newErrors.services = t('join.servicesMinError', 'Please select at least 1 service to proceed.');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setGeneralError(null);

      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.replace(/\D/g, ''),
        serviceIds: selectedServices,
        preferredBarberId: selectedBarber === 'any' ? null : selectedBarber,
        entryType: 'ONLINE',
      };

      const result = await api.joinQueue(payload);
      if (result.success && result.data) {
        // Successfully joined queue -> Navigate to status tracker
        const tokenNumber = result.data.tokenNumber || result.data._id;
        navigate(`/status/${encodeURIComponent(tokenNumber)}`);
      }
    } catch (err) {
      console.error('[JoinQueuePage] Submission error:', err);
      if (err.status === 409 && err.data?.existingTicket) {
        // User already in queue
        setActiveTicketConflict(err.data.existingTicket);
      } else {
        setGeneralError(err.message || 'Failed to submit queue registration');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBarberObj = barbers.find((b) => String(b._id) === selectedBarber);
  const isSelectedBarberOnBreak = selectedBarberObj?.isOnBreak;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-400">{t('common.loading', 'Loading salon services...')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Back button and Header */}
      <div className="space-y-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-salon-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back', 'Back to Home')}</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {t('join.title', 'Join Virtual Queue')}
        </h1>
        <p className="text-sm text-salon-textSecondary">
          {t('join.subtitle', 'Enter your contact info, select up to 3 services, and pick your preferred stylist.')}
        </p>
      </div>

      {/* Salon cut-off alert if online queue closed */}
      {salonStatus && !salonStatus.isOnlineIntakeAllowed && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-salon-gold mt-0.5" />
          <div>
            <p className="font-bold">Online Queue Notice</p>
            <p className="text-xs text-amber-200/90 mt-0.5">
              {t('join.closedNotice', 'Online queue joining is currently closed for today. Please visit the reception for walk-in availability.')}
            </p>
          </div>
        </div>
      )}

      {/* General error message banner */}
      {generalError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Customer Contact Details */}
        <Card variant="default" className="space-y-4">
          <h2 className="text-base font-bold text-salon-gold flex items-center gap-2">
            <User className="w-4 h-4" /> 1. Customer Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                {t('join.nameLabel', 'Your Full Name')} *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
                placeholder={t('join.namePlaceholder', 'e.g. Rahul Sharma')}
                className={`w-full px-4 py-3 rounded-xl bg-salon-surface border text-white placeholder-gray-500 text-sm focus:outline-none transition-colors ${
                  errors.name
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-gray-700 focus:border-salon-gold'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1 font-medium">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                {t('join.phoneLabel', 'Mobile Number (10 Digits)')} *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-sm text-gray-400 font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setCustomerPhone(cleaned);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                  }}
                  placeholder={t('join.phonePlaceholder', 'e.g. 9876543210')}
                  className={`w-full pl-14 pr-4 py-3 rounded-xl bg-salon-surface border text-white placeholder-gray-500 text-sm focus:outline-none transition-colors ${
                    errors.phone
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-gray-700 focus:border-salon-gold'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-400 mt-1 font-medium">{errors.phone}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Step 2: Service Selection (Max 3) */}
        <Card variant="default" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-salon-gold flex items-center gap-2">
              <Scissors className="w-4 h-4" /> 2. {t('join.servicesTitle', 'Select Services (Max 3)')}
            </h2>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                selectedServices.length === 3
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              {selectedServices.length}/3 selected
            </span>
          </div>

          {errors.services && (
            <p className="text-xs text-amber-400 font-semibold">{errors.services}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((service) => {
              const idStr = String(service._id);
              const isSelected = selectedServices.includes(idStr);
              const isDisabled = !isSelected && selectedServices.length >= 3;
              const localizedName = service.name?.[language] || service.name?.en || service.name;

              return (
                <div
                  key={service._id}
                  onClick={() => !isDisabled && handleToggleService(service._id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                    isSelected
                      ? 'border-salon-gold bg-salon-gold/10 shadow-gold-glow/40'
                      : isDisabled
                      ? 'border-gray-800 opacity-40 cursor-not-allowed bg-salon-surface/30'
                      : 'border-gray-700 bg-salon-surface hover:border-gray-500'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-white text-sm line-clamp-1">
                      {localizedName}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-salon-gold" />
                        {service.duration} {t('home.mins', 'mins')}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-salon-gold">₹{service.price}</span>
                    </p>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-salon-gold border-salon-gold text-black'
                        : 'border-gray-600 bg-gray-800'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Step 3: Preferred Barber Selection */}
        <Card variant="default" className="space-y-4">
          <h2 className="text-base font-bold text-salon-gold flex items-center gap-2">
            <User className="w-4 h-4" /> 3. {t('join.barberTitle', 'Select Stylist / Barber')}
          </h2>

          <div className="space-y-2">
            {/* Any Available Barber Option */}
            <label
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                selectedBarber === 'any'
                  ? 'border-salon-gold bg-salon-gold/10'
                  : 'border-gray-700 bg-salon-surface hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="preferredBarber"
                  checked={selectedBarber === 'any'}
                  onChange={() => setSelectedBarber('any')}
                  className="accent-salon-gold w-4 h-4"
                />
                <div>
                  <span className="text-sm font-semibold text-white">
                    {t('join.anyBarber', 'Any Available Barber (Fastest Turnaround)')}
                  </span>
                  <p className="text-xs text-gray-400">First available chair assigns automatically</p>
                </div>
              </div>
              <Badge variant="gold" size="sm">
                Recommended
              </Badge>
            </label>

            {/* Specific Working Barbers */}
            {barbers
              .filter((b) => b.isWorkingToday)
              .map((barber) => {
                const isSelected = selectedBarber === String(barber._id);
                return (
                  <label
                    key={barber._id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'border-salon-gold bg-salon-gold/10'
                        : 'border-gray-700 bg-salon-surface hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="preferredBarber"
                        checked={isSelected}
                        onChange={() => setSelectedBarber(String(barber._id))}
                        className="accent-salon-gold w-4 h-4"
                      />
                      <div>
                        <span className="text-sm font-semibold text-white">{barber.name}</span>
                        <p className="text-xs text-gray-400">Station {barber.chairNumber}</p>
                      </div>
                    </div>

                    <div>
                      {barber.isOnBreak ? (
                        <Badge variant="amber" size="sm">
                          <Coffee className="w-3 h-3 mr-1" />
                          {t('join.onBreak', 'On Break')}
                        </Badge>
                      ) : (
                        <Badge variant="green" size="sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {t('join.available', 'Available')}
                        </Badge>
                      )}
                    </div>
                  </label>
                );
              })}
          </div>

          {/* Warning banner when selecting barber on break */}
          {isSelectedBarberOnBreak && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
              <Coffee className="w-4 h-4 text-salon-gold shrink-0" />
              <span>
                {t(
                  'join.breakWarning',
                  'Notice: This stylist is currently on break. Your wait time may be longer.'
                )}
              </span>
            </div>
          )}
        </Card>

        {/* Step 4: Live Summary & Confirm Button (Sticky Bar) */}
        <Card variant="goldBorder" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
            <div>
              <p className="text-xs uppercase tracking-wider text-salon-gold font-bold">
                {t('join.summaryTitle', 'Live Queue Summary')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedServices.length}{' '}
                {t('join.selectedServices', 'services selected')} •{' '}
                {selectedBarber === 'any'
                  ? t('join.anyBarber', 'Any Available Barber')
                  : selectedBarberObj?.name}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Total Estimate
              </p>
              <p className="text-xl sm:text-2xl font-black text-white">
                <span className="text-salon-gold">~{totalDuration} mins</span> • ₹{totalPrice}
              </p>
            </div>
          </div>

          <Button
            type="submit"
            size="xl"
            loading={submitting}
            icon={Sparkles}
            className="w-full"
          >
            {submitting
              ? t('join.submitting', 'Reserving your spot...')
              : t('join.confirmBtn', 'Confirm & Get Queue Token')}
          </Button>
        </Card>
      </form>

      {/* Duplicate Active Phone Conflict Modal (409) */}
      <Modal
        isOpen={Boolean(activeTicketConflict)}
        onClose={() => setActiveTicketConflict(null)}
        title="Active Queue Ticket Found"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTicketConflict(null)}
            >
              {t('common.close', 'Close')}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const token = activeTicketConflict?.tokenNumber || activeTicketConflict?._id;
                setActiveTicketConflict(null);
                navigate(`/status/${encodeURIComponent(token)}`);
              }}
            >
              View My Live Status
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm">
            You already have an active ticket in the queue for this phone number:
          </p>
          <div className="p-4 rounded-xl bg-salon-darker border border-salon-gold/50 text-center space-y-1">
            <p className="text-xs uppercase tracking-wider text-gray-400">Active Token</p>
            <p className="text-3xl font-black text-salon-gold">
              {activeTicketConflict?.tokenNumber}
            </p>
            <p className="text-xs text-gray-300">
              Status: <span className="font-bold text-white">{activeTicketConflict?.status}</span>
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Per salon rules, only one active ticket is permitted per phone number. You can track your
            turn on the live status screen.
          </p>
        </div>
      </Modal>
    </div>
  );
};
