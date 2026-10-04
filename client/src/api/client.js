/**
 * Central API Client with cold-start detection for Render's 15-minute sleep cycle.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Callbacks for cold start listeners
const listeners = new Set();

export function onServerWakingChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyWaking(isWaking, message = '') {
  listeners.forEach(fn => fn(isWaking, message));
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  let wakingTimer = null;
  let didNotify = false;

  // If request takes longer than 2 seconds, indicate cold start waking state
  wakingTimer = setTimeout(() => {
    didNotify = true;
    notifyWaking(true, '// WAKING SERVER (EST. 30S)...');
  }, 2000);

  try {
    const res = await fetch(url, options);
    clearTimeout(wakingTimer);
    if (didNotify) {
      notifyWaking(false, '');
    }

    if (!res.ok) {
      let errorMsg = `Server error ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) errorMsg = errJson.detail;
        else if (errJson.error) errorMsg = errJson.error;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    // Handle 204 or empty bodies
    if (res.status === 204) return null;
    return await res.json();
  } catch (err) {
    clearTimeout(wakingTimer);
    if (didNotify) {
      notifyWaking(false, '');
    }
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Matches
  getMatches: () => request('/matches'),
  getMatch: (id) => request(`/matches/${id}`),
  saveMatch: (match, renames = {}) =>
    request('/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match, renames })
    }),
  updateMatch: (id, updates) =>
    request(`/matches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }),
  deleteMatch: (id) =>
    request(`/matches/${id}`, {
      method: 'DELETE'
    }),

  // OCR Screenshot Parse
  parseScreenshot: (fileOrBlob) => {
    const formData = new FormData();
    formData.append('file', fileOrBlob);
    return request('/parse', {
      method: 'POST',
      body: formData
    });
  },

  // Aliases
  getAliases: () => request('/aliases'),
  saveAliases: (aliases) =>
    request('/aliases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aliases)
    })
};
