import pg from 'pg'; import fs from 'node:fs';
const [db, ...files] = process.argv.slice(2);
const admin = new pg.Client({ host: '/tmp/pgtest', port: 55432, user: 'postgres', database: 'postgres' });
await admin.connect();
await admin.query(`DROP DATABASE IF EXISTS ${db}`); await admin.query(`CREATE DATABASE ${db}`); await admin.end();
const c = new pg.Client({ host: '/tmp/pgtest', port: 55432, user: 'postgres', database: db });
await c.connect();
for (const f of files) {
  try { await c.query(fs.readFileSync(f, 'utf8')); console.log('OK  ', f.split('/').pop()); }
  catch (e) { console.log('ERRO', f.split('/').pop(), '→', e.message, e.position ? '@' + e.position : ''); process.exitCode = 1; break; }
}
await c.end();
