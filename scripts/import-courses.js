// Updates the bundled catalogue (src/data/courses.json) from the course sheet — commit + push to redeploy.
// Usage: npm run import -- "path/to/Course_Inventory.xlsx"
// (Once Upstash Redis is connected you can instead upload the sheet on the /admin page — no redeploy needed.)
import fs from 'node:fs';
import path from 'node:path';
import { parseCourseSheet } from '../lib/importSheet.js';

const file = process.argv[2];
if (!file) { console.error('Usage: npm run import -- "path/to/sheet.xlsx"'); process.exit(1); }
const parsed = parseCourseSheet(fs.readFileSync(file));
fs.writeFileSync(path.resolve('src/data/courses.json'), JSON.stringify(parsed.courses));
console.log(`Wrote ${parsed.total} courses (${parsed.available} available now, ${parsed.coming} coming soon) to src/data/courses.json`);
