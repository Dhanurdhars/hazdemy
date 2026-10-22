// GET /api/health — quick status check (storage, email, admin)
import { storageKind } from '../lib/store.js';
import { verifyMail } from '../lib/mailer.js';
import { config } from '../lib/config.js';
import { send } from '../lib/http.js';

export default async function handler(req, res) {
  send(res, 200, { ok: true, storage: storageKind(), mail: await verifyMail(), admin: Boolean(config.adminPassword), time: new Date().toISOString() });
}
