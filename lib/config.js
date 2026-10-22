const env = process.env;
export const config = {
  adminPassword: env.ADMIN_PASSWORD || '',
  formSecret: env.FORM_SECRET || '',
  ga: gaConfig(),
  dnsCheck: env.EMAIL_DNS_CHECK !== 'false',
  redis: {
    url: env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || '',
    token: env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || '',
  },
  mail: {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT) || 587,
    secure: env.SMTP_SECURE === 'true',
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.MAIL_FROM || 'Hazdemy Website <no-reply@hazdemy.com>',
    to: (env.CONTACT_TO || 'dhanurdhars@nfolksdata.com').split(',').map((s) => s.trim()).filter(Boolean),
    confirm: env.SEND_CONFIRMATION === 'true',
  },
};

// Google Analytics reporting for /admin: the GA4 property's numeric ID plus a service account key, pasted whole as
// GA_SERVICE_ACCOUNT_JSON (or as GA_CLIENT_EMAIL + GA_PRIVATE_KEY).
function gaConfig() {
  let sa = {};
  try { sa = JSON.parse(env.GA_SERVICE_ACCOUNT_JSON || '{}'); } catch { console.error('[ga] GA_SERVICE_ACCOUNT_JSON is not valid JSON'); }
  return {
    propertyId: String(env.GA_PROPERTY_ID || '').replace(/^properties\//, '').trim(),
    clientEmail: env.GA_CLIENT_EMAIL || sa.client_email || '',
    privateKey: (env.GA_PRIVATE_KEY || sa.private_key || '').replace(/\\n/g, '\n'),
    tokenUrl: env.GA_TOKEN_URL || 'https://oauth2.googleapis.com/token',
    apiBase: env.GA_API_BASE || 'https://analyticsdata.googleapis.com', // both overridable for tests
  };
}
