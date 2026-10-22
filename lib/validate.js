const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

/** Validates an enquiry body. Returns { ok, error?, field?, value? }; `field` names the input the error is about. */
export function validateEnquiry(b = {}) {
  const v = {
    first: clean(b.first, 80), last: clean(b.last, 80), email: clean(b.email, 160).toLowerCase(),
    company: clean(b.company, 160), phone: clean(b.phone, 40), course: clean(b.course, 40),
    subject: clean(b.subject, 1500), notes: clean(b.notes, 4000), website: clean(b.website, 200),
  };
  const fail = (field, error) => ({ ok: false, field, error });
  for (const [field, label] of [['first', 'first'], ['last', 'last']]) {
    if (!v[field]) return fail(field, `Please enter your ${label} name.`);
    if (!realName(v[field])) return fail(field, `Please enter your real ${label} name.`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) return fail('email', 'Please enter a valid work email.');
  const email = emailProblem(v.email);
  if (email) return fail('email', email);
  if (v.phone && !realPhone(v.phone)) return fail('phone', 'Please enter your real phone number (7 to 15 digits).');
  if (!v.subject) return fail('subject', 'Please tell us what you would like to know.');
  for (const [field, text] of [['company', v.company], ['subject', v.subject], ['notes', v.notes]]) {
    const what = field === 'company' ? 'company name' : 'message';
    if (LINK.test(text)) return fail(field, `Please remove website links from your ${what}.`);
    if (HTML.test(text)) return fail(field, `Please remove HTML code from your ${what}.`);
    if (SPAM_WORDS.test(text)) return fail(field, field === 'company' ? 'Please enter your real company name.' : 'This looks like spam — please describe your training needs.');
  }
  return { ok: true, value: v };
}

// ---- spam and fake-entry checks (shared by the contact form and the API) ----
const LINK = /https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|io|co|biz|info|ru|xyz|top|site|online)\/\S/i;
const HTML = /<\/?[a-z][^>]*>|\[\/?(?:url|link|img)/i;
const SPAM_WORDS = /\b(?:seo|casino|crypto(?:currency)?|bitcoin|forex|viagra|cialis|porn|escort|backlinks?|betting|gambling|payday loans?)\b/i;

const FAKE_NAMES = new Set(['test', 'testing', 'tester', 'fake', 'asdf', 'qwerty', 'sample', 'demo', 'dummy', 'abc', 'xyz', 'foo', 'bar',
  'null', 'undefined', 'none', 'na', 'n/a', 'anonymous', 'unknown', 'name', 'first', 'last', 'firstname', 'lastname', 'user', 'admin']);
const KEYBOARD = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
/** A name needs letters, no digits/links/markup, no placeholder words, no "aaaa" and no keyboard mashing. */
function realName(s) {
  const n = s.toLowerCase();
  if (!/\p{L}/u.test(n) || /[\d<>@]|https?:|www\./.test(n)) return false;
  if (FAKE_NAMES.has(n.replace(/[.\s]+$/, ''))) return false;
  if (/(\p{L})\1\1/u.test(n)) return false; // same letter 3 times in a row
  const letters = n.replace(/[^a-z]/g, '');
  // keyboard mashing: 5 keys in a row ("sdfghjk"), or a whole name of 4 ("qwer"); 4 alone would catch "Doherty"
  if (KEYBOARD.some((row) => [...Array(row.length - 3).keys()].some((i) => letters === row.slice(i, i + 4) || letters.includes(row.slice(i, i + 5))))) return false;
  if (/^[a-z]{5,}$/.test(n) && !/[aeiouy]/.test(n)) return false; // "sdfghjk", "xkcd" style strings
  return true;
}

/** 7–15 digits, and not all one digit ("0000000") or a straight run ("1234567"), with or without a "+<code> " prefix. */
function realPhone(s) {
  if (!/^[0-9+()\-\s.]+$/.test(s)) return false;
  const d = s.replace(/\D/g, '');
  const local = s.replace(/^\+\d{1,4}\s+/, '').replace(/\D/g, ''); // the number after the dialling code
  const fake = (n) => /^(\d)\1+$/.test(n) || '01234567890123456789'.includes(n) || '98765432109876543210'.includes(n);
  return d.length >= 7 && d.length <= 15 && local.length >= 4 && !fake(d) && !fake(local);
}

// Personal mail providers. These are personal under every country ending (gmail.com, yahoo.co.in, hotmail.co.uk …);
const PERSONAL = new Set(['gmail', 'googlemail', 'yahoo', 'ymail', 'rocketmail', 'outlook', 'hotmail', 'live', 'msn', 'aol', 'icloud',
  'protonmail', 'gmx', 'yandex', 'rediffmail']);
// these are listed exactly, because the same company's other domains are work addresses (orange.com, att.com, zoho.com …).
const PERSONAL_DOMAINS = new Set(['me.com', 'mac.com', 'mail.com', 'mail.ru', 'inbox.ru', 'list.ru', 'bk.ru', 'proton.me', 'pm.me',
  'zohomail.com', 'zohomail.in', 'tutanota.com', 'tuta.io', 'fastmail.com', 'hushmail.com', 'inbox.com', 'web.de', 'freenet.de',
  't-online.de', 'free.fr', 'orange.fr', 'wanadoo.fr', 'laposte.net', 'libero.it', 'virgilio.it', 'qq.com', '163.com', '126.com',
  'sina.com', 'naver.com', 'daum.net', 'btinternet.com', 'sky.com', 'comcast.net', 'verizon.net', 'att.net', 'sbcglobal.net', 'cox.net']);
const DISPOSABLE = new Set(['mailinator.com', 'mailinator.net', 'mailinator2.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamailblock.com', 'grr.la', 'sharklasers.com', 'spam4.me', 'pokemail.net',
  '10minutemail.com', '10minutemail.net', '10minutemail.co.uk', '20minutemail.com', 'tempmail.com', 'temp-mail.org', 'temp-mail.io',
  'tempmailo.com', 'tempmail.net', 'tempmail.dev', 'tempr.email', 'tempinbox.com', 'tempail.com', 'tmpmail.org', 'tmpmail.net', 'tmails.net',
  'yopmail.com', 'yopmail.net', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf', 'trashmail.com', 'trashmail.net', 'trashmail.de', 'trash-mail.com',
  'getnada.com', 'nada.email', 'dispostable.com', 'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com', 'fakemail.net', 'mailnesia.com',
  'mintemail.com', 'emailondeck.com', 'moakt.com', 'moakt.cc', 'mohmal.com', 'burnermail.io', 'spamgourmet.com', 'mailcatch.com',
  'discard.email', 'discardmail.com', 'mytemp.email', 'mytrashmail.com', 'mailpoof.com', 'mailtothis.com', 'mail-temp.com', 'mailtemp.net',
  'emailfake.com', 'fakemailgenerator.com', 'armyspy.com', 'cuvox.de', 'dayrep.com', 'einrot.com', 'fleckens.hu', 'gustr.com', 'jourrapide.com',
  'rhyta.com', 'superrito.com', 'teleworm.us', 'spambox.us', 'spamex.com', 'mailexpire.com', 'incognitomail.org', 'anonbox.net',
  'mailnull.com', 'getairmail.com', 'inboxkitten.com', 'harakirimail.com', 'dropmail.me', 'emltmp.com', '1secmail.com', '1secmail.net',
  'byom.de', 'trbvm.com', 'linshiyouxiang.net', 'mvrht.net', 'sute.jp', 'kurzepost.de', 'objectmail.com', 'proxymail.eu', 'rcpt.at',
  'wegwerfmail.de', 'wegwerfmail.net', 'mailforspam.com', 'spamfree24.org', 'binkmail.com', 'bobmail.info', 'chammy.info', 'safetymail.info']);
const SAMPLE_DOMAINS = new Set(['example.com', 'example.org', 'example.net', 'test.com', 'testing.com', 'domain.com', 'email.com', 'sample.com',
  'company.com', 'yourcompany.com', 'mycompany.com', 'acme.com', 'abc.com', 'xyz.com', 'asdf.com', 'fake.com', 'none.com']);
const SAMPLE_USERS = new Set(['test', 'testing', 'tester', 'fake', 'asdf', 'qwerty', 'sample', 'example', 'demo', 'dummy', 'abc', 'xyz', 'foo',
  'noreply', 'no-reply', 'nobody', 'null', 'email', 'name', 'user', 'someone']);

/** Why an email can't be used, or '' if it's fine. (The API also checks the domain can receive mail.) */
export function emailProblem(email) {
  const [user, domain = ''] = String(email).toLowerCase().split('@');
  if (SAMPLE_USERS.has(user) || SAMPLE_DOMAINS.has(domain) || /\.(?:test|example|invalid|localhost)$/.test(domain)) return 'Please enter your real work email, not a sample address.';
  if ([...DISPOSABLE].some((d) => domain === d || domain.endsWith('.' + d))) return 'Temporary email addresses are not accepted — please use your work email.';
  const m = domain.match(/^([a-z0-9-]+)\.(?:[a-z]{2,3})(?:\.[a-z]{2})?$/);
  if ((m && PERSONAL.has(m[1])) || PERSONAL_DOMAINS.has(domain)) return 'Please use your work email — personal addresses like Gmail, Yahoo or Outlook are not accepted.';
  return '';
}

export const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
