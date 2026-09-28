import { getAttribution, track } from './analytics.js';
import { SUPABASE_URL, restHeaders } from './config.js';

/*
 * Waitlist form state machine:
 *   idle -> focused -> validating -> (invalid | submitting) -> (success | duplicate | server_error)
 * `data-state` on the form drives styling; the status line is an aria-live region.
 */
const form = document.getElementById('waitlist-form');
if (form) {
  const section = document.getElementById('early-access');
  const email = document.getElementById('email');
  const honeypot = document.getElementById('company');
  const button = document.getElementById('waitlist-submit');
  const status = document.getElementById('waitlist-status');
  const successPanel = document.getElementById('waitlist-success');

  let started = false;

  function setState(state, message = '') {
    form.dataset.state = state;
    form.setAttribute('aria-busy', String(state === 'submitting'));
    status.textContent = message;
    email.setAttribute('aria-invalid', state === 'invalid' ? 'true' : 'false');
  }

  function finish() {
    setState('success');
    section.dataset.done = 'true';
    form.reset();
    successPanel.setAttribute('tabindex', '-1');
    successPanel.focus({ preventScroll: true });
  }

  email.addEventListener('focus', () => {
    if (form.dataset.state === 'idle') setState('focused');
    if (!started) {
      started = true;
      track('waitlist_form_started');
    }
  });
  email.addEventListener('blur', () => {
    if (form.dataset.state === 'focused') setState('idle');
  });
  email.addEventListener('input', () => {
    if (['invalid', 'server_error', 'duplicate'].includes(form.dataset.state)) setState('focused');
  });

  async function insertSignup(payload, signal) {
    return fetch(`${SUPABASE_URL}/rest/v1/waitlist_signups`, {
      method: 'POST',
      headers: { ...restHeaders, Prefer: 'return=minimal' },
      signal,
      body: JSON.stringify(payload),
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled || section.dataset.done === 'true') return;

    // A hidden field a real visitor never fills: pretend success, never touch the database.
    if (honeypot.value.trim() !== '') {
      finish();
      return;
    }

    setState('validating');
    const address = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address)) {
      setState('invalid', 'Enter a valid email address.');
      email.focus();
      track('waitlist_form_error', { reason: 'invalid_email' });
      return;
    }

    const platform = form.querySelector('input[name="platform"]:checked')?.value ?? null;
    button.disabled = true;
    setState('submitting', 'Joining…');
    track('waitlist_form_submitted', { platform });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const base = { email: address, platform_interest: platform };
      let response = await insertSignup({ ...base, ...getAttribution() }, controller.signal);

      // Attribution columns not migrated yet: retry with the plain payload instead of failing.
      if (response.status === 400) {
        const body = await response.clone().json().catch(() => ({}));
        if (body.code === 'PGRST204' || body.code === '42703') {
          response = await insertSignup(base, controller.signal);
        }
      }

      if (response.ok) {
        // The signup already succeeded; the confirmation email must not block the success state.
        void fetch(`${SUPABASE_URL}/functions/v1/send-waitlist-confirmation`, {
          method: 'POST',
          headers: restHeaders,
          keepalive: true,
          body: JSON.stringify({ email: address }),
        }).catch(() => {});
        track('waitlist_form_success', { platform });
        finish();
        return;
      }

      const body = await response.json().catch(() => ({}));
      if (response.status === 409 || body.code === '23505') {
        setState('duplicate', 'You’re already on the list. Check your inbox to confirm, or your spam folder.');
        track('waitlist_form_success', { platform, duplicate: true });
        return;
      }

      setState('server_error', 'Something went wrong on our side. Please try again in a moment.');
      track('waitlist_form_error', { reason: 'server', status: response.status });
    } catch {
      const timedOut = controller.signal.aborted;
      setState('server_error', timedOut
        ? 'The request took too long. Please try again. If you already joined, we’ll let you know.'
        : 'Couldn’t reach the server. Check your connection and try again.');
      track('waitlist_form_error', { reason: timedOut ? 'timeout' : 'network' });
    } finally {
      window.clearTimeout(timeout);
      button.disabled = false;
    }
  });
  // Enable submission only after its handler is attached.
  email.disabled = false;
  button.disabled = false;
  status.textContent = '';

}
