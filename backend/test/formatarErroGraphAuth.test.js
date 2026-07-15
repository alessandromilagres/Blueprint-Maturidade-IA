import test from 'node:test';
import assert from 'node:assert/strict';
import { formatarErroGraphAuth } from '../src/services/email.js';

test('formatarErroGraphAuth — secret expirado (AADSTS7000222)', () => {
  const payload = JSON.stringify({
    error: 'invalid_client',
    error_description:
      "AADSTS7000222: The provided client secret keys for app '9f1c09b6-705d-41c3-b493-867413194780' are expired.",
    error_codes: [7000222]
  });
  const msg = formatarErroGraphAuth(401, payload);
  assert.match(msg, /client secret.*expirou/i);
  assert.match(msg, /blueprint-agentica-secrets/);
  assert.doesNotMatch(msg, /trace_id|correlation_id/);
});

test('formatarErroGraphAuth — invalid_client genérico', () => {
  const payload = JSON.stringify({ error: 'invalid_client', error_description: 'Bad credentials' });
  const msg = formatarErroGraphAuth(401, payload);
  assert.match(msg, /invalid_client/i);
  assert.doesNotMatch(msg, /Bad credentials/);
});
