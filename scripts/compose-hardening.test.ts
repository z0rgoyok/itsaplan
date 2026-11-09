import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';

const ROOT = join(import.meta.dir, '..');
const COMPOSE_FILES = [
  'docker-compose.yml',
  'docker-compose.pro.yml',
  'docker-compose.coolify.yml',
  'docker-compose.coolify-pro.yml',
  'docker-compose.coolify-images.yml',
];

describe('Docker Compose hardening', () => {
  for (const file of COMPOSE_FILES) {
    test(`${file} prepares the backup volume before migrating`, () => {
      const compose = readFileSync(join(ROOT, file), 'utf8');

      expect(compose).toContain('  backups-init:\n');
      expect(compose).toContain("    user: '0:0'\n");
      expect(compose).toContain(
        "    command: ['chown -R 10001:10001 /backups && chmod 700 /backups']\n",
      );
      expect(compose).toMatch(
        / {2}migrate:\n(?:.*\n)*? {4}depends_on:\n {6}postgres:\n {8}condition: service_healthy\n {6}backups-init:\n {8}condition: service_completed_successfully\n/,
      );
    });
  }
});
