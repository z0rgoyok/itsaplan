import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { afterAll } from 'bun:test';
import { SQL } from 'bun';
import { extendAuth } from '@repo/auth/extensions';

// better-auth's scrypt is slow by design, and nearly every test creates users, so the tests
// hash with scrypt at its lowest cost. bunfig.toml preloads this file for `bun test` only,
// so the server never hashes this way.
const lowestCost = { N: 2, r: 1, p: 1 };

extendAuth({
  password: {
    hash: async (password) => {
      const salt = randomBytes(16).toString('hex');
      return `${salt}:${scryptSync(password, salt, 32, lowestCost).toString('hex')}`;
    },
    verify: async ({ hash, password }) => {
      const [salt = '', key = ''] = hash.split(':');
      const candidate = scryptSync(password, salt, 32, lowestCost);
      const stored = Buffer.from(key, 'hex');
      return stored.length === candidate.length && timingSafeEqual(stored, candidate);
    },
  },
});

// Every test empties the whole database, so each `bun test --parallel` worker runs on its
// own copy of the migrated test database, made afresh when the worker starts. This runs
// before a test file imports @repo/db, which reads DATABASE_URL once.
const worker = process.env.BUN_TEST_WORKER_ID;
if (worker) {
  const url = new URL(process.env.DATABASE_URL!);
  const template = url.pathname.slice(1);
  if (!/^\d+$/.test(worker) || !/^[A-Za-z0-9_]+$/.test(template) || !template.includes('test')) {
    throw new Error('The test preloader needs a numeric worker id and a safe test database name.');
  }
  // A PID alone can be reused and two suite runs can land on the same worker id.
  // A random run suffix makes every worker's copy private to that test process.
  const copy = `${template}_${worker}_${randomBytes(6).toString('hex')}`;
  url.pathname = '/postgres';
  const adminUrl = url.toString();
  const admin = new SQL(adminUrl);
  await admin.unsafe(`DROP DATABASE IF EXISTS "${copy}" WITH (FORCE)`);
  await admin.unsafe(`CREATE DATABASE "${copy}" TEMPLATE "${template}"`);
  await admin.close();
  url.pathname = `/${copy}`;
  process.env.DATABASE_URL = url.toString();

  afterAll(async () => {
    const cleanup = new SQL(adminUrl);
    try {
      await cleanup.unsafe(`DROP DATABASE IF EXISTS "${copy}" WITH (FORCE)`);
    } finally {
      await cleanup.close();
    }
  });
}
