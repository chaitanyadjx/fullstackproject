/**
 * Verto — Shared API Helper
 * Include this on every page: <script src="/js/api.js"></script>
 *
 * Provides:
 *   API_BASE, api.get(), api.post(), api.put(), api.del()
 *   auth.login(), auth.register(), auth.logout(), auth.getUser(), auth.isLoggedIn()
 *   auth.getToken(), auth.requireAuth(), auth.requireRole()
 */

const API_BASE = '/api/v1';

/* ── Token helpers ────────────────────────────────────────────────────────── */
const TokenStore = {
  get()    { return localStorage.getItem('verto_token'); },
  set(t)   { localStorage.setItem('verto_token', t); },
  clear()  { localStorage.removeItem('verto_token'); localStorage.removeItem('verto_user'); },
  getUser() {
    try { return JSON.parse(localStorage.getItem('verto_user')); }
    catch { return null; }
  },
  setUser(u) { localStorage.setItem('verto_user', JSON.stringify(u)); },
};

/* ── Fetch wrapper ────────────────────────────────────────────────────────── */
const api = {
  async _fetch(method, path, body, isFormData = false) {
    const headers = {};
    const token = TokenStore.get();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };

    if (body) {
      if (isFormData) {
        // Let browser set multipart boundary
        opts.body = body;
      } else {
        headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
    }

    const res = await fetch(`${API_BASE}${path}`, opts);
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(json.message || `Request failed (${res.status})`);
      err.status = res.status;
      err.data   = json;
      throw err;
    }
    return json;
  },

  get(path)                 { return this._fetch('GET',    path); },
  post(path, body, isForm)  { return this._fetch('POST',   path, body, isForm); },
  put(path, body, isForm)   { return this._fetch('PUT',    path, body, isForm); },
  del(path)                 { return this._fetch('DELETE',  path); },
};

/* ── Auth helpers ─────────────────────────────────────────────────────────── */
const auth = {
  isLoggedIn() { return !!TokenStore.get(); },
  getToken()   { return TokenStore.get(); },
  getUser()    { return TokenStore.getUser(); },

  async register({ fullName, email, password }) {
    const res = await api.post('/auth/register', { fullName, email, password });
    return res;
  },

  async login({ email, password }) {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.accessToken) {
      TokenStore.set(res.data.accessToken);
      TokenStore.setUser(res.data.user);
    }
    return res;
  },

  async logout() {
    try { await api.post('/auth/logout'); } catch {}
    TokenStore.clear();
    window.location.href = '/auth/sign-in.html';
  },

  async fetchMe() {
    const res = await api.get('/auth/me');
    if (res.data) TokenStore.setUser(res.data);
    return res.data;
  },

  /** Redirect to sign-in if not logged in */
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/auth/sign-in.html';
      return false;
    }
    return true;
  },

  /** Redirect if user doesn't have one of the specified roles */
  requireRole(...roles) {
    if (!this.requireAuth()) return false;
    const user = this.getUser();
    if (!user || !roles.includes(user.role)) {
      window.location.href = '/discovery/browse.html';
      return false;
    }
    return true;
  },
};

/* ── UI Helpers ───────────────────────────────────────────────────────────── */

/** Show a toast notification */
function showToast(message, type = 'info') {
  let container = document.getElementById('verto-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'verto-toast-container';
    container.style.cssText = 'position:fixed;top:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(container);
  }
  const colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
  const toast = document.createElement('div');
  toast.style.cssText = `padding:14px 24px;border-radius:12px;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:0.9rem;font-weight:600;background:${colors[type] || colors.info};box-shadow:0 4px 20px rgba(0,0,0,.15);transform:translateX(120%);transition:transform .3s ease;`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/** Set button loading state */
function btnLoading(btn, loading = true) {
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = 'Loading…';
    btn.disabled = true;
    btn.style.opacity = '0.7';
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}

/** Format date to readable string */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/** Format number (e.g. 1234 → 1.2K) */
function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n || 0);
}

/** Update nav auth state — call on every page */
function updateNavAuth() {
  const user = auth.getUser();
  // Look for common auth link patterns and update
  document.querySelectorAll('a[href*="sign-in"], a[href*="sign-up"]').forEach(link => {
    if (user) {
      // If user is logged in, change sign-in links to profile/browse
      if (link.href.includes('sign-in')) {
        link.href = '/discovery/browse.html';
        link.textContent = user.fullName || 'Dashboard';
      }
      if (link.href.includes('sign-up')) {
        link.href = '/discovery/browse.html';
        link.textContent = 'Browse';
      }
    }
  });
}

// Auto-run nav update when DOM is ready
document.addEventListener('DOMContentLoaded', updateNavAuth);
