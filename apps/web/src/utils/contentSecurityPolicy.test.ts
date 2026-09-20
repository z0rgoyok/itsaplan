import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { contentSecurityPolicy } from './contentSecurityPolicy';

let originalApiUrl: string | undefined;

beforeEach(() => {
  originalApiUrl = process.env.API_URL;
});

afterEach(() => {
  if (originalApiUrl === undefined) delete process.env.API_URL;
  else process.env.API_URL = originalApiUrl;
});

describe('contentSecurityPolicy', () => {
  it('allows requests to the api origin only, without its path', () => {
    process.env.API_URL = 'https://api.example.com/base/';
    assert.match(contentSecurityPolicy(), /connect-src 'self' blob: https:\/\/api\.example\.com;/);
  });

  it('falls back to same-origin requests when the api url is not absolute', () => {
    process.env.API_URL = 'not a url';
    assert.match(contentSecurityPolicy(), /connect-src 'self' blob:;/);
  });

  it('allows the Cloudflare Turnstile script and frame', () => {
    const policy = contentSecurityPolicy();
    assert.match(policy, /script-src [^;]*https:\/\/challenges\.cloudflare\.com;/);
    assert.match(policy, /frame-src https:\/\/challenges\.cloudflare\.com;/);
  });
});
