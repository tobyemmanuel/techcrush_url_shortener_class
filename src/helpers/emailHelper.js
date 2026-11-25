import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * With SMTP_HOST set, emails are really sent.
 * Without it, nothing leaves your machine. The email is printed to the log instead,
 * so you can copy the verification or reset link while developing.
 */
const usingSmtp = Boolean(env.email.host);

const transporter = usingSmtp
  ? nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      auth: env.email.user ? { user: env.email.user, pass: env.email.pass } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const wrapHtml = (heading, bodyHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #222;">
    <h2>${heading}</h2>
    ${bodyHtml}
    <p style="color: #777; font-size: 12px; margin-top: 32px;">
      If you did not expect this email, you can safely ignore it.
    </p>
  </div>`;

const button = (href, label) =>
  `<p><a href="${href}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;">${label}</a></p>
   <p style="font-size:12px;color:#555;">Or copy this link into your browser:<br>${href}</p>`;

export async function sendEmail({ to, subject, text, html }) {
  const info = await transporter.sendMail({ from: env.email.from, to, subject, text, html });

  if (usingSmtp) {
    logger.info('Email sent', { to, subject, messageId: info.messageId });
  } else {
    logger.info(`[DEV EMAIL] to=${to} subject="${subject}"\n${text}`);
  }
}

export async function sendVerificationEmail(user, token) {
  // This link calls the API directly, so verification works without a frontend.
  const link = `${env.baseUrl}/api/v1/auth/verify-email?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: 'Verify your email address',
    text: `Hello ${user.name},\n\nPlease verify your email address by opening this link (valid for 24 hours):\n${link}\n`,
    html: wrapHtml(
      'Verify your email',
      `<p>Hello ${escapeHtml(user.name)}, please confirm your email address. This link is valid for 24 hours.</p>${button(link, 'Verify email')}`,
    ),
  });
}

export async function sendPasswordResetEmail(user, token) {
  // This link opens the frontend, which then calls POST /api/v1/auth/reset-password.
  const link = `${env.clientUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: 'Reset your password',
    text: `Hello ${user.name},\n\nUse this link to choose a new password (valid for 1 hour):\n${link}\n\nReset token: ${token}\n`,
    html: wrapHtml(
      'Reset your password',
      `<p>Hello ${escapeHtml(user.name)}, use the button below to choose a new password. This link is valid for 1 hour.</p>${button(link, 'Reset password')}`,
    ),
  });
}

export async function sendPasswordChangedEmail(user) {
  await sendEmail({
    to: user.email,
    subject: 'Your password was changed',
    text: `Hello ${user.name},\n\nThe password on your account was just changed. If this was not you, reset your password immediately.\n`,
    html: wrapHtml(
      'Password changed',
      `<p>Hello ${escapeHtml(user.name)}, the password on your account was just changed. If this was not you, reset your password immediately.</p>`,
    ),
  });
}
