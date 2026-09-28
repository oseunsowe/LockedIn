import { SUPABASE_URL, restHeaders } from './config.js';

/*
 * First-party analytics: events are inserted into Supabase (landing_events) - no third-party
 * script, no cookies, no fingerprinting. Respects Do Not Track. Everything here fails silently:
 * analytics must never break the page.
 */

const ATTRIBUTION_KEY = 'lim_attribution';
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function safeStorage(kind) {
  try {
    return window[kind];
  } catch {
    return null;
  }
}

/** First-touch UTM attribution, kept for 30 days so it survives navigation and a later return. */
function captureAttribution() {
  const store = safeStorage('localStorage');
  const params = new URLSearchParams(window.location.search);
  const fresh = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) fresh[key] = value.slice(0, 120);
  }

  let saved = null;
  try {
    saved = JSON.parse(store?.getItem(ATTRIBUTION_KEY) ?? 'null');
  } catch {
    saved = null;
  }
  const age = Date.now() - saved?.t;
  const valid = saved && typeof saved === 'object' && !Array.isArray(saved)
    && Number.isFinite(saved.t) && age >= 0 && age < ATTRIBUTION_TTL_MS;

  if (Object.keys(fresh).length > 0 && !valid) {
    const record = {
      t: Date.now(),
      ...fresh,
      referrer: document.referrer ? new URL(document.referrer).hostname.slice(0, 200) : null,
      landing_path: window.location.pathname.slice(0, 200),
    };
    try {
      store?.setItem(ATTRIBUTION_KEY, JSON.stringify(record));
    } catch {
      // Private mode etc. - attribution just won't persist across visits.
    }
    return record;
  }
  if (valid) {
    // Only known attribution fields within database limits may leave storage.
    const clean = { t: saved.t };
    for (const key of [...UTM_KEYS, 'referrer', 'landing_path']) {
      if (typeof saved[key] === 'string') clean[key] = saved[key].slice(0, UTM_KEYS.includes(key) ? 120 : 200);
    }
    return clean;
  }
  return {
    t: Date.now(),
    referrer: document.referrer ? new URL(document.referrer).hostname.slice(0, 200) : null,
    landing_path: window.location.pathname.slice(0, 200),
  };
}

const attribution = captureAttribution();

export function getAttribution() {
  const { t, ...rest } = attribution;
  void t;
  return rest;
}

const optedOut = navigator.doNotTrack === '1' || window.doNotTrack === '1';
const session = safeStorage('sessionStorage');
let sessionId = null;
try {
  sessionId = session?.getItem('lim_sid') ?? null;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    session?.setItem('lim_sid', sessionId);
  }
} catch {
  sessionId = null;
}

let disabled = optedOut;
const seen = new Set();

/** Fire-and-forget event. `once` de-duplicates section views within a page load. */
export function track(event, props = {}, { once = false } = {}) {
  if (disabled) return;
  if (once) {
    if (seen.has(event)) return;
    seen.add(event);
  }
  const { utm_source, utm_medium, utm_campaign, utm_content, utm_term } = attribution;
  fetch(`${SUPABASE_URL}/rest/v1/landing_events`, {
    method: 'POST',
    headers: { ...restHeaders, Prefer: 'return=minimal' },
    keepalive: true,
    body: JSON.stringify({
      event,
      session_id: sessionId,
      path: window.location.pathname.slice(0, 200),
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      props,
    }),
  })
    .then((response) => {
      // Table not created yet (migration pending) or blocked: stop trying for this page view.
      if (response.status === 404 || response.status === 401 || response.status === 403) disabled = true;
    })
    .catch(() => {
      disabled = true;
    });
}
