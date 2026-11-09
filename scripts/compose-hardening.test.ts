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

type ComposeService = {
  user?: string;
  command?: string[];
  volumes?: string[];
  depends_on?: Record<string, { condition?: string }>;
};

type ComposeFile = { services: Record<string, ComposeService> };

describe('Docker Compose hardening', () => {
  for (const file of COMPOSE_FILES) {
    test(`${file} prepares the backup volume before migrating`, () => {
      const compose = Bun.YAML.parse(readFileSync(join(ROOT, file), 'utf8')) as ComposeFile;
      const init = compose.services['backups-init'];
      const migrate = compose.services.migrate;

      expect(init?.user).toBe('0:0');
      expect(init?.command).toEqual(['chown -R 10001:10001 /backups && chmod 700 /backups']);
      expect(init?.volumes).toEqual(['db-backups:/backups']);
      expect(migrate?.depends_on?.['backups-init']?.condition).toBe(
        'service_completed_successfully',
      );
    });
  }
});

describe('Kubernetes backup volume hardening', () => {
  test('the API pod assigns the backup volume to the non-root runtime group', () => {
    const template = readFileSync(
      join(ROOT, 'charts/itsaplan/templates/deployment-api.yaml'),
      'utf8',
    );
    expect(template).toContain(
      'mergeOverwrite (dict "fsGroup" 10001 "fsGroupChangePolicy" "OnRootMismatch")',
    );
    expect(template).toContain('toYaml $podSecurityContext');
    expect(template).not.toContain('- name: backups-init');
    expect(template).toContain('mountPath: /backups');
  });
});
