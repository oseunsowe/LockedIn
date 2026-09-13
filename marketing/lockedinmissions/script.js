// Waitlist signup — writes to the same Supabase project that backs the LockedIn app itself
// (supabase/migrations/20260912085808_waitlist_signups.sql). The publishable key below is meant
// to be public — it's the exact same key already shipped inside the app bundle — and the
// `waitlist_signups` table's only RLS policy is a scoped anonymous INSERT with no SELECT, so this
// key can add an email but can never read the list back out.
const SUPABASE_URL = 'https://usqukqpgwexwjiglhpdj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_prtebrryT7htgxbglRYNgA_nxDZM3-k';

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const form = document.getElementById('waitlist-form');
const emailInput = document.getElementById('email');
const honeypotInput = document.getElementById('company');
const submitButton = document.getElementById('waitlist-submit');
const statusEl = document.getElementById('waitlist-status');

function setStatus(message, state) {
  statusEl.textContent = message;
  if (state) {
    statusEl.setAttribute('data-state', state);
  } else {
    statusEl.removeAttribute('data-state');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Honeypot tripped — a real visitor never fills a field that's hidden and unreachable by
  // keyboard tab order. Pretend success without ever calling the database.
  if (honeypotInput.value.trim() !== '') {
    setStatus("You're on the list! We'll email you the moment LockedIn launches.", 'success');
    form.reset();
    return;
  }

  const email = emailInput.value.trim();

  // Belt-and-suspenders on top of the input's native required/type="email": some browsers allow
  // submission on Enter before native validation UI shows, and this gives a styled inline error
  // that matches the rest of the form's success/error states instead of only the browser's
  // built-in tooltip.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setStatus('Enter a valid email address.', 'error');
    emailInput.focus();
    return;
  }

  const platform = form.querySelector('input[name="platform"]:checked')?.value ?? null;

  submitButton.disabled = true;
  setStatus('Joining…');

  const { error } = await client
    .from('waitlist_signups')
    .insert({ email, platform_interest: platform });

  submitButton.disabled = false;

  if (error) {
    // 23505 = unique_violation — this email is already on the list. That reads as success to
    // the person submitting it, not an error; they don't need to know the row already existed.
    if (error.code === '23505') {
      setStatus("You're already on the list. Check your inbox to confirm, or check your spam folder.", 'success');
      form.reset();
      return;
    }
    setStatus("Something went wrong. Please try again in a moment.", 'error');
    return;
  }

  // Fire-and-forget: the signup already succeeded (the row above proves it), so a slow or failed
  // confirmation email shouldn't block the success message the visitor sees.
  void client.functions.invoke('send-waitlist-confirmation', { body: { email } });

  setStatus("Almost there! Check your inbox to confirm your email.", 'success');
  form.reset();
});
