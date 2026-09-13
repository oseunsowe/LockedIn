// Newsletter dashboard (TODO.md Phase 18). Real Supabase Auth login, but authentication alone
// isn't authorization — every privileged call goes through send-newsletter, which checks the
// `admins` table server-side on every request. A non-admin authenticated user gets a 403 here,
// not just a hidden button.
const client = window.supabase.createClient(
  'https://usqukqpgwexwjiglhpdj.supabase.co',
  'sb_publishable_prtebrryT7htgxbglRYNgA_nxDZM3-k',
);

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');

function showLogin(message) {
  loginView.hidden = false;
  dashboardView.hidden = true;
  if (message) loginStatus.textContent = message;
}

async function showDashboard() {
  loginView.hidden = true;
  dashboardView.hidden = false;
  await loadDashboardData();
}

async function checkAdminAndEnter() {
  const { data, error } = await client.functions.invoke('send-newsletter', { method: 'GET' });
  if (error || !data) {
    await client.auth.signOut();
    showLogin("That account doesn't have dashboard access.");
    return;
  }
  document.getElementById('subscriber-count').textContent = data.confirmedSubscriberCount;
  renderHistory(data.sends ?? []);
  await showDashboard();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginStatus.textContent = 'Signing in…';
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    loginStatus.textContent = error.message;
    return;
  }
  await checkAdminAndEnter();
});

document.getElementById('sign-out').addEventListener('click', async () => {
  await client.auth.signOut();
  showLogin('');
});

function renderHistory(sends) {
  const list = document.getElementById('history-list');
  if (sends.length === 0) {
    list.innerHTML = '<p class="status-text">No newsletters sent yet.</p>';
    return;
  }
  list.innerHTML = sends
    .map(
      (send) => `
      <div class="history-row">
        <div>
          <p class="history-subject">${escapeHtml(send.subject)}</p>
          <p class="history-meta">${new Date(send.created_at).toLocaleString()}</p>
        </div>
        <span class="history-count">${send.recipient_count} sent</span>
      </div>
    `,
    )
    .join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadDashboardData() {
  const { data, error } = await client.functions.invoke('send-newsletter', { method: 'GET' });
  if (error || !data) return;
  document.getElementById('subscriber-count').textContent = data.confirmedSubscriberCount;
  renderHistory(data.sends ?? []);
}

document.getElementById('preview-btn').addEventListener('click', () => {
  const bodyHtml = document.getElementById('body-html').value;
  const section = document.getElementById('preview-section');
  const frame = document.getElementById('preview-frame');
  section.hidden = false;
  const doc = frame.contentDocument;
  doc.open();
  doc.write(`
    <body style="margin:0;padding:0;background-color:#050508;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#050508;padding:32px 16px;">
        <tr><td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#0f0f1e;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
            <tr><td style="padding:32px 32px 0;"><span style="font-size:20px;font-weight:700;color:#ffffff;">Locked<span style="color:#a78bfa;">In</span></span></td></tr>
            <tr><td style="padding:24px 32px 32px;">
              <div style="font-size:15px;line-height:1.6;color:rgba(255,255,255,0.85);">${bodyHtml}</div>
              <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:24px 0 0;"><a href="#" style="color:rgba(255,255,255,0.4);">Unsubscribe</a> from LockedIn emails at any time.</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
  `);
  doc.close();
});

document.getElementById('send-btn').addEventListener('click', async () => {
  const subject = document.getElementById('subject').value.trim();
  const bodyHtml = document.getElementById('body-html').value.trim();
  const statusEl = document.getElementById('compose-status');

  if (!subject || !bodyHtml) {
    statusEl.textContent = 'Subject and body are both required.';
    return;
  }

  const subscriberCount = document.getElementById('subscriber-count').textContent;
  const confirmed = window.confirm(
    `Send "${subject}" to ${subscriberCount} confirmed subscriber(s)? This can't be undone.`,
  );
  if (!confirmed) return;

  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = true;
  statusEl.textContent = 'Sending…';

  const { data, error } = await client.functions.invoke('send-newsletter', {
    method: 'POST',
    body: { subject, bodyHtml },
  });

  sendBtn.disabled = false;

  if (error || !data?.success) {
    statusEl.textContent = (data && data.error) || 'Something went wrong sending the newsletter.';
    return;
  }

  statusEl.textContent = `Sent to ${data.recipientCount} subscriber(s).`;
  document.getElementById('subject').value = '';
  document.getElementById('body-html').value = '';
  document.getElementById('preview-section').hidden = true;
  await loadDashboardData();
});

// On load: if a session already exists (a returning admin), skip straight past the login form.
client.auth.getSession().then(({ data }) => {
  if (data.session) {
    checkAdminAndEnter();
  } else {
    showLogin('');
  }
});
