import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { Modal } from '../components/common/Modal';
import {
  Scissors,
  Users,
  Settings,
  BarChart3,
  Plus,
  Edit2,
  Power,
  Clock,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Save,
  Coffee,
  UserPlus,
  TrendingUp,
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://salon-queue-management-1c2g.onrender.com/api/v1';

// API helpers with admin PIN header
function adminFetch(path, method = 'GET', body, pin) {
  return fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': pin || '',
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return data;
  });
}

// ─── PIN Gate Component ───────────────────────────────────────────────────────
const PinGate = ({ onAuthenticated }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError('');
    try {
      // Verify by calling a protected endpoint
      await adminFetch('/admin/analytics/today', 'GET', null, pin);
      onAuthenticated(pin);
    } catch (err) {
      setError(err.status === 401 ? 'Incorrect PIN. Please try again.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card variant="goldBorder" className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-salon-gold/10 border border-salon-gold/30 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8 text-salon-gold" />
          </div>
          <h1 className="text-2xl font-black text-white">Owner Access</h1>
          <p className="text-sm text-gray-400">Enter your admin PIN to access the Owner Settings dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            maxLength={8}
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(''); }}
            placeholder="Enter Owner PIN"
            className="w-full px-4 py-3 rounded-xl bg-salon-surface border border-gray-700 text-white text-center text-xl font-mono tracking-widest placeholder-gray-600 focus:outline-none focus:border-salon-gold"
            autoFocus
          />
          {error && (
            <p className="text-xs text-red-400 font-semibold">{error}</p>
          )}
          <Button type="submit" size="lg" loading={loading} className="w-full" icon={Unlock}>
            Unlock Dashboard
          </Button>
        </form>
      </Card>
    </div>
  );
};

// ─── Services Tab ─────────────────────────────────────────────────────────────
const ServicesTab = ({ adminPin, socket }) => {
  const { language } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form, setForm] = useState({ nameEn: '', nameGu: '', category: 'HAIR', duration: 30, price: 0 });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const CATEGORIES = ['HAIR', 'BEARD', 'FACIAL', 'SPA'];

  const loadServices = useCallback(async () => {
    try {
      const res = await adminFetch('/services/all', 'GET', null, adminPin);
      setServices(res.data || []);
    } catch (err) {
      console.error('[AdminPage] Load services failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, [adminPin]);

  useEffect(() => {
    loadServices();
    if (socket) {
      socket.emit('join:global');
      const handleUpdate = (payload) => {
        if (['SERVICE_ADDED', 'SERVICE_UPDATED', 'SERVICE_TOGGLED'].includes(payload?.action)) {
          loadServices();
        }
      };
      socket.on('queue:updated', handleUpdate);
      return () => socket.off('queue:updated', handleUpdate);
    }
  }, [socket, loadServices]);

  const openAddModal = () => {
    setEditingService(null);
    setForm({ nameEn: '', nameGu: '', category: 'HAIR', duration: 30, price: 0 });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (svc) => {
    setEditingService(svc);
    setForm({
      nameEn: svc.name?.en || '',
      nameGu: svc.name?.gu || '',
      category: svc.category || 'HAIR',
      duration: svc.duration || 30,
      price: svc.price || 0,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nameEn.trim()) { setFormError('English name is required.'); return; }
    if (form.duration < 5 || form.duration > 240) { setFormError('Duration must be 5–240 minutes.'); return; }
    if (form.price < 0) { setFormError('Price cannot be negative.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: { en: form.nameEn.trim(), gu: form.nameGu.trim() || form.nameEn.trim() },
        category: form.category,
        duration: Number(form.duration),
        price: Number(form.price),
      };
      if (editingService) {
        await adminFetch(`/services/${editingService._id}`, 'PUT', payload, adminPin);
      } else {
        await adminFetch('/services', 'POST', payload, adminPin);
      }
      setIsModalOpen(false);
      await loadServices();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (svc) => {
    setActionId(svc._id);
    try {
      await adminFetch(`/services/${svc._id}/toggle`, 'PATCH', null, adminPin);
      await loadServices();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Services Catalog</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage services shown on the customer Join Queue screen. Disabling hides immediately.</p>
        </div>
        <Button size="sm" icon={Plus} onClick={openAddModal}>Add New Service</Button>
      </div>

      <div className="divide-y divide-gray-800 rounded-xl border border-gray-800 overflow-hidden">
        {services.length === 0 && (
          <div className="py-10 text-center text-gray-500 text-sm">No services found.</div>
        )}
        {services.map((svc) => {
          const name = svc.name?.[language] || svc.name?.en || '';
          return (
            <div key={svc._id} className={`p-4 flex items-center justify-between gap-3 transition-colors ${svc.isActive ? 'bg-salon-surface' : 'bg-gray-900/50 opacity-60'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${svc.isActive ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <Badge variant="gray" size="sm">{svc.category}</Badge>
                    <span className="ml-2">{svc.duration} mins</span>
                    <span className="ml-2 text-salon-gold font-bold">₹{svc.price}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={svc.isActive ? 'green' : 'gray'} size="sm">
                  {svc.isActive ? 'Active' : 'Disabled'}
                </Badge>
                <button
                  onClick={() => openEditModal(svc)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-salon-gold hover:bg-salon-gold/10 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggle(svc)}
                  disabled={actionId === svc._id}
                  className={`p-1.5 rounded-lg transition-colors ${svc.isActive ? 'text-red-400 hover:bg-red-900/20' : 'text-emerald-400 hover:bg-emerald-900/20'}`}
                  title={svc.isActive ? 'Disable' : 'Enable'}
                >
                  {actionId === svc._id ? <Spinner size="sm" /> : <Power className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Edit Service' : 'Add New Service'}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button size="sm" icon={Save} loading={saving} onClick={handleSave}>
              {editingService ? 'Save Changes' : 'Create Service'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-xs">{formError}</div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">Service Name (English) *</label>
            <input
              type="text"
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              placeholder="e.g. Signature Haircut"
              className="w-full px-3 py-2 rounded-lg bg-salon-surface border border-gray-700 text-white text-sm focus:outline-none focus:border-salon-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">Service Name (Gujarati)</label>
            <input
              type="text"
              value={form.nameGu}
              onChange={(e) => setForm({ ...form, nameGu: e.target.value })}
              placeholder="e.g. સિગ્નેચર હેરકટ"
              className="w-full px-3 py-2 rounded-lg bg-salon-surface border border-gray-700 text-white text-sm focus:outline-none focus:border-salon-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-salon-surface border border-gray-700 text-white text-sm focus:outline-none focus:border-salon-gold"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={5}
                max={240}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-salon-surface border border-gray-700 text-white text-sm focus:outline-none focus:border-salon-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">Price (₹)</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-salon-surface border border-gray-700 text-white text-sm focus:outline-none focus:border-salon-gold"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ─── Barbers Tab ──────────────────────────────────────────────────────────────
const BarbersTab = ({ adminPin, socket }) => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newChair, setNewChair] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const loadBarbers = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/barbers`).then(r => r.json());
      setBarbers(res.data || []);
    } catch (err) {
      console.error('[AdminPage] Load barbers failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBarbers();
    if (socket) {
      const handleUpdate = () => loadBarbers();
      socket.on('barber:status_changed', handleUpdate);
      return () => socket.off('barber:status_changed', handleUpdate);
    }
  }, [socket, loadBarbers]);

  const handleToggleDuty = async (barberId) => {
    setActionId(barberId);
    try {
      await adminFetch(`/admin/barbers/${barberId}/duty`, 'PATCH', null, adminPin);
      await loadBarbers();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleAddBarber = async () => {
    if (!newName.trim()) { setAddError('Barber name is required.'); return; }
    setAdding(true);
    setAddError('');
    try {
      await adminFetch('/admin/barbers', 'POST', { name: newName.trim(), chairNumber: newChair ? Number(newChair) : undefined }, adminPin);
      setIsAddOpen(false);
      setNewName('');
      setNewChair('');
      await loadBarbers();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Barber Roster & Today's Duty</h2>
          <p className="text-xs text-gray-400 mt-0.5">Toggle barbers on/off duty. Off-duty barbers are hidden from customer barber selection.</p>
        </div>
        <Button size="sm" icon={UserPlus} onClick={() => { setIsAddOpen(true); setAddError(''); setNewName(''); setNewChair(''); }}>
          Add Barber
        </Button>
      </div>

      <div className="space-y-3">
        {barbers.map((barber) => (
          <div key={barber._id} className="p-4 rounded-xl bg-salon-surface border border-gray-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-salon-darker border border-gray-700 flex items-center justify-center font-black text-salon-gold text-sm">
                C{barber.chairNumber}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{barber.name}</p>
                <p className="text-xs text-gray-400">Station {barber.chairNumber} • {barber.slug}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {barber.isOnBreak && (
                <Badge variant="amber" size="sm"><Coffee className="w-3 h-3 mr-1" /> On Break</Badge>
              )}
              <Badge variant={barber.isWorkingToday ? 'green' : 'gray'} size="sm">
                {barber.isWorkingToday ? 'Working Today' : 'Off Duty'}
              </Badge>
              <button
                onClick={() => handleToggleDuty(barber._id)}
                disabled={actionId === barber._id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  barber.isWorkingToday
                    ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-800/50'
                    : 'bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-800/50'
                }`}
              >
                {actionId === barber._id ? <Spinner size="sm" /> : <Power className="w-3.5 h-3.5" />}
                {barber.isWorkingToday ? 'Set Off Duty' : 'Set On Duty'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Barber Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Barber"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button size="sm" icon={UserPlus} loading={adding} onClick={handleAddBarber}>Add Barber</Button>
          </>
        }
      >
        <div className="space-y-4">
          {addError && <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-xs">{addError}</div>}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Ravi Mehta"
              className="w-full px-3 py-2 rounded-lg bg-salon-surface border border-gray-700 text-white text-sm focus:outline-none focus:border-salon-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">Chair / Station Number</label>
            <input
              type="number"
              min={1}
              value={newChair}
              onChange={(e) => setNewChair(e.target.value)}
              placeholder="e.g. 5 (auto-assigned if blank)"
              className="w-full px-3 py-2 rounded-lg bg-salon-surface border border-gray-700 text-white text-sm focus:outline-none focus:border-salon-gold"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ─── Operations Tab ───────────────────────────────────────────────────────────
const OperationsTab = ({ adminPin }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ openingTime: '09:00', closingTime: '21:00', onlineCutoffMinutes: 30, isOnlineQueueOpen: true, salonName: 'Elite Salon' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/admin/settings`)
      .then(r => r.json())
      .then(res => {
        if (res.data) {
          setSettings(res.data);
          setForm({
            openingTime: res.data.openingTime || '09:00',
            closingTime: res.data.closingTime || '21:00',
            onlineCutoffMinutes: res.data.onlineCutoffMinutes || 30,
            isOnlineQueueOpen: res.data.isOnlineQueueOpen ?? true,
            salonName: res.data.salonName || 'Elite Salon',
          });
        }
      })
      .catch(err => console.error('[AdminPage] Load settings failed:', err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await adminFetch('/admin/settings', 'PATCH', {
        openingTime: form.openingTime,
        closingTime: form.closingTime,
        onlineCutoffMinutes: Number(form.onlineCutoffMinutes),
        isOnlineQueueOpen: form.isOnlineQueueOpen,
        salonName: form.salonName,
      }, adminPin);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Salon Operations & Settings</h2>
        <p className="text-xs text-gray-400 mt-0.5">Configure salon hours, online queue, and cut-off times. Changes take effect immediately.</p>
      </div>

      {/* Online Queue Toggle */}
      <Card variant="default" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {form.isOnlineQueueOpen ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-red-400" />}
              Online Queue Status
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {form.isOnlineQueueOpen
                ? 'Customers can join online from the Join Queue page.'
                : 'Online joining is CLOSED. Walk-ins at reception remain available.'}
            </p>
          </div>
          <button
            onClick={() => setForm((prev) => ({ ...prev, isOnlineQueueOpen: !prev.isOnlineQueueOpen }))}
            className={`relative w-14 h-7 rounded-full transition-colors focus:outline-none ${form.isOnlineQueueOpen ? 'bg-emerald-500' : 'bg-gray-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${form.isOnlineQueueOpen ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
        </div>
        <p className="text-xs text-amber-300/70">
          Note: Closing online queue blocks <code className="text-amber-200">/join</code> endpoint (HTTP 403) but walk-in registration remains active.
        </p>
      </Card>

      {/* Salon Hours */}
      <Card variant="default" className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-salon-gold" /> Salon Operating Hours
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">Salon Name</label>
            <input
              type="text"
              value={form.salonName}
              onChange={(e) => setForm({ ...form, salonName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-salon-darker border border-gray-700 text-white text-sm focus:outline-none focus:border-salon-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">Opening Time</label>
            <input
              type="time"
              value={form.openingTime}
              onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-salon-darker border border-gray-700 text-white text-sm focus:outline-none focus:border-salon-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">Closing Time</label>
            <input
              type="time"
              value={form.closingTime}
              onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-salon-darker border border-gray-700 text-white text-sm focus:outline-none focus:border-salon-gold"
            />
          </div>
        </div>
        <div className="max-w-xs">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
            Online Cut-off (mins before closing)
          </label>
          <input
            type="number"
            min={0}
            max={120}
            value={form.onlineCutoffMinutes}
            onChange={(e) => setForm({ ...form, onlineCutoffMinutes: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-salon-darker border border-gray-700 text-white text-sm focus:outline-none focus:border-salon-gold"
          />
          <p className="text-xs text-gray-500 mt-1">Currently stops online joining {form.onlineCutoffMinutes} min before {form.closingTime}.</p>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button icon={Save} loading={saving} onClick={handleSave}>
          Save All Settings
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Settings saved successfully!
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Analytics Tab ────────────────────────────────────────────────────────────
const AnalyticsTab = ({ adminPin }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/admin/analytics/today', 'GET', null, adminPin);
      setAnalytics(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminPin]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (error) return (
    <div className="p-4 rounded-xl bg-red-900/20 border border-red-700 text-red-300 text-sm flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <span>{error}</span>
      <Button size="sm" variant="ghost" onClick={loadAnalytics} icon={RefreshCw}>Retry</Button>
    </div>
  );

  const cards = [
    { label: 'Joined Today', value: analytics?.totalJoined ?? 0, color: 'text-white', bg: 'bg-blue-500/10', icon: Users },
    { label: 'Served Today', value: analytics?.totalServed ?? 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
    { label: 'No-Shows', value: analytics?.totalNoShow ?? 0, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle },
    { label: 'Cancelled', value: analytics?.totalCancelled ?? 0, color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
    { label: 'Still Waiting', value: analytics?.totalWaiting ?? 0, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock },
    { label: 'In Chair Now', value: analytics?.totalInChair ?? 0, color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Scissors },
    { label: 'Avg Wait Time', value: `${analytics?.averageWaitMinutes ?? 0}m`, color: 'text-salon-gold', bg: 'bg-salon-gold/10', icon: Clock },
    { label: 'Est. Revenue', value: `₹${(analytics?.totalRevenue ?? 0).toLocaleString('en-IN')}`, color: 'text-emerald-300', bg: 'bg-emerald-500/10', icon: TrendingUp },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Daily Analytics — {analytics?.dateString}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Live snapshot of today's queue activity. Refreshes on each page load.</p>
        </div>
        <Button size="sm" variant="outline" icon={RefreshCw} onClick={loadAnalytics} loading={loading}>Refresh</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} variant="default" className="text-center space-y-2 py-5">
              <div className={`w-10 h-10 rounded-xl ${card.bg} mx-auto flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{card.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Service completion bar */}
      {analytics && analytics.totalJoined > 0 && (
        <Card variant="default" className="space-y-3">
          <h3 className="text-sm font-bold text-white">Service Completion Rate</h3>
          <div className="space-y-2">
            {[
              { label: 'Served', value: analytics.totalServed, color: 'bg-emerald-500' },
              { label: 'No-Show', value: analytics.totalNoShow, color: 'bg-amber-500' },
              { label: 'Cancelled', value: analytics.totalCancelled, color: 'bg-red-500' },
              { label: 'Waiting', value: analytics.totalWaiting, color: 'bg-blue-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 text-right">{label}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full transition-all`}
                    style={{ width: `${Math.round((value / analytics.totalJoined) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-white w-8">{value}</span>
                <span className="text-xs text-gray-500 w-8">{Math.round((value / analytics.totalJoined) * 100)}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── Main AdminPage ───────────────────────────────────────────────────────────
export const AdminPage = () => {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const [adminPin, setAdminPin] = useState(() => sessionStorage.getItem('salon_admin_pin') || null);
  const [activeTab, setActiveTab] = useState('services');

  const handleAuthenticated = (pin) => {
    sessionStorage.setItem('salon_admin_pin', pin);
    setAdminPin(pin);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('salon_admin_pin');
    setAdminPin(null);
  };

  if (!adminPin) {
    return <PinGate onAuthenticated={handleAuthenticated} />;
  }

  const tabs = [
    { id: 'services', label: t('admin.servicesTab', 'Services Catalog'), icon: Scissors },
    { id: 'barbers', label: t('admin.barbersTab', 'Barber Roster'), icon: Users },
    { id: 'operations', label: t('admin.operationsTab', 'Salon Operations'), icon: Settings },
    { id: 'analytics', label: t('admin.analyticsTab', 'Daily Analytics'), icon: BarChart3 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{t('admin.title', 'Salon Administration')}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Owner Portal • All changes persist to database immediately</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="gold" size="md">🔑 Owner Session</Badge>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors font-semibold flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-salon-gold text-black shadow-gold-glow'
                  : 'text-gray-400 hover:text-white bg-salon-surface/50 hover:bg-salon-surface'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'services' && <ServicesTab adminPin={adminPin} socket={socket} />}
      {activeTab === 'barbers' && <BarbersTab adminPin={adminPin} socket={socket} />}
      {activeTab === 'operations' && <OperationsTab adminPin={adminPin} />}
      {activeTab === 'analytics' && <AnalyticsTab adminPin={adminPin} />}
    </div>
  );
};
