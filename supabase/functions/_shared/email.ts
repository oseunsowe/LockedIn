// Shared SMTP sender for every Edge Function that emails the waitlist (TODO.md Phase 18).
// Uses `npm:nodemailer` directly in Deno — the exact pattern Supabase's own official
// `send-email-smtp` example uses, not the older `denomailer` approach some blog posts still show.
//
// Real constraint, confirmed via Supabase's own docs, not assumed: Edge Functions run on
// infrastructure that blocks outbound connections on ports 25 and 587. Port 465 (implicit TLS)
// works — which is exactly what the SMTP_PORT secret is set to, matching the cPanel/Namecheap
// mailbox (no-reply@lockedinmission.app) created for this.

import nodemailer from 'npm:nodemailer@^9';

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransport() {
  if (transport) return transport;
  transport = nodemailer.createTransport({
    host: Deno.env.get('SMTP_HOSTNAME')!,
    port: Number(Deno.env.get('SMTP_PORT')!),
    secure: Deno.env.get('SMTP_SECURE') === 'true',
    auth: {
      user: Deno.env.get('SMTP_USERNAME')!,
      pass: Deno.env.get('SMTP_PASSWORD')!,
    },
  });
  return transport;
}

export async function sendMail(params: { to: string; subject: string; html: string }): Promise<void> {
  const transport = getTransport();
  await new Promise<void>((resolve, reject) => {
    transport.sendMail(
      {
        from: Deno.env.get('SMTP_FROM')!,
        to: params.to,
        subject: params.subject,
        html: params.html,
      },
      (error: unknown) => {
        if (error) reject(error);
        else resolve();
      },
    );
  });
}
