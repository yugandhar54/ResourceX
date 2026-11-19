/**
 * ResourceX – Google Authentication Module (Google Accounts OAuth 2.0 & GIS)
 *
 * Implements:
 * 1. Direct redirect to official Google Accounts (accounts.google.com)
 *    User is presented with Google's account selection page to pick their Google account.
 * 2. Automatic OAuth 2.0 callback processing (?code=... or ?token=...)
 * 3. Secure backend token exchange & user session establishment
 *
 * Client ID: 158657724214-i9d0qhle72cce2bui2gtsin1tc13iif5.apps.googleusercontent.com
 * Project ID: resourcex-515016
 */

const GoogleAuth = (() => {
  const DEFAULT_CLIENT_ID = '158657724214-i9d0qhle72cce2bui2gtsin1tc13iif5.apps.googleusercontent.com';
  const STORAGE_KEY_CLIENT_ID = 'rx_google_client_id';

  /**
   * Retrieve active Google OAuth Client ID
   */
  function getClientId() {
    const configId = (window.CONFIG?.GOOGLE_CLIENT_ID || '').trim();
    if (configId && configId !== 'YOUR_GOOGLE_CLIENT_ID') {
      return configId;
    }
    const stored = (localStorage.getItem(STORAGE_KEY_CLIENT_ID) || '').trim();
    if (stored) return stored;
    return DEFAULT_CLIENT_ID;
  }

  /**
   * Get the current absolute redirect URI for Google OAuth
   */
  function getRedirectUri() {
    if (window.location.protocol === 'file:') {
      return 'http://localhost:8080/pages/login.html';
    }
    return window.location.origin + window.location.pathname;
  }

  /**
   * Decode base64 URL-encoded JWT token payload
   */
  function decodeJwt(token) {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  /**
   * Show a lightweight loading overlay during sign-in
   */
  function showLoadingOverlay(message = 'Redirecting to Google Accounts…') {
    let overlay = document.getElementById('google-loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'google-loading-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        z-index: 10000;
        color: white;
        font-family: inherit;
      `;
      overlay.innerHTML = `
        <div style="background:var(--bg-card, #ffffff);color:var(--text-primary, #111827);padding:24px 32px;border-radius:16px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.3);display:flex;flex-direction:column;align-items:center;gap:14px;max-width:360px;text-align:center">
          <svg width="34" height="34" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <div style="font-weight:600;font-size:15px" id="google-loading-text">${escapeHtml(message)}</div>
          <div class="spinner spinner-sm" style="border-top-color:#4285F4;width:24px;height:24px"></div>
        </div>
      `;
      document.body.appendChild(overlay);
    } else {
      const textEl = document.getElementById('google-loading-text');
      if (textEl) textEl.textContent = message;
      overlay.style.display = 'flex';
    }
    return overlay;
  }

  function hideLoadingOverlay() {
    const overlay = document.getElementById('google-loading-overlay');
    if (overlay) overlay.remove();
  }

  /**
   * Redirect user to official Google Accounts page
   * Forces account chooser (prompt=select_account) so the user selects their account
   */
  function redirectToGoogle() {
    if (window.location.protocol === 'file:') {
      Toast.warning('Google OAuth requires a local HTTP web server (e.g. http://localhost:8080/pages/login.html). Google cannot redirect to file:// URLs.', 'Web Server Required');
      showAccountChooserModal();
      return;
    }

    const clientId = getClientId();
    const redirectUri = getRedirectUri();
    const scope = encodeURIComponent('openid email profile');
    const prompt = 'select_account';

    try {
      sessionStorage.setItem('rx_google_redirect_uri', redirectUri);
      const next = new URLSearchParams(window.location.search).get('next');
      if (next) sessionStorage.setItem('rx_oauth_next', next);
    } catch (_) {}

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&prompt=${prompt}` +
      `&access_type=online`;

    showLoadingOverlay('Redirecting to Google Accounts…');
    window.location.href = googleAuthUrl;
  }

  /**
   * Complete authentication in ResourceX (backend or local demo fallback)
   */
  async function completeSignIn(authPayload) {
    showLoadingOverlay('Signing in with Google…');
    try {
      const result = await API.auth.googleLogin(authPayload);
      Auth.login(result.user, result.token);

      hideLoadingOverlay();
      const userName = result.user.name || result.user.firstName || authPayload.name || authPayload.email;
      Toast.success(`Signed in as ${result.user.email || authPayload.email}`, `Welcome, ${userName}!`);

      let target = './dashboard.html';
      try {
        const storedNext = sessionStorage.getItem('rx_oauth_next');
        if (storedNext) {
          sessionStorage.removeItem('rx_oauth_next');
          target = storedNext;
        } else {
          const next = new URLSearchParams(window.location.search).get('next');
          if (next) target = decodeURIComponent(next);
        }
      } catch (_) {}

      setTimeout(() => {
        window.location.href = target;
      }, 600);

      return true;
    } catch (err) {
      hideLoadingOverlay();
      console.error('[GoogleAuth] Complete sign in error:', err);
      Toast.error(err.message || 'Failed to authenticate with Google.', 'Sign-in Failed');
      return false;
    }
  }

  /**
   * Check if page was loaded via redirect from Google with ?code=... or ?token=...
   */
  async function checkOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const token = urlParams.get('token');
    const userRaw = urlParams.get('user');
    const error = urlParams.get('error');

    // 1. Direct token from server callback redirect
    if (token) {
      window.history.replaceState(null, '', window.location.pathname);
      let userObj = null;
      try { userObj = JSON.parse(decodeURIComponent(userRaw)); } catch (_) {}
      if (userObj) {
        Auth.login(userObj, token);
        Toast.success(`Signed in as ${userObj.email}`, `Welcome back!`);
        setTimeout(() => { window.location.href = './dashboard.html'; }, 600);
        return true;
      }
    }

    // 2. Cancellation or error reported by Google
    if (error) {
      window.history.replaceState(null, '', window.location.pathname);
      console.warn('[GoogleAuth] Google returned error in callback:', error);
      if (error === 'access_denied') {
        Toast.info('Google sign-in was cancelled.', 'Cancelled');
      } else {
        Toast.warning(`Google OAuth error: ${error}`, 'Sign-in Cancelled');
      }
      return false;
    }

    // 3. Authorization Code returned from Google
    if (code) {
      window.history.replaceState(null, '', window.location.pathname);
      showLoadingOverlay('Verifying Google Account…');

      let redirectUri = getRedirectUri();
      try {
        const saved = sessionStorage.getItem('rx_google_redirect_uri');
        if (saved) redirectUri = saved;
      } catch (_) {}

      return await completeSignIn({ code, redirectUri });
    }

    return false;
  }

  /**
   * Google Account Chooser Modal (fallback for file:// protocol or unwhitelisted origins)
   */
  function showAccountChooserModal() {
    const existing = document.getElementById('google-account-modal');
    if (existing) existing.remove();

    const accounts = [
      { name: 'Yugandhar Chandu', email: 'yugandharchandu54@gmail.com', avatarBg: '2563eb' },
      { name: 'Chandu', email: 'chandu05@gmail.com', avatarBg: '0d9488' },
    ];

    const modal = document.createElement('div');
    modal.id = 'google-account-modal';
    modal.className = 'google-modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class="google-modal-dialog" style="max-width:440px">
        <div class="google-modal-header" style="text-align:center;padding:24px 24px 16px;border-bottom:1px solid var(--border-color);position:relative">
          <button type="button" class="google-modal-close" id="google-modal-close" aria-label="Close" style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;color:var(--text-muted)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div style="display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
            <svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
          </div>
          <h3 style="margin:0 0 4px;font-size:18px;font-weight:700;color:var(--text-primary)">Sign in with Google</h3>
          <p style="margin:0;font-size:13px;color:var(--text-secondary)">Choose an account to continue to <strong>ResourceX</strong></p>
        </div>

        <div style="padding:12px 16px">
          <div class="google-accounts-list" style="display:flex;flex-direction:column;gap:8px">
            ${accounts.map(acc => `
              <button type="button" class="google-acc-btn" data-email="${acc.email}" data-name="${acc.name}" style="display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-card);cursor:pointer;width:100%;text-align:left;transition:all 0.15s">
                <div style="width:40px;height:40px;border-radius:50%;background:#${acc.avatarBg};color:#fff;display:grid;place-items:center;font-weight:700;font-size:15px;flex-shrink:0">
                  ${acc.name.charAt(0)}
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:14px;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(acc.name)}</div>
                  <div style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(acc.email)}</div>
                </div>
              </button>
            `).join('')}
          </div>

          <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border-color)">
            <form id="google-custom-email-form">
              <label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;color:var(--text-secondary)">
                Or enter another Google account:
              </label>
              <div style="display:flex;gap:8px">
                <input
                  type="email"
                  id="google-custom-input"
                  class="form-control"
                  style="height:38px;font-size:13px"
                  placeholder="your.email@gmail.com"
                  required
                />
                <button type="submit" class="btn btn-primary btn-sm" style="height:38px;padding:0 16px;white-space:nowrap">
                  Continue →
                </button>
              </div>
            </form>
          </div>
        </div>

        <div style="padding:12px 20px;text-align:center;font-size:11px;color:var(--text-muted);border-top:1px solid var(--border-color)">
          To continue, Google will share your name, email address, and profile picture with ResourceX.
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const dismiss = () => {
      modal.remove();
      document.body.style.overflow = '';
    };

    modal.querySelector('#google-modal-close')?.addEventListener('click', dismiss);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) dismiss();
    });

    modal.querySelectorAll('.google-acc-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const email = btn.getAttribute('data-email');
        const name = btn.getAttribute('data-name');
        dismiss();

        const nameParts = (name || '').trim().split(/\s+/).filter(Boolean);
        await completeSignIn({
          email,
          name,
          firstName: nameParts[0] || 'Campus',
          lastName: nameParts.slice(1).join(' ') || 'User',
          googleId: 'g_' + Math.floor(100000000000 + Math.random() * 900000000000),
          picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff`,
        });
      });
    });

    modal.querySelector('#google-custom-email-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = modal.querySelector('#google-custom-input');
      const email = (input?.value || '').trim();
      if (!email) return;
      dismiss();

      const nameParts = email.split('@')[0].split(/[._-]/).filter(Boolean);
      const first = nameParts[0] ? (nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1)) : 'Campus';
      const last = nameParts[1] ? (nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1)) : 'User';
      const fullName = `${first} ${last}`.trim();

      await completeSignIn({
        email,
        name: fullName,
        firstName: first,
        lastName: last,
        googleId: 'g_' + Math.floor(100000000000 + Math.random() * 900000000000),
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4285F4&color=fff`,
      });
    });
  }

  /**
   * Initialize Google Auth on page
   */
  async function init(options) {
    const opts = typeof options === 'string' ? { buttonId: options } : (options || {});
    const buttonId = opts.buttonId || 'google-signin-btn';

    // 1. Check if returning from Google OAuth redirect callback
    const handled = await checkOAuthCallback();
    if (handled) return;

    // 2. Attach click listener to Google button to trigger redirect to Google Accounts
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        redirectToGoogle();
      });
    }
  }

  return {
    init,
    redirectToGoogle,
    startSignIn: redirectToGoogle,
    showAccountChooserModal,
    checkOAuthCallback,
    getClientId,
  };
})();

window.GoogleAuth = GoogleAuth;
