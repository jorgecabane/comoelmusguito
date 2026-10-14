import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => ({ getUserByResetToken: vi.fn(), resetUserPassword: vi.fn() }));
vi.mock('@/lib/auth/sanity-adapter', () => m);

import { POST } from './route';

const post = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  m.getUserByResetToken.mockReset();
  m.resetUserPassword.mockReset();
});

describe('POST /api/auth/reset-password', () => {
  it.each([
    [{ password: 'longenough' }, 'Token requerido'],
    [{ token: 123, password: 'longenough' }, 'Token requerido'],
    [{ token: 't' }, 'Contraseña requerida'],
    [{ token: 't', password: ['x'] }, 'Contraseña requerida'],
    [{ token: 't', password: '1234567' }, 'La contraseña debe tener al menos 8 caracteres'],
  ])('validates input %#', async (body, error) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error });
    expect(m.getUserByResetToken).not.toHaveBeenCalled();
  });

  it('rejects invalid or expired token', async () => {
    m.getUserByResetToken.mockResolvedValue(null);
    const res = await post({ token: 't', password: 'longenough' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Token inválido o expirado' });
    expect(m.resetUserPassword).not.toHaveBeenCalled();
  });

  it('resets the password for a valid token', async () => {
    m.getUserByResetToken.mockResolvedValue({ _id: 'u1' });
    m.resetUserPassword.mockResolvedValue(true);
    const res = await post({ token: 't', password: 'longenough' });
    expect(res.status).toBe(200);
    expect(m.getUserByResetToken).toHaveBeenCalledWith('t');
    expect(m.resetUserPassword).toHaveBeenCalledWith('u1', 'longenough');
  });

  it('returns 500 when the reset write fails', async () => {
    m.getUserByResetToken.mockResolvedValue({ _id: 'u1' });
    m.resetUserPassword.mockResolvedValue(false);
    expect((await post({ token: 't', password: 'longenough' })).status).toBe(500);
  });

  it('returns a generic 500 on malformed JSON', async () => {
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST', body: '{' }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Error procesando la solicitud' });
  });
});
