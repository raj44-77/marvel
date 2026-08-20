/* ============================================
   MARVEL — api.js
   API service layer for backend communication
   ============================================ */

const API_BASE_URL = 'http://localhost:8000/api/v1';

const API = {
  // -------- CONFIG --------
  base: API_BASE_URL,
  
  // -------- TOKEN --------
  getToken() {
    return localStorage.getItem('marvel_token');
  },
  
  setToken(token) {
    localStorage.setItem('marvel_token', token);
  },
  
  clearToken() {
    localStorage.removeItem('marvel_token');
  },
  
  // -------- REQUEST --------
  async request(endpoint, options = {}) {
    const token = this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };
    
    try {
      const response = await fetch(`${this.base}${endpoint}`, {
        ...options,
        headers
      });
      
      if (response.status === 401) {
        this.clearToken();
        localStorage.removeItem('marvel_user');
        window.location.href = '/pages/login.html';
        throw new Error('Session expired');
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `Error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error. Is the server running?');
      }
      throw error;
    }
  },
  
  // -------- AUTH --------
  async login(phone) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  },
  
  async signup(userData) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  },
  
  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore errors on logout
    }
    this.clearToken();
    localStorage.removeItem('marvel_user');
  },
  
  // -------- USERS --------
  async getProfile() {
    return await this.request('/users/me');
  },
  
  async updateProfile(data) {
    return await this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  async searchUsers(query) {
    return await this.request(`/users/search?q=${encodeURIComponent(query)}`);
  },
  
  // -------- CONTACTS --------
  async getContacts() {
    return await this.request('/contacts');
  },
  
  async addContact(phone, category = 'General') {
    return await this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify({ phone, category })
    });
  },
  
  async removeContact(contactId) {
    return await this.request(`/contacts/${contactId}`, {
      method: 'DELETE'
    });
  },
  
  async toggleFavorite(contactId) {
    return await this.request(`/contacts/${contactId}/favorite`, {
      method: 'PUT'
    });
  },
  
  // -------- MESSAGES --------
  async getMessages(contactId) {
    return await this.request(`/messages/${contactId}`);
  },
  
  async sendMessage(receiverId, text) {
    return await this.request('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId, text })
    });
  },
  
  async markAsRead(messageId) {
    return await this.request(`/messages/${messageId}/read`, {
      method: 'PUT'
    });
  },
  
  async getUnreadCount() {
    return await this.request('/messages/unread-count');
  }
};

// Export for use in other files
window.API = API;