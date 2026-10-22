import { createRequire } from 'node:module';
import { getJSON, setJSON } from './store.js';

// Bundled catalogue (generated from the course sheet) — used until a sheet is uploaded via /admin
const require = createRequire(import.meta.url);
const SEED = require('../src/data/courses.json');

export async function getCatalog() {
  const doc = await getJSON('catalog');
  return doc && Array.isArray(doc.courses) && doc.courses.length ? doc : { updatedAt: null, source: 'bundled', courses: SEED };
}
export async function replaceCatalog(courses, source) {
  const prev = await getJSON('catalog');
  if (prev) await setJSON('catalog:previous', prev);
  const doc = { updatedAt: new Date().toISOString(), source, courses };
  await setJSON('catalog', doc);
  return doc;
}
export const findCourse = async (code) => (await getCatalog()).courses.find((c) => c.code === code) || null;
