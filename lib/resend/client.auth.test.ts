import { beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.hoisted(() => vi.fn());
vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));
// Sanity image client needs a projectId at import; date helpers are what we actually use.
vi.mock('@/sanity/lib/image', () => ({ getSanityImageUrl: vi.fn() }));

async function load(apiKey: string | undefined = 're_test') {
  vi.resetModules();
  vi.stubEnv('RESEND_API_KEY', apiKey);
  vi.stubEnv('RESEND_FROM_EMAIL', 'tienda@test.cl');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://musgo.test');
  return import('./client');
}

beforeEach(() => {
  send.mockReset().mockResolvedValue({ data: { id: 'email_1' }, error: null });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('sendVerificationEmail', () => {
  it('sends a verification link with the token', async () => {
    const { sendVerificationEmail } = await load();
    await sendVerificationEmail('ana@test.cl', 'Ana', 'tok123');

    const msg = send.mock.calls[0][0];
    expect(msg).toMatchObject({ from: 'comoelmusguito <tienda@test.cl>', to: 'ana@test.cl' });
    expect(msg.subject).toContain('Verifica tu cuenta');
    expect(msg.html).toContain('href="https://musgo.test/api/auth/verify-email?token=tok123"');
    expect(msg.html).toContain('Hola Ana,');
  });

  it('greets by email when no name and falls back to localhost', async () => {
    const { sendVerificationEmail } = await load();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined);
    await sendVerificationEmail('ana@test.cl', undefined, 'tok');
    const { html } = send.mock.calls[0][0];
    expect(html).toContain('Hola ana@test.cl,');
    expect(html).toContain('http://localhost:3000/api/auth/verify-email?token=tok');
  });

  it('skips sending without an API key', async () => {
    const { sendVerificationEmail } = await load('');
    await sendVerificationEmail('a@b.cl', 'A', 't');
    expect(send).not.toHaveBeenCalled();
  });

  it('rethrows SDK failures', async () => {
    const { sendVerificationEmail } = await load();
    send.mockRejectedValueOnce(new Error('boom'));
    await expect(sendVerificationEmail('a@b.cl', 'A', 't')).rejects.toThrow('boom');
  });
});

describe('sendPasswordResetEmail', () => {
  it('sends a reset link by default', async () => {
    const { sendPasswordResetEmail } = await load();
    await sendPasswordResetEmail('ana@test.cl', 'Ana', 'rst1');

    const msg = send.mock.calls[0][0];
    expect(msg.to).toBe('ana@test.cl');
    expect(msg.subject).toContain('Restablece tu contraseña');
    expect(msg.html).toContain('href="https://musgo.test/auth/reset-password?token=rst1"');
    expect(msg.html).toContain('Restablecer Contraseña');
    expect(msg.html).toContain('Este email fue enviado para restablecer tu contraseña');
  });

  it('uses "create password" copy for Google-only accounts', async () => {
    const { sendPasswordResetEmail } = await load();
    await sendPasswordResetEmail('ana@test.cl', undefined, 'rst2', true);

    const msg = send.mock.calls[0][0];
    expect(msg.subject).toContain('Crea tu contraseña');
    expect(msg.html).toContain('iniciando sesión con Google');
    expect(msg.html).toContain('Crear Contraseña');
    expect(msg.html).toContain('Hola ana@test.cl,');
  });

  it('falls back to localhost when site URL is unset', async () => {
    const { sendPasswordResetEmail } = await load();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined);
    await sendPasswordResetEmail('a@b.cl', 'A', 'x');
    expect(send.mock.calls[0][0].html).toContain('http://localhost:3000/auth/reset-password?token=x');
  });

  it('skips sending without an API key', async () => {
    const { sendPasswordResetEmail } = await load('');
    await sendPasswordResetEmail('a@b.cl', 'A', 't');
    expect(send).not.toHaveBeenCalled();
  });

  it('rethrows SDK failures', async () => {
    const { sendPasswordResetEmail } = await load();
    send.mockRejectedValueOnce(new Error('boom'));
    await expect(sendPasswordResetEmail('a@b.cl', 'A', 't')).rejects.toThrow('boom');
  });
});
