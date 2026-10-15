import { Resend } from 'resend';

const FROM = process.env.EMAIL_FROM || 'Market Store <onboarding@resend.dev>';

let resend = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendPasswordResetCodeEmail({ to, name, code }) {
  const client = getResend();
  const firstName = (name || '').split(' ')[0] || 'there';

  if (!client) {
    console.log('\n===========================================');
    console.log('  PASSWORD RESET CODE (no email sent)');
    console.log('  To:  ', to);
    console.log('  Code:', code);
    console.log('===========================================\n');
    return { ok: true, devMode: true };
  }

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#111">
      <h1 style="font-size:22px;margin:0 0 8px">Reset your password</h1>
      <p style="color:#555;line-height:1.5">Hi ${firstName},</p>
      <p style="color:#555;line-height:1.5">Use the code below to reset your Market Store password.</p>
      <div style="background:#f3f4f6;border-radius:12px;padding:24px;margin:24px 0;text-align:center">
        <div style="font-size:40px;font-weight:800;letter-spacing:8px;color:#059669;font-family:ui-monospace,monospace">
          ${code}
        </div>
      </div>
      <p style="color:#888;font-size:13px;line-height:1.5">
        This code expires in 15 minutes. If you didn't request this, ignore this email.
      </p>
      <p style="color:#888;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
        Market Store · Mulungushi University · Zambia
      </p>
    </div>
  `;

  try {
    const result = await client.emails.send({
      from: FROM, to,
      subject: 'Your Market Store verification code',
      html
    });
    console.log('Email sent:', result.id);
    return { ok: true, id: result.id };
  } catch (err) {
    console.error('Email send failed:', err);
    return { ok: false, error: err.message };
  }
}
