const DATABASE_NAME_LIMIT = 63;

// PostgreSQL truncates identifiers past 63 bytes before executing them. The worker
// copy must stay inside that limit without losing its random suffix; otherwise the
// preloader could drop the template database or recreate a colliding worker name.
export function workerDatabaseName(template: string, worker: string, runId: string): string {
  if (!/^\d+$/.test(worker)) throw new Error('The test worker id must be numeric.');
  if (!/^[0-9a-f]{12}$/.test(runId)) throw new Error('The test run id must be 12 hex characters.');
  if (!/^[A-Za-z0-9_]+$/.test(template) || !template.includes('test')) {
    throw new Error('The test database name must be safe and contain "test".');
  }

  const suffix = `_${worker}_${runId}`;
  if (Buffer.byteLength(suffix) + '_test'.length > DATABASE_NAME_LIMIT) {
    throw new Error('The test worker id leaves no room for a unique database name.');
  }
  if (Buffer.byteLength(template + suffix) <= DATABASE_NAME_LIMIT) return template + suffix;

  const marker = '_test';
  const prefix = template.slice(0, DATABASE_NAME_LIMIT - Buffer.byteLength(marker + suffix));
  return `${prefix}${marker}${suffix}`;
}
