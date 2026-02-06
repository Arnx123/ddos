const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.post('/api/auth/login', { email, password });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.get('/api/auth/me');
  }

  // Users
  async getUsers() {
    return this.get('/api/users');
  }

  async createUser(user: any) {
    return this.post('/api/users', user);
  }

  async updateUser(id: string, user: any) {
    return this.put(`/api/users/${id}`, user);
  }

  async deleteUser(id: string) {
    return this.delete(`/api/users/${id}`);
  }

  async assignIpToUser(userId: string, ipId: string) {
    return this.post(`/api/users/${userId}/ips/${ipId}`, {});
  }

  async removeIpFromUser(userId: string, ipId: string) {
    return this.delete(`/api/users/${userId}/ips/${ipId}`);
  }

  // IP Addresses
  async getIps() {
    return this.get('/api/ips');
  }

  async getIp(id: string) {
    return this.get(`/api/ips/${id}`);
  }

  async createIp(ip: any) {
    return this.post('/api/ips', ip);
  }

  async updateIp(id: string, ip: any) {
    return this.put(`/api/ips/${id}`, ip);
  }

  async deleteIp(id: string) {
    return this.delete(`/api/ips/${id}`);
  }

  // Attacks
  async getAttacks(ipId: string, params?: any) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/attacks/${ipId}${query ? `?${query}` : ''}`);
  }

  async getAttackStats(ipId: string, days: number = 7) {
    return this.get(`/api/attacks/${ipId}/stats?days=${days}`);
  }

  // Geo-blocks
  async getGeoBlocks(ipId: string) {
    return this.get(`/api/geoblocks/${ipId}`);
  }

  async createGeoBlock(data: any) {
    return this.post('/api/geoblocks', data);
  }

  async updateGeoBlock(id: string, data: any) {
    return this.put(`/api/geoblocks/${id}`, data);
  }

  async deleteGeoBlock(id: string) {
    return this.delete(`/api/geoblocks/${id}`);
  }

  // Firewall Rules
  async getFirewallRules(ipId: string) {
    return this.get(`/api/firewall/${ipId}`);
  }

  async createFirewallRule(data: any) {
    return this.post('/api/firewall', data);
  }

  async updateFirewallRule(id: string, data: any) {
    return this.put(`/api/firewall/${id}`, data);
  }

  async deleteFirewallRule(id: string) {
    return this.delete(`/api/firewall/${id}`);
  }
}

export const api = new ApiClient();
