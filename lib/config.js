const env = process.env;
export const config = {
  adminPassword: env.ADMIN_PASSWORD || '',
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
