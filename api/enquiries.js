// GET  /api/enquiries — a signed form token (the contact form fetches one when it loads)
// POST /api/enquiries — checks for spam, validates, saves the enquiry and emails the training team
import crypto from 'node:crypto';
import { hset, overLimit, storageKind } from '../lib/store.js';
import { findCourse } from '../lib/courses.js';
import { validateEnquiry, escHtml } from '../lib/validate.js';
import { issueFormToken, checkFormToken, emailDomainOk } from '../lib/spam.js';
import { sendMail, mailEnabled } from '../lib/mailer.js';
import { config } from '../lib/config.js';
import { allow, send, jsonBody, clientIp } from '../lib/http.js';

// Bots get the same reply as a real submission, so they can't tell they were caught.
const ignore = (res) => send(res, 200, { ok: true });

export default async function handler(req, res) {
  if (!allow(req, res, ['GET', 'POST'])) return;
  if (req.method === 'GET') return send(res, 200, { token: issueFormToken() }, { 'Cache-Control': 'no-store' });
  try {
    const tooMany = () => send(res, 429, { error: 'Too many requests — please try again in a few minutes.' });
    if (await overLimit(`enq-try:${clientIp(req)}`, 20, 600)) return tooMany(); // every attempt, so floods stop early

    let body; try { body = jsonBody(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
    if (body.website) return ignore(res); // honeypot: hidden from people, bots fill it in
    const token = checkFormToken(body.token);
    if (token.reason === 'too-fast') return ignore(res);
    if (!token.ok) return send(res, 400, { error: 'This form has expired — please reload the page and try again.' });

    const check = validateEnquiry(body);
    if (!check.ok) return send(res, 400, { error: check.error });
    const v = check.value;
    if (!(await emailDomainOk(v.email))) return send(res, 400, { error: 'That email domain cannot receive mail — please check your email address.' });

    // Nowhere to deliver it? Tell the browser so it can fall back to the visitor's email app.
    if (storageKind() === 'memory' && !mailEnabled()) return send(res, 503, { error: 'Online enquiries are not set up yet.' });

    // Checked last, so a visitor who hit one of the errors above can fix it and resend with the same token.
    if (await overLimit(`enq:${clientIp(req)}`, 5, 600)) return tooMany(); // enquiries that get through
    if (await overLimit(`enq-email:${v.email}`, 3, 86400)) return send(res, 429, { error: 'You have sent several enquiries today already — we will be in touch soon.' });
    const fingerprint = crypto.createHash('sha256').update([v.email, v.course, v.subject, v.notes].join('\n')).digest('hex');
    if (await overLimit(`enq-dup:${fingerprint}`, 1, 86400)) return ignore(res); // same enquiry again within a day
    if (await overLimit(`enq-token:${token.id}`, 1, 7200)) return ignore(res); // each form token works once

    const course = v.course ? await findCourse(v.course) : null;
    const enquiry = {
      id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'new',
      first: v.first, last: v.last, email: v.email, phone: v.phone, company: v.company,
      courseCode: course?.code || '', courseName: course?.name || '', subject: v.subject, notes: v.notes,
    };
    await hset('enquiries', enquiry.id, enquiry);

    // Serverless functions stop once they respond, so send email first (errors are logged, not shown to the visitor).
    try { await notify(enquiry, course); } catch (e) { console.error('[mail] failed:', e.message); }
    send(res, 201, { ok: true, id: enquiry.id });
  } catch (e) {
    console.error(e); send(res, 500, { error: 'We could not send your enquiry right now.' });
  }
}

async function notify(e, course) {
  if (!mailEnabled()) return;
  const subject = course ? `Details and pricing request: ${course.name} (Course Code: ${course.code})` : `Training enquiry from ${e.first} ${e.last}`;
  const rows = [
    ['Name', `${e.first} ${e.last}`], ['Email', e.email], ['Company', e.company || '—'], ['Work telephone', e.phone || '—'],
    ['Course', course ? `${course.code} — ${course.name} (${course.days ?? '?'} day(s), ${course.level}${course.status === 'coming' ? ', coming soon' : ''})` : 'Not sure / custom program'],
  ];
  const jobs = [sendMail({
    to: config.mail.to, replyTo: e.email, subject,
    text: `${e.subject}\n\n${e.notes ? e.notes + '\n\n' : ''}${rows.map(([k, val]) => `${k}: ${val}`).join('\n')}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#2b0a0b">
      <h2 style="color:#4e0405;margin:0 0 12px">New website enquiry</h2>
      <p style="white-space:pre-line;background:#fbf7f5;border-left:4px solid #8e1b1e;padding:12px">${escHtml(e.subject)}</p>
      ${e.notes ? `<p style="white-space:pre-line"><b>Notes:</b><br>${escHtml(e.notes)}</p>` : ''}
      <table cellpadding="6" style="border-collapse:collapse">${rows.map(([k, val]) => `<tr><td style="color:#8f7471">${k}</td><td><b>${escHtml(val)}</b></td></tr>`).join('')}</table></div>`,
  })];
  if (config.mail.confirm) {
    jobs.push(sendMail({
      to: e.email, subject: 'We received your Hazdemy enquiry',
      text: `Hi ${e.first},\n\nThanks for contacting Hazdemy Learning. We've received your request${course ? ` for ${course.name} (${course.code})` : ''} and will reply with delivery options, availability and a quote shortly.\n\n— Hazdemy Training Team\n${config.mail.to[0] || ''}`,
    }));
  }
  await Promise.all(jobs);
}
