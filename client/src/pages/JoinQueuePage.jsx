import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Check, Clock, User, Phone, Scissors } from 'lucide-react';

export const JoinQueuePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState(['s1']);
  const [selectedBarber, setSelectedBarber] = useState('any');

  const demoServices = [
    { id: 's1', name: 'Signature Haircut', duration: 30, price: 350, category: 'HAIR' },
    { id: 's2', name: 'Beard Grooming & Shape', duration: 20, price: 200, category: 'BEARD' },
    { id: 's3', name: 'Relaxing Head Massage', duration: 15, price: 250, category: 'SPA' },
    { id: 's4', name: 'Charcoal Face Treatment', duration: 30, price: 450, category: 'FACIAL' },
  ];

  const demoBarbers = [
    { id: 'any', name: t('join.anyBarber', 'Any Available Barber (Fastest)'), status: 'available' },
    { id: 'b1', name: 'Rajesh Kumar', status: 'available' },
    { id: 'b2', name: 'Amit Patel', status: 'on_break' },
    { id: 'b3', name: 'Vikram Singh', status: 'available' },
  ];

  const toggleService = (id) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter((s) => s !== id));
    } else {
      if (selectedServices.length >= 3) return;
      setSelectedServices([...selectedServices, id]);
    }
  };

  const totalMinutes = demoServices
    .filter((s) => selectedServices.includes(s.id))
    .reduce((acc, curr) => acc + curr.duration, 0);

  const totalPrice = demoServices
    .filter((s) => selectedServices.includes(s.id))
    .reduce((acc, curr) => acc + curr.price, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder transition to status screen
    navigate('/status/A-101');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {t('join.title', 'Join Virtual Queue')}
        </h1>
        <p className="text-sm text-salon-textSecondary mt-1">
          {t('join.subtitle', 'Please provide your details, choose up to 3 services, and pick your preferred barber.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Customer Contact Info */}
        <Card variant="default" className="space-y-4">
          <h2 className="text-base font-bold text-salon-gold flex items-center gap-2">
            <User className="w-4 h-4" /> 1. Customer Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                {t('join.nameLabel', 'Your Full Name')}
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('join.namePlaceholder', 'Enter your name')}
                className="w-full px-4 py-3 rounded-xl bg-salon-surface border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-salon-gold text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                {t('join.phoneLabel', 'Mobile Number (10 Digits)')}
              </label>
              <input
                type="tel"
                required
                pattern="^[6-9]\d{9}$"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder={t('join.phonePlaceholder', 'e.g. 9876543210')}
                className="w-full px-4 py-3 rounded-xl bg-salon-surface border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-salon-gold text-sm"
              />
            </div>
          </div>
        </Card>

        {/* Step 2: Select Services */}
        <Card variant="default" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-salon-gold flex items-center gap-2">
              <Scissors className="w-4 h-4" /> 2. {t('join.servicesTitle', 'Select Services (Max 3)')}
            </h2>
            <span className="text-xs text-gray-400">
              {selectedServices.length}/3 selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {demoServices.map((service) => {
              const isSelected = selectedServices.includes(service.id);
              const isDisabled = !isSelected && selectedServices.length >= 3;
              return (
                <div
                  key={service.id}
                  onClick={() => !isDisabled && toggleService(service.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-salon-gold bg-salon-gold/10'
                      : isDisabled
                      ? 'border-gray-800 opacity-40 cursor-not-allowed bg-salon-surface/30'
                      : 'border-gray-700 bg-salon-surface hover:border-gray-500'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-white text-sm">{service.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {service.duration} mins • ₹{service.price}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                      isSelected
                        ? 'bg-salon-gold border-salon-gold text-black'
                        : 'border-gray-600'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Step 3: Select Barber */}
        <Card variant="default" className="space-y-4">
          <h2 className="text-base font-bold text-salon-gold flex items-center gap-2">
            <User className="w-4 h-4" /> 3. {t('join.barberTitle', 'Select Stylist / Barber')}
          </h2>

          <div className="space-y-2">
            {demoBarbers.map((barber) => (
              <label
                key={barber.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedBarber === barber.id
                    ? 'border-salon-gold bg-salon-gold/10'
                    : 'border-gray-700 bg-salon-surface hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="barber"
                    checked={selectedBarber === barber.id}
                    onChange={() => setSelectedBarber(barber.id)}
                    className="accent-salon-gold"
                  />
                  <span className="text-sm font-semibold text-white">{barber.name}</span>
                </div>
                {barber.status === 'on_break' && (
                  <Badge variant="amber" size="sm">
                    {t('join.onBreak', 'On Break')}
                  </Badge>
                )}
              </label>
            ))}
          </div>
        </Card>

        {/* Sticky Summary & Submit */}
        <Card variant="goldBorder" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-salon-gold font-bold">
              {t('join.summaryTitle', 'Queue Summary')}
            </p>
            <p className="text-xl font-extrabold text-white">
              {totalMinutes} {t('home.mins', 'mins')} • ₹{totalPrice}
            </p>
          </div>
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {t('join.confirmBtn', 'Confirm & Get Queue Token')}
          </Button>
        </Card>
      </form>
    </div>
  );
};
