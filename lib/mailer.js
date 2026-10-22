// Email through any SMTP mailbox (Microsoft 365, Google Workspace, Zoho, cPanel…). Skipped if SMTP_HOST is empty.
import nodemailer from 'nodemailer';
import { config } from './config.js';

let transport;
const getTransport = () => {
  if (!config.mail.host) return null;
  transport ||= nodemailer.createTransport({
    host: config.mail.host, port: config.mail.port, secure: config.mail.secure,
    auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
  return transport;
};
export const mailEnabled = () => Boolean(config.mail.host);

export async function sendMail(msg) {
  const t = getTransport();
  if (!t) return { skipped: true };
  return t.sendMail({ from: config.mail.from, ...msg });
}
export async function verifyMail() {
  const t = getTransport();
  if (!t) return 'disabled';
  try { await t.verify(); return 'ok'; } catch (e) { return `error: ${e.message}`; }
}
