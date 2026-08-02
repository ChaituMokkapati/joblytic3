/**
 * Notification service — Twilio WhatsApp + Resend Email, with demo fallback.
 */
import { Resend } from 'resend';

const notifyMode = () => (process.env.NOTIFY_MODE || 'demo').toLowerCase();

function hasTwilio() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM
  );
}

function hasResend() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getNotifyStatus() {
  const mode = notifyMode();
  return {
    mode,
    twilioConfigured: hasTwilio(),
    resendConfigured: hasResend(),
    liveCapable: mode === 'live' && (hasTwilio() || hasResend())
  };
}

function buildMessage({ jobTitle, deadline, applyLink, daysLeft, windowDays }) {
  return [
    `⚠️ Joblytic Deadline Alert (${windowDays}-day window)`,
    ``,
    `Job: ${jobTitle}`,
    `Deadline: ${deadline}`,
    `Days remaining: ${daysLeft}`,
    applyLink ? `Apply: ${applyLink}` : null,
    ``,
    `— Joblytic Alert Agent`
  ]
    .filter(Boolean)
    .join('\n');
}

async function sendWhatsApp({ phone, body }) {
  if (!hasTwilio() || !phone) {
    return { channel: 'whatsapp', status: 'skipped', reason: !phone ? 'no phone' : 'twilio not configured' };
  }

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
    const msg = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to,
      body
    });
    return { channel: 'whatsapp', status: 'sent', sid: msg.sid };
  } catch (err) {
    return { channel: 'whatsapp', status: 'error', error: err.message };
  }
}

async function sendEmail({ email, subject, body }) {
  if (!hasResend() || !email) {
    return { channel: 'email', status: 'skipped', reason: !email ? 'no email' : 'resend not configured' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.ALERT_FROM_EMAIL || 'alerts@joblytic.ai';
    const result = await resend.emails.send({
      from,
      to: email,
      subject,
      text: body
    });
    return { channel: 'email', status: 'sent', id: result?.data?.id || result?.id };
  } catch (err) {
    return { channel: 'email', status: 'error', error: err.message };
  }
}

/**
 * Dispatch alert notification. In demo mode, only logs (no external send).
 */
export async function dispatchAlertNotification(payload) {
  const {
    email,
    phone,
    jobTitle,
    deadline,
    applyLink,
    daysLeft,
    windowDays,
    channel = 'Email & WhatsApp'
  } = payload;

  const body = buildMessage({ jobTitle, deadline, applyLink, daysLeft, windowDays });
  const subject = `[Joblytic] ${windowDays}d alert: ${jobTitle}`;
  const status = getNotifyStatus();
  const results = [];

  if (status.mode !== 'live' || !status.liveCapable) {
    console.log('[NOTIFY:DEMO]', { email, phone, subject, windowDays, daysLeft, jobTitle });
    results.push({
      channel: 'demo',
      status: 'logged',
      preview: body.slice(0, 200)
    });
    return {
      mode: 'demo',
      results,
      messageBody: body,
      subject
    };
  }

  const wantsWhatsApp = /whatsapp/i.test(channel) || /sms/i.test(channel);
  const wantsEmail = /email/i.test(channel) || !wantsWhatsApp;

  if (wantsWhatsApp) {
    results.push(await sendWhatsApp({ phone, body }));
  }
  if (wantsEmail) {
    results.push(await sendEmail({ email, subject, body }));
  }

  return { mode: 'live', results, messageBody: body, subject };
}
