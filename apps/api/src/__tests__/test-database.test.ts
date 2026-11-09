import { describe, expect, test } from 'bun:test';
import { workerDatabaseName } from './test-database';

describe('worker test database names', () => {
  test('keeps the template and adds worker and run parts', () => {
    expect(workerDatabaseName('itsaplan_test', '3', '0123456789ab')).toBe(
      'itsaplan_test_3_0123456789ab',
    );
  });

  test('fits long templates without losing the unique suffix', () => {
    const template = `${'a'.repeat(52)}test${'b'.repeat(20)}`;
    const name = workerDatabaseName(template, '3', '0123456789ab');

    expect(Buffer.byteLength(name)).toBe(63);
    expect(name.endsWith('_test_3_0123456789ab')).toBe(true);
    expect(name).not.toBe(template);
  });

  test('refuses names that could reach a non-test database', () => {
    expect(() => workerDatabaseName('production', '3', '0123456789ab')).toThrow();
    expect(() => workerDatabaseName('itsaplan_test', 'worker', '0123456789ab')).toThrow();
    expect(() => workerDatabaseName('itsaplan_test', '3', 'not-a-run')).toThrow();
  });
});
