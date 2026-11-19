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
    const token = sessionStorage.getItem('rx_token') || localStorage.getItem('rx_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      const error = new Error(err.message || `HTTP ${res.status}`);
      error.status = res.status;
      error.errors = err.errors;
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
        let result = null;
        if (!CONFIG.DEMO_MODE) {
          try {
            const cleaned = {};
            for (const [k, v] of Object.entries(params)) {
              if (v !== undefined && v !== null && v !== '' && v !== 'undefined') {
                cleaned[k] = v;
              }
            }
            const qs = new URLSearchParams(cleaned).toString();
            result = await http.get(`/resources${qs ? '?' + qs : ''}`);
          } catch (err) {
            console.warn('[ResourceX] Backend offline, loading local resources:', err.message);
          }
        }

        // Public catalog strictly displays only approved resources (pending items require admin approval)
        const localRes = JSON.parse(localStorage.getItem('rx_local_resources') || '[]');
        const approvedLocals = localRes.filter(r => r.status === 'approved');

        if (result && Array.isArray(result.items)) {
          const approvedBackends = result.items.filter(r => r.status === 'approved');
          const existingIds = new Set(approvedBackends.map(r => String(r.id || r._id)));
          const uniqueLocals = approvedLocals.filter(r => !existingIds.has(String(r.id || r._id)));
          return {
            ...result,
            items: [...uniqueLocals, ...approvedBackends],
            total: (result.total || 0) + uniqueLocals.length,
          };
        }

        await demoDelay();
        const demoApproved = DEMO_DATA.resources.filter(r => r.status === 'approved');
        const allRes = [...approvedLocals, ...demoApproved];
        return filterResources(allRes, params);
      },

      async get(id) {
        if (!CONFIG.DEMO_MODE) {
          try {
            return await http.get(`/resources/${id}`);
          } catch (err) {
            console.warn('[ResourceX] Backend offline, checking local resources:', err.message);
          }
        }
        await demoDelay();
        const localRes = JSON.parse(localStorage.getItem('rx_local_resources') || '[]');
        const all = [...localRes, ...DEMO_DATA.resources];
        const r = all.find(item => String(item.id || item._id) === String(id));
        if (!r) throw new Error('Resource not found');
        return r;
      },

      async create(data) {
        let created = null;
        if (!CONFIG.DEMO_MODE) {
          try {
            created = await http.post('/resources', data);
          } catch (err) {
            // Re-throw true 400 validation errors so the UI shows specific field messages
            if (err.status === 400 || err.status === 401 || err.status === 403) {
              throw err;
            }
            console.warn('[ResourceX] Backend offline, saving resource locally:', err.message);
          }
        }

        if (!created) {
          const user = (typeof Auth !== 'undefined' && Auth.getUser()) || DEMO_DATA.currentUser || { name: 'Campus Student', email: 'student@campus.edu' };
          const ownerName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student Contributor';
          const ownerEmail = user.email || user.personalEmail || '';
          const ownerPhone = user.phone || user.phoneNumber || '';
          const ownerDept = user.department || data.department || 'General';
          const ownerRoll = user.rollNumber || ownerPhone || '';
          const ownerAvatar = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=2563eb&color=fff`;

          created = {
            ...data,
            id: 'r_local_' + Date.now(),
            _id: 'r_local_' + Date.now(),
            ownerId: user.id || user._id || 'u001',
            ownerName,
            ownerEmail,
            ownerPhone,
            ownerDept,
            ownerRoll,
            ownerAvatar,
            owner: {
              id: user.id || user._id || 'u001',
              name: ownerName,
              email: ownerEmail,
              phone: ownerPhone,
              role: user.role || 'student',
              department: ownerDept,
              rollNumber: ownerRoll,
              avatar: ownerAvatar,
              rating: 5.0,
            },
            status: 'pending', // Strictly pending until admin accepts
            availability: data.availability || 'available',
            views: 0,
            rating: 5.0,
            reviewCount: 0,
            createdAt: new Date().toISOString(),
          };
        }

        // Always save to localStorage and unshift into DEMO_DATA so it appears immediately
        try {
          const localList = JSON.parse(localStorage.getItem('rx_local_resources') || '[]');
          localList.unshift(created);
          localStorage.setItem('rx_local_resources', JSON.stringify(localList));
          if (Array.isArray(DEMO_DATA.resources)) {
            DEMO_DATA.resources.unshift(created);
          }
        } catch (_) {}

        return created;
      },

      async update(id, data) {
        if (!CONFIG.DEMO_MODE) {
          try {
            return await http.put(`/resources/${id}`, data);
          } catch (err) {
            console.warn('[ResourceX] Backend offline, updating locally:', err.message);
          }
        }
        await demoDelay();
        try {
          const localList = JSON.parse(localStorage.getItem('rx_local_resources') || '[]');
          const idx = localList.findIndex(r => String(r.id || r._id) === String(id));
          if (idx !== -1) {
            localList[idx] = { ...localList[idx], ...data, updatedAt: new Date().toISOString() };
            localStorage.setItem('rx_local_resources', JSON.stringify(localList));
          }
        } catch (_) {}
        return { ...data, id, updatedAt: new Date().toISOString() };
      },

      async delete(id) {
        if (!CONFIG.DEMO_MODE) {
          try {
            return await http.delete(`/resources/${id}`);
          } catch (err) {
            console.warn('[ResourceX] Backend offline, deleting locally:', err.message);
          }
        }
        await demoDelay();
        try {
          let localList = JSON.parse(localStorage.getItem('rx_local_resources') || '[]');
          localList = localList.filter(r => String(r.id || r._id) !== String(id));
          localStorage.setItem('rx_local_resources', JSON.stringify(localList));
          if (Array.isArray(DEMO_DATA.resources)) {
            DEMO_DATA.resources = DEMO_DATA.resources.filter(r => String(r.id || r._id) !== String(id));
          }
        } catch (_) {}
        return { success: true };
      },

      async getReviews(id) {
        if (!CONFIG.DEMO_MODE) {
          try {
            return await http.get(`/resources/${id}/reviews`);
          } catch (_) {}
        }
        await demoDelay();
        return DEMO_DATA.reviews.filter(rv => rv.resourceId === id);
      },

      async myResources() {
        const user = (typeof Auth !== 'undefined' && Auth.getUser()) || DEMO_DATA.currentUser;
        const uid = user ? String(user.id || user._id) : 'u001';
        let list = null;

        if (!CONFIG.DEMO_MODE) {
          try {
            list = await http.get('/resources/mine');
          } catch (err) {
            console.warn('[ResourceX] Backend offline, loading my resources locally:', err.message);
          }
        }

        const localRes = JSON.parse(localStorage.getItem('rx_local_resources') || '[]');
        const myLocals = localRes.filter(r => String(r.ownerId) === uid || (r.owner && String(r.owner.id || r.owner._id) === uid));

        if (Array.isArray(list)) {
          const existingIds = new Set(list.map(r => String(r.id || r._id)));
          return [...myLocals.filter(r => !existingIds.has(String(r.id || r._id))), ...list];
        }

        await demoDelay();
        const demoMine = DEMO_DATA.resources.filter(r => String(r.ownerId) === uid || (r.owner && String(r.owner.id) === uid));
        return [...myLocals, ...demoMine];
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

        // 1. Check built-in Campus Administrator credentials
        if (
          emailLower === 'admin@campus.edu' ||
          emailLower === 'admin@resourcex.edu' ||
          emailLower === 'administrator@campus.edu'
        ) {
          if (credentials.password && credentials.password !== 'AdminPass@123' && credentials.password !== 'admin123') {
            throw new Error('Invalid administrator password. Default password is AdminPass@123');
          }
          const adminUser = {
            id: 'u_admin_001',
            _id: 'u_admin_001',
            name: 'Campus Administrator',
            firstName: 'Campus',
            lastName: 'Administrator',
            email: emailLower,
            personalEmail: emailLower,
            rollNumber: 'ADM-001',
            department: 'Campus Administration',
            role: 'admin',
            isAdmin: true,
            initials: 'AD',
            status: 'active',
            rating: 5.0,
            reviewCount: 0,
            listedCount: 0,
            interactions: 99,
            createdAt: '2026-01-01T00:00:00.000Z'
          };
          return { user: adminUser, token: 'local_admin_jwt_' + Date.now() };
        }

        // 2. Check user accounts registered in localStorage
        const localUsers = this._getLocalUsers();
        const found = localUsers.find(u => u.email && u.email.toLowerCase() === emailLower);
        if (found) {
          if (found.password && credentials.password && found.password !== credentials.password) {
            throw new Error('Invalid email or password.');
          }
          if (found.role === 'admin') found.isAdmin = true;
          return { user: found, token: 'local_token_' + Date.now() };
        }

        // 3. No matching user account
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
          phone: data.phone || data.phoneNumber || '',
          rollNumber: data.phone || data.rollNumber || '',
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
        let emailLower = (data.email || '').toLowerCase().trim();
        if (!emailLower && data.code) {
          emailLower = 'yugandharchandu54@gmail.com';
        }
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
          const user = (typeof Auth !== 'undefined' && Auth.getUser && Auth.getUser()) || DEMO_DATA.currentUser || null;
          const uid  = user ? (user.id || user._id) : null;
          const localRes = JSON.parse(localStorage.getItem('rx_reservations') || '[]');
          const allRes = [...(DEMO_DATA.reservations || []), ...localRes];
          let list = uid ? allRes.filter(r => r.requesterId === uid || r.ownerId === uid) : allRes;
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
          const newRes = { ...data, id: 'res_' + Date.now(), status: 'pending', createdAt: new Date().toISOString() };
          try {
            const list = JSON.parse(localStorage.getItem('rx_reservations') || '[]');
            list.unshift(newRes);
            localStorage.setItem('rx_reservations', JSON.stringify(list));
          } catch (_) {}
          return newRes;
        }
        return http.post('/reservations', data);
      },

      async updateStatus(id, status) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          try {
            const list = JSON.parse(localStorage.getItem('rx_reservations') || '[]');
            const r = list.find(item => item.id === id);
            if (r) {
              r.status = status;
              localStorage.setItem('rx_reservations', JSON.stringify(list));
            }
          } catch (_) {}
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
          const localTx = JSON.parse(localStorage.getItem('rx_transactions') || '[]');
          return [...(DEMO_DATA.transactions || []), ...localTx];
        }
        return http.get('/transactions');
      },

      async get(id) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          const localTx = JSON.parse(localStorage.getItem('rx_transactions') || '[]');
          const allTx = [...(DEMO_DATA.transactions || []), ...localTx];
          return allTx.find(t => t.id === id);
        }
        return http.get(`/transactions/${id}`);
      },
    },

    /* ── Notifications ── */
    notifications: {
      async list() {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          const localNotifs = JSON.parse(localStorage.getItem('rx_notifications') || '[]');
          return [...(DEMO_DATA.notifications || []), ...localNotifs];
        }
        return http.get('/notifications');
      },

      async markRead(id) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          try {
            const list = JSON.parse(localStorage.getItem('rx_notifications') || '[]');
            const n = list.find(item => item.id === id);
            if (n) {
              n.read = true;
              localStorage.setItem('rx_notifications', JSON.stringify(list));
            }
          } catch (_) {}
          return { success: true };
        }
        return http.patch(`/notifications/${id}`, { read: true });
      },

      async markAllRead() {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          try {
            const list = JSON.parse(localStorage.getItem('rx_notifications') || '[]');
            list.forEach(n => n.read = true);
            localStorage.setItem('rx_notifications', JSON.stringify(list));
          } catch (_) {}
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
          const user = (typeof Auth !== 'undefined' && Auth.getUser && Auth.getUser()) || DEMO_DATA.currentUser || null;
          const uid = user ? (user.id || user._id) : null;
          const localReqs = JSON.parse(localStorage.getItem('rx_requirements') || '[]');
          const allReqs = [...(DEMO_DATA.requirements || []), ...localReqs];
          return uid ? allReqs.filter(r => r.userId === uid) : allReqs;
        }
        return http.get('/requirements');
      },

      async create(data) {
        if (CONFIG.DEMO_MODE) {
          await demoDelay();
          const user = (typeof Auth !== 'undefined' && Auth.getUser && Auth.getUser()) || DEMO_DATA.currentUser || null;
          const uid = user ? (user.id || user._id) : 'u_guest';
          const newReq = { ...data, id: 'req_' + Date.now(), userId: uid, createdAt: new Date().toISOString(), status: 'open' };
          try {
            const list = JSON.parse(localStorage.getItem('rx_requirements') || '[]');
            list.unshift(newReq);
            localStorage.setItem('rx_requirements', JSON.stringify(list));
          } catch (_) {}
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

    /* ── Admin Management ── */
    admin: {
      async resources(status = null) {
        if (!CONFIG.DEMO_MODE) {
          try {
            const qs = status ? `?status=${encodeURIComponent(status)}` : '';
            return await http.get(`/admin/resources${qs}`);
          } catch (err) {
            console.warn('[ResourceX] Backend offline, getting admin resources locally:', err.message);
          }
        }
        await demoDelay();
        const localRes = JSON.parse(localStorage.getItem('rx_local_resources') || '[]');
        const all = [...localRes, ...DEMO_DATA.resources];
        if (status) return all.filter(r => r.status === status);
        return all;
      },

      async moderate(id, action, note = '') {
        if (!CONFIG.DEMO_MODE) {
          try {
            return await http.patch(`/admin/resources/${id}/moderate`, { action, note });
          } catch (err) {
            console.warn('[ResourceX] Backend offline, moderating locally:', err.message);
          }
        }
        await demoDelay();
        try {
          const localList = JSON.parse(localStorage.getItem('rx_local_resources') || '[]');
          const item = localList.find(r => String(r.id || r._id) === String(id));
          if (item) {
            item.status = action;
            localStorage.setItem('rx_local_resources', JSON.stringify(localList));
          }
        } catch (_) {}
        const demoItem = DEMO_DATA.resources.find(r => String(r.id || r._id) === String(id));
        if (demoItem) demoItem.status = action;
        return { id, status: action, note };
      },
    },
  };
})();

window.API = API;
