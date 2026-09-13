// LockedIn-branded HTML email templates (TODO.md Phase 18). Table-based layout with every style
// inlined — email clients don't reliably support external stylesheets or modern CSS, so this
// deliberately doesn't reuse the marketing site's style.css. Colors match the app's real tokens
// (app/src/theme/colors.ts) exactly; fonts fall back to system stacks since web-font support in
// email clients is inconsistent.

const WRAPPER_OPEN = `
<body style="margin:0;padding:0;background-color:#050508;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#050508;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#0f0f1e;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td style="padding:32px 32px 0;">
              <span style="font-size:20px;font-weight:700;color:#ffffff;">Locked<span style="color:#a78bfa;">In</span></span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;">
`;

const WRAPPER_CLOSE = `
            </td>
          </tr>
        </table>
        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.4);margin:20px 0 0;">
          LockedIn &middot; you're receiving this because you joined the waitlist at lockedinmission.app
        </p>
      </td>
    </tr>
  </table>
</body>
`;

function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:999px;background:linear-gradient(90deg,#6365f1,#8b52f6);">
    <a href="${url}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;border-radius:999px;">${label}</a>
  </td></tr></table>`;
}

export function confirmationEmail(confirmUrl: string): { subject: string; html: string } {
  const subject = 'Confirm your email for LockedIn';
  const html = `${WRAPPER_OPEN}
    <h1 style="font-size:22px;color:#ffffff;margin:0 0 12px;">One more step</h1>
    <p style="font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7);margin:0 0 8px;">
      Confirm your email and you're on the list &mdash; we'll send exactly one email, the day
      LockedIn launches on Google Play. Nothing before that.
    </p>
    ${button(confirmUrl, 'Confirm my email')}
    <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0;">
      Didn't sign up for this? Ignore this email and you won't hear from us.
    </p>
  ${WRAPPER_CLOSE}`;
  return { subject, html };
}

export function newsletterEmail(
  subject: string,
  bodyHtml: string,
  unsubscribeUrl: string,
): { subject: string; html: string } {
  const html = `${WRAPPER_OPEN}
    <div style="font-size:15px;line-height:1.6;color:rgba(255,255,255,0.85);">
      ${bodyHtml}
    </div>
    <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:24px 0 0;">
      <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.4);">Unsubscribe</a> from
      LockedIn emails at any time.
    </p>
  ${WRAPPER_CLOSE}`;
  return { subject, html };
}
