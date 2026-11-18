/**
 * ResourceX – Common Utilities
 * Shared functions used across all pages.
 */

/* ══════════════════════════════════════════════════════════
   THEME MANAGEMENT
   ══════════════════════════════════════════════════════════ */
const Theme = {
  init() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    this.apply(saved || preferred);
  },
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    this.apply(current === 'dark' ? 'light' : 'dark');
  },
  current() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  },
};

/* ══════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ══════════════════════════════════════════════════════════ */
const Toast = {
  container: null,

  _ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(this.container);
    }
  },

  _iconSVG(type) {
    const icons = {
      success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error:   '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info:    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    };
    return icons[type] || icons.info;
  },

  show(message, type = 'info', title = '', duration = CONFIG.TOAST_DURATION) {
    this._ensureContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="toast-icon">${this._iconSVG(type)}</div>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ''}
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
      <button class="toast-close" aria-label="Dismiss notification">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    const dismiss = () => {
      toast.classList.add('dismissing');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    this.container.appendChild(toast);

    if (duration > 0) setTimeout(dismiss, duration);
    return { dismiss };
  },

  success: (msg, title)  => Toast.show(msg, 'success', title),
  error:   (msg, title)  => Toast.show(msg, 'error',   title),
  warning: (msg, title)  => Toast.show(msg, 'warning', title),
  info:    (msg, title)  => Toast.show(msg, 'info',    title),
};

/* ══════════════════════════════════════════════════════════
   MODAL
   ══════════════════════════════════════════════════════════ */
const Modal = {
  open(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;
    el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    el.querySelector('.modal-close')?.focus();
    // Close on backdrop click
    el.addEventListener('click', e => { if (e.target === el) this.close(modalId); }, { once: true });
    // ESC key
    const onEsc = e => { if (e.key === 'Escape') { this.close(modalId); document.removeEventListener('keydown', onEsc); } };
    document.addEventListener('keydown', onEsc);
  },
  close(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;
    el.classList.add('hidden');
    document.body.style.overflow = '';
  },
};

/* ══════════════════════════════════════════════════════════
   LOADING
   ══════════════════════════════════════════════════════════ */
const Loading = {
  show(target) {
    if (typeof target === 'string') {
      // show on a button
      const btn = document.getElementById(target) || document.querySelector(target);
      if (btn) {
        btn.disabled = true;
        btn._origText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-sm spinner"></span>';
        btn.classList.add('btn-loading');
      }
    } else {
      document.getElementById('global-loading')?.classList.remove('hidden');
    }
  },
  hide(target) {
    if (typeof target === 'string') {
      const btn = document.getElementById(target) || document.querySelector(target);
      if (btn) {
        btn.disabled = false;
        if (btn._origText) btn.innerHTML = btn._origText;
        btn.classList.remove('btn-loading');
      }
    } else {
      document.getElementById('global-loading')?.classList.add('hidden');
    }
  },
};

/* ══════════════════════════════════════════════════════════
   AUTH STATE (demo)
   ══════════════════════════════════════════════════════════ */
const Auth = {
  getUser() {
    const raw = sessionStorage.getItem(CONFIG.STORAGE_KEYS.DEMO_USER);
    return raw ? JSON.parse(raw) : null;
  },
  setUser(user) {
    sessionStorage.setItem(CONFIG.STORAGE_KEYS.DEMO_USER, JSON.stringify(user));
  },
  isLoggedIn() {
    return !!this.getUser();
  },
  isAdmin() {
    const user = this.getUser();
    return !!(user && (user.role === 'admin' || user.isAdmin === true));
  },
  login(user, token) {
    if (user && user.role === 'admin') user.isAdmin = true;
    this.setUser(user);
    if (token) sessionStorage.setItem('rx_token', token);
  },
  logout() {
    sessionStorage.removeItem(CONFIG.STORAGE_KEYS.DEMO_USER);
    sessionStorage.removeItem('rx_token');
    window.location.href = getRootPath() + 'pages/login.html';
  },
  requireAuth() {
    if (!this.isLoggedIn()) {
      const here = encodeURIComponent(window.location.href);
      window.location.href = getRootPath() + 'pages/login.html?next=' + here;
      return false;
    }
    return true;
  },
  requireAdmin() {
    if (!this.isLoggedIn()) {
      if (document.body) document.body.style.display = 'none';
      const here = encodeURIComponent(window.location.href);
      window.location.href = getRootPath() + 'pages/admin-login.html?next=' + here;
      return false;
    }
    if (!this.isAdmin()) {
      if (document.body) document.body.style.display = 'none';
      try {
        sessionStorage.setItem('rx_flash_message', JSON.stringify({ type: 'warning', text: 'Access Denied: Administrator privileges required to access the admin console.' }));
      } catch (_) {}
      window.location.href = getRootPath() + 'pages/dashboard.html';
      return false;
    }
    return true;
  },
};

/* ══════════════════════════════════════════════════════════
   NAVIGATION – Navbar Component
   ══════════════════════════════════════════════════════════ */
function initNavbar() {
  const root = getRootPath();
  const user = Auth.getUser();
  const isLoggedIn = !!user;
  const currentPage = window.location.pathname;

  const navHTML = `
  <nav class="navbar" id="main-nav" role="navigation" aria-label="Main navigation">
    <div class="container">
      <a href="${root}index.html" class="nav-logo" aria-label="ResourceX Home">
        <div class="nav-logo-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <span class="nav-logo-text">Resource<span>X</span></span>
      </a>
      <div class="nav-links" id="nav-links">
        <a href="${root}index.html"             class="nav-link" data-page="home">Home</a>
        <a href="${root}pages/browse.html"      class="nav-link" data-page="browse">Explore Resources</a>
        <a href="${root}pages/how-it-works.html"class="nav-link" data-page="how">How It Works</a>
        <a href="${root}pages/about.html"       class="nav-link" data-page="about">About</a>
        ${isLoggedIn ? `<a href="${root}pages/dashboard.html" class="nav-link" data-page="dashboard">Dashboard</a>` : ''}
      </div>
      <div class="nav-actions">
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
          <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        ${isLoggedIn ? `
          <div class="dropdown" id="user-dropdown">
            <button class="avatar avatar-sm" id="user-avatar-btn" aria-haspopup="true" aria-expanded="false" style="cursor:pointer;border:2px solid var(--primary);">
              ${escapeHtml(user.initials || (user.name ? user.name.split(' ').filter(Boolean).map(n=>n[0]).join('').slice(0,2) : 'U'))}
            </button>
            <div class="dropdown-menu" id="user-menu" role="menu">
              <div style="padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--border-color)">
                <div style="font-weight:600;font-size:var(--text-sm)">${escapeHtml(user.name || user.email || 'Campus Member')}</div>
                <div style="font-size:var(--text-xs);color:var(--text-muted)">${escapeHtml(user.email || '')}</div>
              </div>
              <a href="${root}pages/profile.html"      class="dropdown-item" role="menuitem"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Profile</a>
              <a href="${root}pages/dashboard.html"    class="dropdown-item" role="menuitem"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>Dashboard</a>
              <a href="${root}pages/my-resources.html" class="dropdown-item" role="menuitem"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>My Resources</a>
              ${Auth.isAdmin() ? `<a href="${root}pages/admin-dashboard.html" class="dropdown-item" role="menuitem"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>🛡️ Admin Approval Queue</a>` : ''}
              <a href="${root}pages/notifications.html" class="dropdown-item" role="menuitem"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>Notifications</a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" id="logout-btn" role="menuitem"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Sign Out</button>
            </div>
          </div>
        ` : `
          <a href="${root}pages/login.html"    class="btn btn-ghost btn-sm">Login</a>
          <a href="${root}pages/register.html" class="btn btn-primary btn-sm">Get Started</a>
        `}
        <button class="hamburger" id="hamburger" aria-label="Toggle mobile menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>
  <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
    <a href="${root}index.html"              class="nav-link">Home</a>
    <a href="${root}pages/browse.html"       class="nav-link">Explore Resources</a>
    <a href="${root}pages/how-it-works.html" class="nav-link">How It Works</a>
    <a href="${root}pages/about.html"        class="nav-link">About</a>
    ${isLoggedIn ? `<a href="${root}pages/dashboard.html" class="nav-link">Dashboard</a>` : ''}
    <div class="nav-actions">
      ${isLoggedIn ? `
        <a href="${root}pages/profile.html" class="btn btn-outline btn-sm">Profile</a>
        <button class="btn btn-ghost btn-sm" id="mobile-logout">Sign Out</button>
      ` : `
        <a href="${root}pages/login.html"    class="btn btn-outline btn-sm">Login</a>
        <a href="${root}pages/register.html" class="btn btn-primary btn-sm">Get Started</a>
      `}
    </div>
  </nav>`;

  // Insert at top of body
  const wrapper = document.createElement('div');
  wrapper.innerHTML = navHTML;
  document.body.insertBefore(wrapper.firstElementChild, document.body.firstChild);
  document.body.insertBefore(wrapper.firstElementChild, document.body.children[1]);

  // Highlight active link
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.href && window.location.href.includes(link.getAttribute('href').replace('../',''))) {
      link.classList.add('active');
    }
  });

  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', () => Theme.toggle());

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  hamburger?.addEventListener('click', () => {
    const sidebar = document.getElementById('dashboard-sidebar');
    if (sidebar && window.innerWidth <= 992) {
      const isOpen = sidebar.classList.toggle('open');
      document.getElementById('sidebar-overlay')?.classList.toggle('active', isOpen);
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    } else {
      hamburger.classList.toggle('open');
      mobileNav?.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', hamburger.classList.contains('open'));
    }
  });

  // User dropdown
  document.getElementById('user-avatar-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = document.getElementById('user-menu');
    const isOpen = menu.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', isOpen);
  });
  document.addEventListener('click', () => {
    document.getElementById('user-menu')?.classList.remove('open');
  });

  // Logout
  ['logout-btn', 'mobile-logout'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => Auth.logout());
  });
}

/* ══════════════════════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════════════════════ */
function initFooter() {
  const root = getRootPath();
  const footerHTML = `
  <footer class="footer" role="contentinfo">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <h3>Resource<span>X</span></h3>
          <p>One Campus. Every Resource.<br>A smart platform for sharing, borrowing, and discovering academic resources across campus.</p>
        </div>
        <div class="footer-col">
          <h4>Platform</h4>
          <ul>
            <li><a href="${root}pages/browse.html">Explore Resources</a></li>
            <li><a href="${root}pages/how-it-works.html">How It Works</a></li>
            <li><a href="${root}pages/create-listing.html">Share a Resource</a></li>
            <li><a href="${root}pages/requirements.html">Submit Requirement</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Account</h4>
          <ul>
            <li><a href="${root}pages/login.html">Login</a></li>
            <li><a href="${root}pages/admin-login.html" style="color:var(--primary);font-weight:600">🛡️ Admin Portal</a></li>
            <li><a href="${root}pages/register.html">Register</a></li>
            <li><a href="${root}pages/dashboard.html">Dashboard</a></li>
            <li><a href="${root}pages/profile.html">My Profile</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Info</h4>
          <ul>
            <li><a href="${root}pages/about.html">About ResourceX</a></li>
            <li><a href="${root}pages/contact.html">Contact & Help</a></li>
            <li><a href="#" aria-label="Privacy Policy (coming soon)">Privacy Policy</a></li>
            <li><a href="#" aria-label="Terms of Service (coming soon)">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 ResourceX. All rights reserved.</p>
        <div class="footer-bottom-links">
          <a href="${root}pages/about.html">About</a>
          <a href="${root}pages/contact.html">Contact</a>
          <a href="#">Privacy</a>
        </div>
      </div>
    </div>
  </footer>`;

  document.body.insertAdjacentHTML('beforeend', footerHTML);
}

/* ══════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ══════════════════════════════════════════════════════════ */

/** Escape HTML to prevent XSS when rendering user-provided content */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Determine root path (works from both root and pages/) */
function getRootPath() {
  const path = window.location.pathname;
  return path.includes('/pages/') ? '../' : './';
}

/** Format currency */
function formatCurrency(amount, free = 'Free') {
  if (!amount || amount === 0) return free;
  return '₹' + Number(amount).toLocaleString('en-IN');
}

/** Format relative time */
function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now  = new Date();
  const secs = Math.floor((now - date) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return Math.floor(secs / 60) + 'm ago';
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
  if (secs < 604800)return Math.floor(secs / 86400) + 'd ago';
  return date.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

/** Format date */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

/** Render star rating HTML */
function renderStars(rating, max = 5) {
  let html = '<div class="stars" aria-label="' + rating + ' out of ' + max + ' stars">';
  for (let i = 1; i <= max; i++) {
    html += `<svg class="star ${i <= Math.round(rating) ? '' : 'empty'}" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${i <= Math.round(rating) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
  html += '</div>';
  return html;
}

/** Render a resource card HTML string */
function renderResourceCard(resource, root = './') {
  const wishlisted = API.wishlist.isWishlisted(resource.id);
  const priceLabel = formatCurrency(resource.price);
  const exchangeLabels = { free: 'Free Share', borrow: 'Borrow/Lend', sell: 'Buy/Sell' };
  const exchangeBadgeClass = { free: 'badge-free', borrow: 'badge-borrow', sell: 'badge-sell' };
  const availClass = resource.availability === 'available' ? 'badge-success' : 'badge-gray';
  const imgUrl = (resource.images && resource.images.length > 0 && resource.images[0]) || resource.thumbnail || '';

  return `
  <article class="resource-card card-hoverable" data-resource-id="${resource.id}">
    <div class="resource-card-image">
      ${imgUrl ? `
        <img src="${imgUrl}" alt="${escapeHtml(resource.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;"
             onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='grid';"/>
        <div class="resource-icon-placeholder" style="display:none">
          ${getCategoryIcon(resource.category)}
        </div>
      ` : `
        <div class="resource-icon-placeholder">
          ${getCategoryIcon(resource.category)}
        </div>
      `}
      <div class="resource-card-badges">
        <span class="badge badge-${resource.type === 'physical' ? 'physical' : 'digital'}">${resource.type === 'physical' ? 'Physical' : 'Digital'}</span>
        <span class="badge ${exchangeBadgeClass[resource.exchangeMode] || 'badge-gray'}">${exchangeLabels[resource.exchangeMode] || resource.exchangeMode}</span>
      </div>
      <button class="resource-card-wishlist btn btn-icon ${wishlisted ? 'btn-accent' : 'btn-ghost'}"
              aria-label="${wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
              onclick="toggleWishlist(this, '${resource.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${wishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
    </div>
    <div class="resource-card-body">
      <h3 class="resource-card-title">${escapeHtml(resource.title)}</h3>
      <p class="resource-card-description">${escapeHtml(resource.description)}</p>
      <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;margin-top:var(--space-2)">
        <span class="badge ${availClass}">${resource.availability === 'available' ? '● Available' : '○ ' + (resource.availability || 'N/A')}</span>
      </div>
      <div class="resource-card-meta">
        <div>
          <div class="resource-card-price ${resource.price === 0 ? 'free' : ''}">${priceLabel}</div>
          ${resource.rating > 0 ? `<div class="resource-card-rating">${renderStars(resource.rating)}<span class="count">(${resource.reviewCount})</span></div>` : ''}
        </div>
        <div class="resource-card-owner">
          <div class="avatar avatar-sm">${escapeHtml((resource.ownerName || (resource.owner && resource.owner.name) || 'Campus Member').split(' ').filter(Boolean).map(n=>n[0]).join('').slice(0,2) || 'CM')}</div>
          <span class="truncate" style="max-width:80px">${escapeHtml((resource.ownerName || (resource.owner && resource.owner.name) || 'Member').split(' ')[0])}</span>
        </div>
      </div>
    </div>
    <div class="resource-card-footer">
      <a href="${root}pages/resource-details.html?id=${resource.id}" class="btn btn-outline btn-sm">View Details</a>
      <button class="btn btn-primary btn-sm" onclick="quickAction('${resource.id}','${resource.exchangeMode}')">
        ${resource.exchangeMode === 'borrow' ? 'Request' : resource.exchangeMode === 'sell' ? 'Buy' : 'Access'}
      </button>
    </div>
  </article>`;
}

/** Get category SVG icon */
function getCategoryIcon(category) {
  const icons = {
    books:       '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    electronics: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/></svg>',
    lab:         '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11l-4 9h14l-4-9V3"/></svg>',
    materials:   '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    notes:       '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    papers:      '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    slides:      '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    manuals:     '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>',
  };
  return icons[category] || icons.notes;
}

/** Quick wishlist toggle (called from card buttons) */
function toggleWishlist(btn, resourceId) {
  const added = API.wishlist.toggle(resourceId);
  btn.setAttribute('aria-label', added ? 'Remove from wishlist' : 'Add to wishlist');
  btn.querySelector('svg').setAttribute('fill', added ? 'currentColor' : 'none');
  btn.className = `resource-card-wishlist btn btn-icon ${added ? 'btn-accent' : 'btn-ghost'}`;
  Toast[added ? 'success' : 'info'](added ? 'Added to wishlist.' : 'Removed from wishlist.', '');
}

/** Quick action from card (borrow/buy/access) */
function quickAction(resourceId, mode) {
  if (!Auth.isLoggedIn()) {
    Toast.warning('Please log in to interact with resources.', 'Login required');
    return;
  }
  const root = getRootPath();
  window.location.href = `${root}pages/resource-details.html?id=${resourceId}`;
}

/** Render skeleton cards */
function renderSkeletons(count = 6) {
  return Array(count).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-image"></div>
      <div style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-3)">
        <div class="skeleton skeleton-title" style="width:80%"></div>
        <div class="skeleton skeleton-text" style="width:100%"></div>
        <div class="skeleton skeleton-text" style="width:60%"></div>
      </div>
    </div>
  `).join('');
}

/** Render pagination */
function renderPagination(current, total, onPage) {
  if (total <= 1) return '';
  let html = '<div class="pagination" role="navigation" aria-label="Pagination">';
  html += `<button class="page-btn" ${current === 1 ? 'disabled' : ''} onclick="${onPage}(${current-1})" aria-label="Previous page">←</button>`;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current-2 && i <= current+2)) {
      html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="${onPage}(${i})" aria-label="Page ${i}" aria-current="${i === current ? 'page' : 'false'}">${i}</button>`;
    } else if (i === current-3 || i === current+3) {
      html += '<span class="page-ellipsis">…</span>';
    }
  }
  html += `<button class="page-btn" ${current === total ? 'disabled' : ''} onclick="${onPage}(${current+1})" aria-label="Next page">→</button>`;
  html += '</div>';
  return html;
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD SIDEBAR
   ══════════════════════════════════════════════════════════ */
function renderDashboardSidebar(activePage) {
  const root = getRootPath();
  const user = Auth.getUser() || DEMO_DATA.currentUser || { name: 'Campus Member', role: 'student', initials: 'CM' };
  const isAdmin = Auth.isAdmin();

  const navItems = [
    { href: 'dashboard.html',       label: 'Dashboard',       icon: 'grid', page: 'dashboard' },
    { href: 'my-resources.html',    label: 'My Resources',    icon: 'package', page: 'my-resources' },
    { href: 'create-listing.html',  label: 'Share Resource',  icon: 'plus-circle', page: 'create-listing' },
    { href: 'requirements.html',    label: 'Requirements',    icon: 'search', page: 'requirements' },
    { href: 'matches.html',         label: 'Smart Matches',   icon: 'zap', page: 'matches' },
    { href: 'reservations.html',    label: 'Reservations',    icon: 'calendar', page: 'reservations' },
    { href: 'transactions.html',    label: 'Transactions',    icon: 'credit-card', page: 'transactions' },
    { href: 'wishlist.html',        label: 'Wishlist',        icon: 'heart', page: 'wishlist' },
    { href: 'notifications.html',   label: 'Notifications',   icon: 'bell', page: 'notifications', badge: DEMO_DATA.notifications.filter(n=>!n.read).length || 0 },
    { href: 'profile.html',         label: 'Profile',         icon: 'user', page: 'profile' },
  ];

  const adminItems = [
    { href: 'admin-dashboard.html', label: 'Admin Dashboard', icon: 'shield', page: 'admin-dashboard' },
    { href: 'admin-moderation.html',label: 'Moderation',      icon: 'flag', page: 'admin-moderation' },
    { href: 'admin-users.html',     label: 'User Management', icon: 'users', page: 'admin-users' },
    { href: 'admin-analytics.html', label: 'Analytics',       icon: 'bar-chart-2', page: 'admin-analytics' },
  ];

  const sidebarIcons = {
    'grid':        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    'package':     '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    'plus-circle': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    'search':      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    'zap':         '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    'calendar':    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    'credit-card': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    'heart':       '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    'bell':        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    'user':        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    'shield':      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    'flag':        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    'users':       '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'bar-chart-2': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  };

  function renderItems(items) {
    return items.map(item => `
      <a href="${item.href}" class="sidebar-nav-item ${activePage === item.page ? 'active' : ''}"
         aria-current="${activePage === item.page ? 'page' : 'false'}">
        ${sidebarIcons[item.icon] || ''}
        ${escapeHtml(item.label)}
        ${item.badge ? `<span class="badge badge-danger" style="margin-left:auto">${item.badge}</span>` : ''}
      </a>
    `).join('');
  }

  const sidebarContent = `
    <div style="padding:0 var(--space-4) var(--space-4);border-bottom:1px solid var(--border-color);margin-bottom:var(--space-4)">
      <div style="display:flex;align-items:center;gap:var(--space-3)">
        <div class="avatar avatar-md">${escapeHtml((user.initials || (user.name ? user.name.split(' ').filter(Boolean).map(n=>n[0]).join('').slice(0,2) : 'U')))}</div>
        <div style="min-width:0;flex:1">
          <div style="font-size:var(--text-sm);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(user.name || 'Campus Member')}</div>
          <div class="badge badge-primary" style="margin-top:2px">${escapeHtml(user.role || 'student')}</div>
        </div>
      </div>
    </div>
    <nav class="sidebar-nav" aria-label="Dashboard menu">
      <div class="sidebar-nav-group">
        <div class="sidebar-nav-label">Main</div>
        ${renderItems(navItems)}
      </div>
      ${isAdmin ? `<div class="sidebar-nav-group">
        <div class="sidebar-nav-label">Administration</div>
        ${renderItems(adminItems)}
      </div>` : ''}
    </nav>
    <div style="padding:var(--space-4);margin-top:auto;border-top:1px solid var(--border-color)">
      <a href="${root}pages/browse.html" class="btn btn-outline btn-sm" style="width:100%;justify-content:center">
        Explore Resources
      </a>
    </div>`;

  const existingEl = document.getElementById('dashboard-sidebar');
  if (existingEl) {
    existingEl.innerHTML = sidebarContent;
  }

  // Ensure sidebar overlay exists for mobile drawers
  if (typeof document !== 'undefined' && !document.getElementById('sidebar-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', () => {
      document.getElementById('dashboard-sidebar')?.classList.remove('open');
      overlay.classList.remove('active');
      document.getElementById('hamburger')?.classList.remove('open');
    });
    document.body.appendChild(overlay);
  }

  return `<aside class="dashboard-sidebar" id="dashboard-sidebar" role="complementary" aria-label="Dashboard navigation">${sidebarContent}</aside>`;
}

/* ══════════════════════════════════════════════════════════
   PAGE INITIALIZER
   ══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  // Add global loading overlay
  const loadingEl = document.createElement('div');
  loadingEl.id = 'global-loading';
  loadingEl.className = 'loading-overlay hidden';
  loadingEl.innerHTML = '<div class="spinner"></div>';
  loadingEl.setAttribute('aria-label', 'Loading');
  document.body.appendChild(loadingEl);

  // Check for flash messages (e.g. access denied redirect)
  try {
    const flash = sessionStorage.getItem('rx_flash_message');
    if (flash) {
      sessionStorage.removeItem('rx_flash_message');
      const parsed = JSON.parse(flash);
      if (parsed && parsed.text) {
        setTimeout(() => {
          if (parsed.type === 'warning') Toast.warning(parsed.text, 'Access Denied');
          else if (parsed.type === 'error') Toast.error(parsed.text);
          else Toast.success(parsed.text);
        }, 300);
      }
    }
  } catch (_) {}
});

// Expose globals
window.Theme = Theme;
window.Toast = Toast;
window.Modal = Modal;
window.Loading = Loading;
window.Auth = Auth;
window.escapeHtml = escapeHtml;
window.getRootPath = getRootPath;
window.formatCurrency = formatCurrency;
window.timeAgo = timeAgo;
window.formatDate = formatDate;
window.renderStars = renderStars;
window.renderResourceCard = renderResourceCard;
window.getCategoryIcon = getCategoryIcon;
window.toggleWishlist = toggleWishlist;
window.quickAction = quickAction;
window.renderSkeletons = renderSkeletons;
window.renderPagination = renderPagination;
window.renderDashboardSidebar = renderDashboardSidebar;
window.initNavbar = initNavbar;
window.initFooter = initFooter;
