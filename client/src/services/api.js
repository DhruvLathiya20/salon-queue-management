const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = {
  async getLiveQueue() {
    const res = await fetch(`${BASE_URL}/queue/live`);
    if (!res.ok) throw new Error('Failed to fetch live queue data');
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

  async getTicketStatus(id) {
    const res = await fetch(`${BASE_URL}/queue/status/${id}`);
    if (!res.ok) throw new Error('Failed to fetch ticket status');
    return res.json();
  },
};
