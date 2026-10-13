import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
async function main() {
  const dir = path.join(__dirname, '..', '..', 'migrations');
  const files = (await fs.readdir(dir)).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    console.log(`Applying ${f}...`);
    await pool.query(await fs.readFile(path.join(dir, f), 'utf8'));
  }
  console.log('Migrations complete.');
  await pool.end();
}
main().catch(err => { console.error(err); process.exit(1); });
