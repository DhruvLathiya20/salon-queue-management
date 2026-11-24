const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = {
  async getLiveQueue() {
    const res = await fetch(`${BASE_URL}/queue/live`);
    if (!res.ok) throw new Error('Failed to fetch live queue data');
    return res.json();
  },

  async getReceptionBoard() {
    const res = await fetch(`${BASE_URL}/queue/reception`);
    if (!res.ok) throw new Error('Failed to fetch reception board');
    return res.json();
  },

  async getServices() {
    const res = await fetch(`${BASE_URL}/services`);
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },

  async getBarbers() {
    const res = await fetch(`${BASE_URL}/barbers`);
    if (!res.ok) throw new Error('Failed to fetch barbers');
    return res.json();
  },

  async joinQueue(payload) {
    const res = await fetch(`${BASE_URL}/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || 'Failed to join queue');
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  },

  async addWalkIn(payload) {
    const res = await fetch(`${BASE_URL}/queue/walkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || 'Failed to register walk-in');
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  },

  async getTicketStatus(id) {
    const res = await fetch(`${BASE_URL}/queue/status/${id}`);
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || 'Failed to fetch ticket status');
      error.status = res.status;
      throw error;
    }
    return data;
  },

  async cancelTicket(id) {
    const res = await fetch(`${BASE_URL}/queue/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || 'Failed to cancel ticket');
      error.status = res.status;
      throw error;
    }
    return data;
  },

  async callNextForBarber(barberId) {
    const res = await fetch(`${BASE_URL}/barbers/${barberId}/call-next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || 'Failed to call next customer');
      error.status = res.status;
      throw error;
    }
    return data;
  },

  async toggleBarberBreak(barberId) {
    const res = await fetch(`${BASE_URL}/barbers/${barberId}/break`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || 'Failed to toggle break status');
      error.status = res.status;
      throw error;
    }
    return data;
  },

  async markNoShow(id) {
    const res = await fetch(`${BASE_URL}/queue/${id}/no-show`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || 'Failed to mark no-show');
      error.status = res.status;
      throw error;
    }
    return data;
  },

  async startService(id) {
    const res = await fetch(`${BASE_URL}/queue/${id}/start`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async completeService(id) {
    const res = await fetch(`${BASE_URL}/queue/${id}/done`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async getBarberStation(slugOrId) {
    const res = await fetch(`${BASE_URL}/barbers/station/${slugOrId}`);
    if (!res.ok) throw new Error('Failed to fetch barber station');
    return res.json();
  },

  async getDisplayData() {
    const res = await fetch(`${BASE_URL}/queue/display`);
    if (!res.ok) throw new Error('Failed to fetch display data');
    return res.json();
  },

  async updateSalonSettings(payload) {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
