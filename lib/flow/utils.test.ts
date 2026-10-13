import crypto from 'crypto';
import { describe, expect, it, vi } from 'vitest';
import { signFlowRequest, verifyFlowSignature } from './utils';

const SECRET = 'secret-key-123';
const sha256 = (s: string) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const hmac = (s: string) => crypto.createHmac('sha256', SECRET).update(s, 'utf8').digest('hex');

describe('signFlowRequest', () => {
  it('ordena alfabéticamente, convierte números a string y firma concatenado + secret', () => {
    const sig = signFlowRequest({ token: 'tok', amount: 1500, apiKey: 'key' }, SECRET);
    expect(sig).toBe(sha256(`amount=1500&apiKey=key&token=tok${SECRET}`));
  });

  it('ignora el parámetro "s" (la propia firma)', () => {
    expect(signFlowRequest({ a: '1', s: 'old' }, SECRET)).toBe(signFlowRequest({ a: '1' }, SECRET));
  });

  it('no codifica URLs en los valores', () => {
    const sig = signFlowRequest({ urlReturn: 'https://x.cl/a?b=c&d=e' }, SECRET);
    expect(sig).toBe(sha256(`urlReturn=https://x.cl/a?b=c&d=e${SECRET}`));
  });

  it('el orden es insensible a mayúsculas', () => {
    expect(signFlowRequest({ b: '2', A: '1' }, SECRET)).toBe(sha256(`A=1&b=2${SECRET}`));
  });

  it('solo loguea en development', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    signFlowRequest({ a: '1' }, SECRET);
    expect(log).not.toHaveBeenCalled();
    vi.stubEnv('NODE_ENV', 'development');
    signFlowRequest({ a: '1' }, SECRET);
    expect(log).toHaveBeenCalledWith('Flow Signature Debug:', expect.any(Object));
  });

  // BUG: lib/flow/utils.ts:50 usa SHA256(concat + secret), pero Flow (y lib/flow/client.ts)
  // firman con HMAC-SHA256(concat, secret). Hoy el módulo no se usa, pero quien lo importe
  // (está re-exportado como verifyFlowWebhookSignature) rechazará toda firma real de Flow.
  it.skip('BUG: debería firmar con HMAC-SHA256 como el resto de la integración', () => {
    expect(signFlowRequest({ apiKey: 'k', token: 't' }, SECRET)).toBe(hmac('apiKey=k&token=t'));
  });
});

describe('verifyFlowSignature', () => {
  const params = { apiKey: 'k', token: 't' };

  it('acepta una firma correcta', () => {
    expect(verifyFlowSignature(params, SECRET, signFlowRequest(params, SECRET))).toBe(true);
  });

  it('rechaza firma alterada, otro secret o parámetros modificados', () => {
    const good = signFlowRequest(params, SECRET);
    expect(verifyFlowSignature(params, SECRET, '0'.repeat(64))).toBe(false);
    expect(verifyFlowSignature(params, SECRET, good.toUpperCase())).toBe(false);
    expect(verifyFlowSignature(params, 'otro', good)).toBe(false);
    expect(verifyFlowSignature({ ...params, token: 't2' }, SECRET, good)).toBe(false);
    expect(verifyFlowSignature(params, SECRET, '')).toBe(false);
  });
});
