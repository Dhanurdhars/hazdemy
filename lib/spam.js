// Server-side spam defences for the enquiry form: signed form tokens and an email-domain check.
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import { config } from './config.js';

export const MIN_FILL_MS = 3000; // people take longer than this to fill the form in; bots don't
export const MAX_TOKEN_AGE_MS = 2 * 60 * 60 * 1000;

// Signing key: FORM_SECRET if set, otherwise derived from the other server-only secrets,
// otherwise random per process (fine for local dev, where there is only one process).
const key = crypto.createHash('sha256')
  .update(config.formSecret || config.adminPassword || config.redis.token || crypto.randomBytes(32).toString('hex'))
  .update('hz-form-token').digest();
const sign = (data) => crypto.createHmac('sha256', key).update(data).digest('base64url');

/** A token the contact form fetches when it loads: "<issued-at ms>.<nonce>.<signature>". */
export function issueFormToken(now = Date.now()) {
  const data = `${now}.${crypto.randomBytes(9).toString('base64url')}`;
  return `${data}.${sign(data)}`;
}

/** Returns { ok: true, id } or { ok: false, reason: 'invalid' | 'expired' | 'too-fast' }. */
export function checkFormToken(token, now = Date.now()) {
  const [ts, nonce, sig] = String(token || '').split('.');
  if (!ts || !nonce || !sig) return { ok: false, reason: 'invalid' };
  const want = Buffer.from(sign(`${ts}.${nonce}`)), got = Buffer.from(sig);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return { ok: false, reason: 'invalid' };
  const age = now - Number(ts);
  if (!(age >= 0) || age > MAX_TOKEN_AGE_MS) return { ok: false, reason: 'expired' };
  if (age < MIN_FILL_MS) return { ok: false, reason: 'too-fast' };
  return { ok: true, id: nonce };
}

/** False only when DNS clearly says the email domain cannot receive mail; lookup trouble counts as OK. */
export async function emailDomainOk(email) {
  if (!config.dnsCheck) return true;
  const domain = String(email).split('@')[1];
  const lookup = async () => {
    try {
      const mx = await dns.resolveMx(domain);
      return mx.some((r) => r.exchange && r.exchange !== '.'); // "0 ." is a null MX: the domain accepts no mail
    } catch (e) {
      if (e.code !== 'ENODATA' && e.code !== 'ENOTFOUND') return true;
      if (e.code === 'ENOTFOUND') return false;
      try { return (await dns.resolve4(domain)).length > 0; } catch { return false; } // no MX: mail goes to the A record
    }
  };
  return Promise.race([lookup(), new Promise((ok) => setTimeout(() => ok(true), 3000))]);
}
