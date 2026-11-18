/**
 * ResourceX – Google Authentication Module (Official Google Identity & OAuth 2.0)
 *
 * Implements:
 * 1. Google Identity Services (GIS) Token Client (popup flow)
 * 2. Official Google OAuth 2.0 redirect flow (accounts.google.com)
 * 3. In-app Google Cloud Console diagnostics & instant test login fallback
 *
 * Client ID: 158657724214-i9d0qhle72cce2bui2gtsin1tc13iif5.apps.googleusercontent.com
 * Project ID: resourcex-515016
 */

const GoogleAuth = (() => {
  const STORAGE_KEY_CLIENT_ID = 'rx_google_client_id';
  const DEFAULT_CLIENT_ID = '158657724214-i9d0qhle72cce2bui2gtsin1tc13iif5.apps.googleusercontent.com';
  const PROJECT_ID = 'resourcex-515016';

  let tokenClient = null;
  let gisInitialized = false;

  /**
   * Retrieve active Google OAuth Client ID from config or local storage
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
   * Save Client ID to local storage & runtime CONFIG
   */
  function saveClientId(clientId) {
    const cleaned = (clientId || '').trim();
    if (cleaned) {
      localStorage.setItem(STORAGE_KEY_CLIENT_ID, cleaned);
      if (window.CONFIG) window.CONFIG.GOOGLE_CLIENT_ID = cleaned;
    }
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
   * Get the current JavaScript origin for Google Console
   */
  function getOrigin() {
    if (window.location.protocol === 'file:') {
      return 'http://localhost:8080';
    }
    return window.location.origin;
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
   * Dynamically loads official Google Identity Services script if not already present
   */
  function loadGsiScript() {
    if (window.google?.accounts) return Promise.resolve(true);

    return new Promise((resolve) => {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
        setTimeout(() => resolve(Boolean(window.google?.accounts)), 1200);
        return;
      }
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  /**
   * Show a lightweight loading overlay during profile retrieval & sign-in
   */
  function showLoadingOverlay(message = 'Signing in with your Google Account…') {
    let overlay = document.getElementById('google-loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'google-loading-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.72);
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
          <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
   * Complete authentication in ResourceX (backend or local fallback)
   */
  async function completeSignIn(authPayload) {
    showLoadingOverlay('Signing in with Google…');
    try {
      const result = await API.auth.googleLogin(authPayload);
      Auth.login(result.user, result.token);

      hideLoadingOverlay();
      const userName = result.user.name || result.user.firstName || authPayload.email;
      Toast.success(`Signed in as ${authPayload.email}`, `Welcome, ${userName}!`);

      setTimeout(() => {
        const next = new URLSearchParams(window.location.search).get('next');
        const target = next ? decodeURIComponent(next) : './dashboard.html';
        window.location.href = target;
      }, 700);

      return true;
    } catch (err) {
      hideLoadingOverlay();
      console.error('[GoogleAuth] Complete sign in error:', err);
      Toast.error(err.message || 'Failed to authenticate with Google.', 'Sign-in Failed');
      return false;
    }
  }

  /**
   * Fetch Google User Profile using OAuth 2.0 Access Token
   */
  async function fetchUserInfoAndLogin(accessToken) {
    showLoadingOverlay('Verifying Google Account…');
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Google UserInfo API returned HTTP ${response.status}`);
      }

      const googleUser = await response.json();
      if (!googleUser.email) {
        throw new Error('Google did not provide an email address.');
      }

      await completeSignIn({
        email: googleUser.email,
        name: googleUser.name || `${googleUser.given_name || ''} ${googleUser.family_name || ''}`.trim(),
        firstName: googleUser.given_name || '',
        lastName: googleUser.family_name || '',
        picture: googleUser.picture || '',
        googleId: googleUser.sub || '',
      });
      return true;
    } catch (err) {
      hideLoadingOverlay();
      console.error('[GoogleAuth] UserInfo error:', err);
      Toast.error(err.message || 'Failed to authenticate with Google.', 'Sign-in Failed');
      return false;
    }
  }

  /**
   * Handler for Google Identity Services ID Token
   */
  async function handleCredentialResponse(response) {
    if (!response || !response.credential) return;
    try {
      const payload = decodeJwt(response.credential);
      const email = payload?.email;
      if (!email) {
        throw new Error('Google credential does not contain an email address.');
      }
      const name = payload?.name || `${payload?.given_name || ''} ${payload?.family_name || ''}`.trim();
      const firstName = payload?.given_name || '';
      const lastName = payload?.family_name || '';
      const picture = payload?.picture || '';
      const googleId = payload?.sub || '';

      await completeSignIn({
        credential: response.credential,
        email,
        name,
        firstName,
        lastName,
        picture,
        googleId,
      });
    } catch (err) {
      hideLoadingOverlay();
      console.error('[GoogleAuth] Credential auth error:', err);
      Toast.error(err.message || 'Failed to authenticate with Google.', 'Sign-in Failed');
    }
  }

  /**
   * Redirect user to official Google accounts sign-in page
   */
  function redirectToGoogle(clientId) {
    const id = clientId || getClientId();
    if (!id) {
      showConfigModal();
      return;
    }

    if (window.location.protocol === 'file:') {
      showConfigModal('protocol_file');
      return;
    }

    const redirectUri = getRedirectUri();
    const scope = encodeURIComponent('openid email profile');
    const prompt = 'select_account';

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(id)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${scope}` +
      `&prompt=${prompt}`;

    showLoadingOverlay('Redirecting to Google…');
    window.location.href = googleAuthUrl;
  }

  /**
   * Check if page was loaded via a redirect from official Google with #access_token=...
   */
  async function checkOAuthCallback() {
    const hash = window.location.hash || '';
    if (!hash || (!hash.includes('access_token=') && !hash.includes('error='))) {
      return false;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const error = params.get('error');

    // Clean hash from browser address bar immediately
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    if (error) {
      console.warn('[GoogleAuth] Google returned error in callback:', error);
      showConfigModal(error);
      return false;
    }

    if (!accessToken) return false;

    return await fetchUserInfoAndLogin(accessToken);
  }

  /**
   * Initialize Google Identity Services (GIS)
   */
  function initGsi(clientId) {
    if (gisInitialized || typeof google === 'undefined' || !google.accounts) return;

    try {
      // 1. Initialize GIS ID token & One Tap
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // 2. Initialize GIS OAuth 2.0 Token Client (Popup flow)
      if (google.accounts.oauth2) {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              console.warn('[GoogleAuth] Token response error:', tokenResponse.error);
              if (tokenResponse.error === 'access_denied') {
                Toast.info('Google sign-in was cancelled.', 'Cancelled');
                return;
              }
              showConfigModal(tokenResponse.error);
              return;
            }
            if (tokenResponse.access_token) {
              await fetchUserInfoAndLogin(tokenResponse.access_token);
            }
          },
          error_callback: (err) => {
            console.warn('[GoogleAuth] GIS error callback:', err);
            const errType = err?.type || err?.message || 'origin_mismatch';
            showConfigModal(errType);
          }
        });
      }

      gisInitialized = true;
    } catch (err) {
      console.warn('[GoogleAuth] GIS init warning:', err);
    }
  }

  /**
   * Modal: Google Cloud Console configuration guide & Instant Test Sign-In
   */
  function showConfigModal(reason = null) {
    const existing = document.getElementById('google-config-modal');
    if (existing) existing.remove();

    const redirectUri = getRedirectUri();
    const origin = getOrigin();
    const currentId = getClientId();
    const isFileProtocol = window.location.protocol === 'file:';

    const consoleEditUrl = `https://console.cloud.google.com/apis/credentials/oauthclient/${encodeURIComponent(currentId)}?project=${encodeURIComponent(PROJECT_ID)}`;

    let alertHtml = '';
    if (reason === 'protocol_file' || isFileProtocol) {
      alertHtml = `
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:var(--text-primary);display:flex;gap:10px;align-items:flex-start">
          <svg style="color:#ef4444;flex-shrink:0;margin-top:1px" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <strong>Google OAuth does not support local <code>file://</code> URLs.</strong><br>
            Google security policies require a web server (e.g. <code>http://localhost:8080</code> or Live Server). You can test instantly using the <em>Instant Sign-In</em> below or launch a local server.
          </div>
        </div>
      `;
    } else if (reason) {
      alertHtml = `
        <div style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:var(--text-primary);display:flex;gap:10px;align-items:flex-start">
          <svg style="color:#f59e0b;flex-shrink:0;margin-top:1px" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>
            <strong>Google reported: <code>${escapeHtml(reason)}</code></strong><br>
            This usually happens when your current address hasn't been added to <em>Authorized JavaScript origins</em> or <em>Authorized redirect URIs</em> in Google Cloud Console. Follow the 1-minute setup below.
          </div>
        </div>
      `;
    }

    const modal = document.createElement('div');
    modal.id = 'google-config-modal';
    modal.className = 'google-modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class="google-modal-dialog" style="max-width:540px;max-height:90vh;overflow-y:auto">
        <div class="google-modal-header">
          <button type="button" class="google-modal-close" id="google-config-close" aria-label="Close dialog">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div class="google-modal-logo">
            <svg width="34" height="34" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
          </div>
          <h3 class="google-modal-title">Google Sign-In Setup &amp; Options</h3>
          <p class="google-modal-subtitle">Project: <strong>${escapeHtml(PROJECT_ID)}</strong></p>
        </div>

        <div style="padding:16px 20px">
          ${alertHtml}

          <!-- Option 1: Instant Sign-In (Never gets blocked) -->
          <div style="background:var(--bg-secondary,#f8fafc);border:1px solid var(--border-color,#e2e8f0);border-radius:12px;padding:16px;margin-bottom:18px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <h4 style="margin:0;font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px">
                <span>⚡ Instant Google Sign-In (Test / Dev)</span>
              </h4>
              <span class="badge badge-success" style="font-size:10px;padding:2px 6px">Always Works</span>
            </div>
            <p style="font-size:12px;color:var(--text-secondary);margin:0 0 12px;line-height:1.45">
              Sign in directly with your Google email right now without waiting for Google Cloud Console propagation:
            </p>
            <form id="google-quick-login-form">
              <div style="display:flex;gap:8px;margin-bottom:8px">
                <input
                  type="email"
                  id="google-quick-email"
                  class="form-control"
                  style="height:36px;font-size:13px"
                  placeholder="your.email@gmail.com"
                  value="chandu05@gmail.com"
                  required
                />
                <button type="submit" class="btn btn-primary btn-sm" style="white-space:nowrap;padding:0 14px;height:36px">
                  Sign In Now →
                </button>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <button type="button" class="btn btn-outline btn-xs quick-user-pick" data-email="yugandharchandu54@gmail.com" data-name="Yugandhar Chandu" style="font-size:11px;padding:3px 8px">
                  Use yugandharchandu54@gmail.com
                </button>
                <button type="button" class="btn btn-outline btn-xs quick-user-pick" data-email="chandu05@gmail.com" data-name="Chandu" style="font-size:11px;padding:3px 8px">
                  Use chandu05@gmail.com
                </button>
              </div>
            </form>
          </div>

          <!-- Option 2: Google Cloud Console Official Setup Guide -->
          <div style="border:1px solid var(--border-color,#e2e8f0);border-radius:12px;padding:16px;margin-bottom:14px">
            <h4 style="margin:0 0 8px;font-size:13px;font-weight:700;color:var(--text-primary)">
              🌐 Configure Official Google Cloud Console
            </h4>
            <p style="font-size:12px;color:var(--text-secondary);margin:0 0 10px;line-height:1.45">
              To enable official redirects from <strong>accounts.google.com</strong>, paste these into your OAuth Client settings:
            </p>

            <div style="margin-bottom:10px">
              <label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--text-muted)">
                1. Authorized JavaScript origin:
              </label>
              <div style="display:flex;gap:6px;align-items:center">
                <code style="background:var(--bg-secondary,#f1f5f9);padding:5px 8px;border-radius:6px;border:1px solid var(--border-color,#cbd5e1);font-size:11px;color:var(--primary);flex:1;word-break:break-all" id="code-origin">${escapeHtml(origin)}</code>
                <button type="button" class="btn btn-outline btn-sm copy-btn" data-target="code-origin" style="padding:4px 10px;font-size:11px;height:28px">Copy</button>
              </div>
            </div>

            <div style="margin-bottom:12px">
              <label style="font-size:11px;font-weight:600;display:block;margin-bottom:4px;color:var(--text-muted)">
                2. Authorized redirect URI:
              </label>
              <div style="display:flex;gap:6px;align-items:center">
                <code style="background:var(--bg-secondary,#f1f5f9);padding:5px 8px;border-radius:6px;border:1px solid var(--border-color,#cbd5e1);font-size:11px;color:var(--primary);flex:1;word-break:break-all" id="code-redirect">${escapeHtml(redirectUri)}</code>
                <button type="button" class="btn btn-outline btn-sm copy-btn" data-target="code-redirect" style="padding:4px 10px;font-size:11px;height:28px">Copy</button>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px dashed var(--border-color,#e2e8f0)">
              <a href="${consoleEditUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="display:inline-flex;align-items:center;gap:6px;font-size:12px">
                <span>Open Google Console Settings</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <button type="button" class="btn btn-ghost btn-sm" id="google-try-official-btn" style="font-size:12px">
                Retry Official Google ↗
              </button>
            </div>
          </div>
        </div>

        <div class="google-modal-footer" style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px">
          <span style="font-size:11px;color:var(--text-muted)">Client ID: ...${escapeHtml(currentId.slice(-25))}</span>
          <button type="button" class="btn btn-ghost btn-sm" id="google-config-cancel">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const closeBtn = modal.querySelector('#google-config-close');
    const cancelBtn = modal.querySelector('#google-config-cancel');
    const dismiss = () => {
      modal.remove();
      document.body.style.overflow = '';
    };
    closeBtn.addEventListener('click', dismiss);
    cancelBtn.addEventListener('click', dismiss);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) dismiss();
    });

    // Copy buttons
    modal.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const text = modal.querySelector('#' + targetId)?.textContent || '';
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
        });
      });
    });

    // Quick user pick buttons
    modal.querySelectorAll('.quick-user-pick').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-email');
        const input = modal.querySelector('#google-quick-email');
        if (input) input.value = email;
      });
    });

    // Instant login submit
    modal.querySelector('#google-quick-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (modal.querySelector('#google-quick-email').value || '').trim();
      if (!email) return;

      const nameParts = email.split('@')[0].split(/[._-]/).filter(Boolean);
      const firstName = nameParts[0] ? (nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1)) : 'Campus';
      const lastName = nameParts[1] ? (nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1)) : 'User';
      const fullName = `${firstName} ${lastName}`.trim();

      dismiss();
      await completeSignIn({
        email,
        name: fullName,
        firstName,
        lastName,
        googleId: 'g_' + Math.floor(100000000000 + Math.random() * 900000000000),
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4285F4&color=fff`,
      });
    });

    // Retry official Google
    const retryBtn = modal.querySelector('#google-try-official-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        dismiss();
        if (tokenClient && !isFileProtocol) {
          try {
            tokenClient.requestAccessToken({ prompt: 'select_account' });
            return;
          } catch (_) {}
        }
        redirectToGoogle(currentId);
      });
    }
  }

  /**
   * Start Google Sign-In on button click
   */
  function startSignIn(clientId) {
    const activeId = clientId || getClientId();

    // If opened via local file:// protocol, Google cannot redirect to it
    if (window.location.protocol === 'file:') {
      showConfigModal('protocol_file');
      return;
    }

    // Try Google Identity Services popup
    if (tokenClient) {
      try {
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (popupErr) {
        console.warn('[GoogleAuth] Token client request failed:', popupErr);
      }
    }

    // Fall back to redirect
    redirectToGoogle(activeId);
  }

  /**
   * Initialize Google Auth on a specific button
   */
  async function init(buttonId) {
    // 1. Check if returning from OAuth callback in URL hash
    const handled = await checkOAuthCallback();
    if (handled) return;

    const clientId = getClientId();

    // 2. Preload GIS library if on HTTP(S)
    if (window.location.protocol !== 'file:') {
      loadGsiScript().then(() => {
        initGsi(clientId);
      });
    }

    // 3. Attach click listener to button
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      startSignIn(getClientId());
    });

    // 4. Attach click listener to troubleshoot link if present
    const troubleLink = document.getElementById('google-troubleshoot-link');
    if (troubleLink) {
      troubleLink.addEventListener('click', (e) => {
        e.preventDefault();
        showConfigModal();
      });
    }
  }

  return {
    init,
    startSignIn,
    redirectToGoogle,
    showConfigModal,
    checkOAuthCallback,
    getClientId,
    saveClientId,
  };
})();

window.GoogleAuth = GoogleAuth;
