/**
 * ResourceX – Google Authentication Module (Official Google OAuth 2.0)
 *
 * Implements the official Google OAuth 2.0 redirect flow:
 * 1. User clicks "Continue with Google".
 * 2. Redirects to https://accounts.google.com/o/oauth2/v2/auth with prompt=select_account
 *    which opens official Google displaying all signed-in Google emails.
 * 3. After the user selects their account, Google redirects back with #access_token=...
 * 4. The page queries https://www.googleapis.com/oauth2/v3/userinfo to retrieve the
 *    official Google email, name, and profile picture.
 * 5. Authenticates/registers the user in ResourceX and redirects to the dashboard.
 */

const GoogleAuth = (() => {
  const STORAGE_KEY_CLIENT_ID = 'rx_google_client_id';

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
    return '';
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
   * Get the current absolute redirect URI for Google OAuth callback
   */
  function getRedirectUri() {
    // Strips hash and query params to match Google Console authorized redirect URI
    return window.location.origin + window.location.pathname;
  }

  /**
   * Show a lightweight loading overlay during profile retrieval
   */
  function showLoadingOverlay(message = 'Signing in with your Google Account…') {
    let overlay = document.getElementById('google-loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'google-loading-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.7);
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
        animation: googleFadeIn 0.2s ease-out;
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
   * Redirect user to official Google accounts sign-in page
   */
  function redirectToGoogle(clientId) {
    const id = clientId || getClientId();
    if (!id) {
      showConfigModal();
      return;
    }

    const redirectUri = getRedirectUri();
    const scope = encodeURIComponent('openid email profile');
    const prompt = 'select_account'; // Forces official Google account chooser

    // Official Google OAuth 2.0 authorization endpoint
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

    // Parse hash parameters
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const error = params.get('error');

    // Clean hash from browser address bar immediately for security & clean URL
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    if (error) {
      Toast.error('Google authorization was cancelled or failed: ' + error, 'Google Sign-In');
      return false;
    }

    if (!accessToken) return false;

    showLoadingOverlay('Verifying Google Account…');

    try {
      // Query official Google userinfo endpoint with the verified access token
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

      // Complete authentication with the backend / local storage
      const result = await API.auth.googleLogin({
        email: googleUser.email,
        name: googleUser.name || `${googleUser.given_name || ''} ${googleUser.family_name || ''}`.trim(),
        firstName: googleUser.given_name || '',
        lastName: googleUser.family_name || '',
        picture: googleUser.picture || '',
        googleId: googleUser.sub || '',
      });

      Auth.login(result.user, result.token);

      hideLoadingOverlay();
      const userName = result.user.name || result.user.firstName || googleUser.email;
      Toast.success(`Signed in as ${googleUser.email}`, `Welcome, ${userName}!`);

      setTimeout(() => {
        const next = new URLSearchParams(window.location.search).get('next');
        const target = next ? decodeURIComponent(next) : './dashboard.html';
        window.location.href = target;
      }, 700);

      return true;
    } catch (err) {
      hideLoadingOverlay();
      console.error('[GoogleAuth] OAuth callback error:', err);
      Toast.error(err.message || 'Failed to authenticate with Google.', 'Sign-in Failed');
      return false;
    }
  }

  /**
   * Modal to input or configure Google OAuth Client ID
   */
  function showConfigModal() {
    // Remove any existing modal
    const existing = document.getElementById('google-config-modal');
    if (existing) existing.remove();

    const redirectUri = getRedirectUri();
    const currentId = getClientId();

    const modal = document.createElement('div');
    modal.id = 'google-config-modal';
    modal.className = 'google-modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class="google-modal-dialog" style="max-width:480px">
        <div class="google-modal-header">
          <button type="button" class="google-modal-close" id="google-config-close" aria-label="Close dialog">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div class="google-modal-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
          </div>
          <h3 class="google-modal-title">Official Google Sign-In</h3>
          <p class="google-modal-subtitle">Redirect to <strong>accounts.google.com</strong> to choose your email</p>
        </div>

        <div style="padding:20px">
          <p style="font-size:13px;line-height:1.5;color:var(--text-secondary);margin:0 0 14px">
            To redirect to Google and show your real Google accounts, enter your <strong>Google OAuth 2.0 Client ID</strong> below:
          </p>

          <form id="google-config-form">
            <div class="form-group" style="margin-bottom:14px">
              <label class="form-label" for="google-client-id-input" style="font-size:12px;font-weight:600">
                Google Client ID <span class="required">*</span>
              </label>
              <input
                type="text"
                id="google-client-id-input"
                class="form-control"
                placeholder="xxxx.apps.googleusercontent.com"
                value="${escapeHtml(currentId)}"
                required
                style="height:40px;font-size:13px;font-family:monospace"
                autofocus
              />
            </div>

            <div style="background:var(--bg-secondary,#f8fafc);border:1px solid var(--border-color,#e2e8f0);border-radius:8px;padding:12px;margin-bottom:16px;font-size:11px;line-height:1.45;color:var(--text-muted)">
              <div style="font-weight:600;color:var(--text-primary);margin-bottom:4px">
                Authorized Redirect URI for your Google Console:
              </div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
                <code style="background:var(--bg-card,#fff);padding:3px 6px;border-radius:4px;border:1px solid var(--border-color,#cbd5e1);word-break:break-all;font-size:11px;color:var(--primary);flex:1" id="copy-uri-val">${escapeHtml(redirectUri)}</code>
                <button type="button" class="btn btn-outline btn-sm" id="copy-uri-btn" style="padding:3px 8px;font-size:10px;height:26px">
                  Copy
                </button>
              </div>
            </div>

            <div style="display:flex;gap:10px;justify-content:flex-end;align-items:center">
              <button type="button" class="btn btn-ghost btn-sm" id="google-config-cancel">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="display:flex;align-items:center;gap:6px">
                <span>Save &amp; Redirect to Google</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </form>
        </div>

        <div class="google-modal-footer" style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px">
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style="color:var(--primary);text-decoration:underline">
            Google Cloud Console ↗
          </a>
          <span>Official Google OAuth 2.0</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Close handlers
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

    // Copy URI handler
    const copyBtn = modal.querySelector('#copy-uri-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(redirectUri).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1800);
      });
    });

    // Form submit: save client id and redirect to Google
    modal.querySelector('#google-config-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredId = modal.querySelector('#google-client-id-input').value.trim();
      if (!enteredId) {
        Toast.error('Please enter a valid Google OAuth Client ID.', 'Required');
        return;
      }
      saveClientId(enteredId);
      dismiss();
      redirectToGoogle(enteredId);
    });
  }

  /**
   * Initialize Google Auth on a specific button (e.g. #google-signin-btn)
   */
  async function init(buttonId) {
    // 1. First, check if the user is returning from a Google OAuth redirect
    const handled = await checkOAuthCallback();
    if (handled) return;

    // 2. Attach click listener to button
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      const clientId = getClientId();
      if (!clientId) {
        // Show setup modal so user can paste their Google Client ID and immediately redirect
        showConfigModal();
      } else {
        // Immediately redirect to official Google account chooser
        redirectToGoogle(clientId);
      }
    });
  }

  return {
    init,
    redirectToGoogle,
    showConfigModal,
    checkOAuthCallback,
    getClientId,
    saveClientId,
  };
})();

window.GoogleAuth = GoogleAuth;
