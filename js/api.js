/**
 * ResourceX – API Service Layer
 * Provides a unified data-access interface that works in both
 * demo mode (CONFIG.DEMO_MODE = true) and real backend mode.
 *
 * DEMO MODE:  resolves with data from DEMO_DATA after a short delay.
 * BACKEND MODE: makes real fetch() calls to CONFIG.API_BASE_URL.
 *
 * Usage:
 *   const resources = await API.resources.list({ category: 'books' });
 *   const resource  = await API.resources.get('r001');
 */

const API = (() => {
  /* ── Internal HTTP helpers ── */
  async function request(method, endpoint, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    // Attach JWT if stored
    const token = sessionStorage.getItem('rx_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      const error = new Error(err.message || `HTTP ${res.status}`);
      error.status = res.status;
      throw error;
    }
    return res.json();
  }

  const http = {
    get:    (ep)          => request('GET',    ep),
    post:   (ep, body)    => request('POST',   ep, body),
    put:    (ep, body)    => request('PUT',    ep, body),
    patch:  (ep, body)    => request('PATCH',  ep, body),
    delete: (ep)          => request('DELETE', ep),
  };

  /* ── Demo delay helper ── */
  function demoDelay() {
    return new Promise(r => setTimeout(r, CONFIG.DEMO_DELAY));
  }

  /* ── Filter / search helpers (demo mode) ── */
  function filterResources(resources, params = {}) {
    let list = [...resources];

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.tags || []).some(t => t.toLowerCase().includes(q)) ||
        r.subject.toLowerCase().includes(q)
      );
    }
    if (params.category && params.category !== 'all') {
      list = list.filter(r => r.category === params.category);
    }
    if (params.type && params.type !== 'all') {
      list = list.filter(r => r.type === params.type);
    }
    if (params.exchangeMode && params.exchangeMode !== 'all') {
      list = list.filter(r => r.exchangeMode === params.exchangeMode);
    }
    if (params.availability && params.availability !== 'all') {
      list = list.filter(r => r.availability === params.availability);
    }
    if (params.minPrice !== undefined) {
      list = list.filter(r => r.price >= params.minPrice);
    }
    if (params.maxPrice !== undefined) {
      list = list.filter(r => r.price <= params.maxPrice);
    }

    // Sorting
    switch (params.sort) {
      case 'newest':    list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'oldest':    list.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'price_asc': list.sort((a,b) => a.price - b.price); break;
      case 'price_desc':list.sort((a,b) => b.price - a.price); break;
      case 'rating':    list.sort((a,b) => b.rating - a.rating); break;
      default:          list.sort((a,b) => b.views - a.views); break; // relevance
    }

    // Pagination
    const page     = parseInt(params.page)     || 1;
    const pageSize = parseInt(params.pageSize) || CONFIG.DEFAULT_PAGE_SIZE;
    const total    = list.length;
    const start    = (page - 1) * pageSize;
    const items    = list.slice(start, start + pageSize);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /* ══════════════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════════════ */
  return {
    /* ── Resources ── */
    resources: {
      async list(params = {}) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          return filterResources(DEMO_DATA.resources, params);
        }
        const cleaned = {};
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '' && v !== 'undefined') {
            cleaned[k] = v;
          }
        }
        const qs = new URLSearchParams(cleaned).toString();
        return http.get(`/resources${qs ? '?' + qs : ''}`);
      },

      async get(id) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          const r = DEMO_DATA.resources.find(r => r.id === id);
          if (!r) throw new Error('Resource not found');
          return r;
        }
        return http.get(`/resources/${id}`);
      },

      async create(data) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          return { ...data, id: 'r_new_' + Date.now(), status: 'pending', createdAt: new Date().toISOString() };
        }
        return http.post('/resources', data);
      },

      async update(id, data) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          return { ...data, id, updatedAt: new Date().toISOString() };
        }
        return http.put(`/resources/${id}`, data);
      },

      async delete(id) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          return { success: true };
        }
        return http.delete(`/resources/${id}`);
      },

      async getReviews(id) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          return DEMO_DATA.reviews.filter(rv => rv.resourceId === id);
        }
        return http.get(`/resources/${id}/reviews`);
      },

      async myResources() {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          const uid = DEMO_DATA.currentUser.id;
          return DEMO_DATA.resources.filter(r => r.ownerId === uid);
        }
        return http.get('/resources/mine');
      },
    },

    /* ── Auth ── */
    auth: {
      _getLocalUsers() {
        try {
          return JSON.parse(localStorage.getItem('rx_local_users') || '[]');
        } catch {
          return [];
        }
      },

      _saveLocalUser(user) {
        const users = this._getLocalUsers();
        users.push(user);
        localStorage.setItem('rx_local_users', JSON.stringify(users));
      },

      async login(credentials) {
        if (!CONFIG.DEMO_MODE) {
          try {
            return await http.post('/auth/login', credentials);
          } catch (err) {
            // Rethrow real API errors (e.g. 401 invalid credentials, 400 validation)
            if (err.status) throw err;
            console.warn('[ResourceX] Backend server offline, authenticating locally:', err.message);
          }
        }

        // Demo mode or offline fallback
        await demoDelay();
        if (!credentials.email || !credentials.email.includes('@')) {
          throw new Error('Please enter a valid email address.');
        }

        const emailLower = credentials.email.toLowerCase().trim();

        // 1. Check user accounts registered in localStorage
        const localUsers = this._getLocalUsers();
        const found = localUsers.find(u => u.email && u.email.toLowerCase() === emailLower);
        if (found) {
          if (found.password && credentials.password && found.password !== credentials.password) {
            throw new Error('Invalid email or password.');
          }
          return { user: found, token: 'local_token_' + Date.now() };
        }

        // 2. No matching user account
        throw new Error('Invalid email or password. Please check your credentials or create an account.');
      },

      async register(data) {
        if (!CONFIG.DEMO_MODE) {
          try {
            return await http.post('/auth/register', data);
          } catch (err) {
            // Rethrow real API errors (e.g. 409 user already exists, 400 validation)
            if (err.status) throw err;
            console.warn('[ResourceX] Backend server offline, registering account locally:', err.message);
          }
        }

        // Demo mode or offline fallback
        await demoDelay();
        const emailLower = (data.email || '').toLowerCase().trim();
        const localUsers = this._getLocalUsers();
        if (localUsers.some(u => u.email && u.email.toLowerCase() === emailLower)) {
          throw new Error('An account with this email address already exists.');
        }

        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Campus Member';
        const initials = ((data.firstName?.[0] || '') + (data.lastName?.[0] || '')).toUpperCase() || 'U';
        const newUser = {
          id: 'u_' + Date.now(),
          name: fullName,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email,
          personalEmail: data.email,
          rollNumber: data.rollNumber || '',
          department: data.department || '',
          role: data.role || 'student',
          password: data.password,
          initials,
          rating: 5.0,
          reviewCount: 0,
          listedCount: 0,
          interactions: 0,
          status: 'active',
          createdAt: new Date().toISOString()
        };

        this._saveLocalUser(newUser);
        return { user: newUser, token: 'local_token_' + Date.now(), message: 'Account created successfully!' };
      },

      async googleLogin(data) {
        if (!CONFIG.DEMO_MODE) {
          try {
            return await http.post('/auth/google', data);
          } catch (err) {
            if (err.status) throw err;
            console.warn('[ResourceX] Backend server offline, authenticating with Google locally:', err.message);
          }
        }

        // Demo mode or offline fallback
        await demoDelay();
        const emailLower = (data.email || '').toLowerCase().trim();
        if (!emailLower) throw new Error('Google email is required.');

        const localUsers = this._getLocalUsers();
        let user = localUsers.find(u =>
          (data.googleId && u.googleId === data.googleId) ||
          (u.email && u.email.toLowerCase() === emailLower) ||
          (u.personalEmail && u.personalEmail.toLowerCase() === emailLower)
        );

        if (!user) {
          const parts = (data.name || '').trim().split(/\s+/).filter(Boolean);
          const firstName = data.firstName || parts[0] || 'Campus';
          const lastName = data.lastName || parts.slice(1).join(' ') || 'Member';
          const fullName = data.name || `${firstName} ${lastName}`.trim();
          const initials = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || 'G';
          const randomRoll = 'G-' + Math.floor(100000 + Math.random() * 900000);

          user = {
            id: 'u_google_' + Date.now(),
            name: fullName,
            firstName,
            lastName,
            email: emailLower,
            personalEmail: emailLower,
            rollNumber: randomRoll,
            department: 'Computer Science & Engineering',
            role: 'student',
            authProvider: 'google',
            googleId: data.googleId || ('gid_' + Date.now()),
            avatar: data.picture || '',
            bio: 'Joined via Google Sign-In',
            initials,
            rating: 5.0,
            reviewCount: 0,
            listedCount: 0,
            interactions: 0,
            status: 'active',
            createdAt: new Date().toISOString()
          };
          this._saveLocalUser(user);
        } else {
          // If existing user didn't have avatar or googleId, update them locally
          if (data.picture && !user.avatar) user.avatar = data.picture;
          if (data.googleId && !user.googleId) user.googleId = data.googleId;
        }

        return { user, token: 'google_token_' + Date.now() };
      },

      async logout() {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          return { success: true };
        }
        try {
          return await http.post('/auth/logout');
        } catch {
          return { success: true };
        }
      },
    },

    /* ── Reservations ── */
    reservations: {
      async list(params = {}) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          const uid  = DEMO_DATA.currentUser.id;
          let list   = DEMO_DATA.reservations.filter(r =>
            r.requesterId === uid || r.ownerId === uid
          );
          if (params.status && params.status !== 'all') {
            list = list.filter(r => r.status === params.status);
          }
          return list;
        }
        return http.get('/reservations');
      },

      async create(data) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          return { ...data, id: 'res_' + Date.now(), status: 'pending', createdAt: new Date().toISOString() };
        }
        return http.post('/reservations', data);
      },

      async updateStatus(id, status) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          const r = DEMO_DATA.reservations.find(r => r.id === id);
          if (r) r.status = status;
          return { id, status };
        }
        return http.patch(`/reservations/${id}`, { status });
      },
    },

    /* ── Transactions ── */
    transactions: {
      async list() {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          return DEMO_DATA.transactions;
        }
        return http.get('/transactions');
      },

      async get(id) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          return DEMO_DATA.transactions.find(t => t.id === id);
        }
        return http.get(`/transactions/${id}`);
      },
    },

    /* ── Notifications ── */
    notifications: {
      async list() {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          return DEMO_DATA.notifications;
        }
        return http.get('/notifications');
      },

      async markRead(id) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          const n = DEMO_DATA.notifications.find(n => n.id === id);
          if (n) n.read = true;
          return { success: true };
        }
        return http.patch(`/notifications/${id}`, { read: true });
      },

      async markAllRead() {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          DEMO_DATA.notifications.forEach(n => n.read = true);
          return { success: true };
        }
        return http.post('/notifications/mark-all-read');
      },
    },

    /* ── Requirements ── */
    requirements: {
      async list() {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          const uid = DEMO_DATA.currentUser.id;
          return DEMO_DATA.requirements.filter(r => r.userId === uid);
        }
        return http.get('/requirements');
      },

      async create(data) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          const newReq = { ...data, id: 'req_' + Date.now(), userId: DEMO_DATA.currentUser.id, createdAt: new Date().toISOString(), status: 'open' };
          DEMO_DATA.requirements.push(newReq);
          return newReq;
        }
        return http.post('/requirements', data);
      },
    },

    /* ── Wishlist (client-side in demo mode) ── */
    wishlist: {
      getIds() {
        const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.WISHLIST);
        return raw ? JSON.parse(raw) : [];
      },
      toggle(resourceId) {
        const ids = this.getIds();
        const idx = ids.indexOf(resourceId);
        if (idx === -1) ids.push(resourceId);
        else            ids.splice(idx, 1);
        localStorage.setItem(CONFIG.STORAGE_KEYS.WISHLIST, JSON.stringify(ids));
        return idx === -1; // true = added
      },
      isWishlisted(resourceId) {
        return this.getIds().includes(resourceId);
      },
      async list() {
        if (CONFIG.DEMO_MODE) {
          const ids = this.getIds();
          return DEMO_DATA.resources.filter(r => ids.includes(r.id));
        }
        return http.get('/wishlist');
      },
    },

    /* ── Users (admin) ── */
    users: {
      async list() {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          return DEMO_DATA.users;
        }
        return http.get('/admin/users');
      },
      async updateStatus(id, status) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          const u = DEMO_DATA.users.find(u => u.id === id);
          if (u) u.status = status;
          return { id, status };
        }
        return http.patch(`/admin/users/${id}`, { status });
      },
      async deleteAll() {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          if (Array.isArray(DEMO_DATA.users)) DEMO_DATA.users.length = 0;
          localStorage.removeItem('rx_local_users');
          return { success: true, message: 'All demo and local users removed.' };
        }
        return http.delete('/admin/users');
      },
    },

    /* ── Analytics (admin) ── */
    analytics: {
      async get() {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          return DEMO_DATA.analytics;
        }
        return http.get('/admin/analytics');
      },
    },
  };
})();

window.API = API;
