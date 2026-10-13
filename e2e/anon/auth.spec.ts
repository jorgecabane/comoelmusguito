import { expect, test, type Page } from '@playwright/test';
import { USERS } from '../fixtures';
import { createVerifiedUser, deleteUserByEmail, getUserByEmail, uniqueEmail } from '../helpers/sanity';
import { login } from '../helpers/ui';

test.describe('rutas protegidas', () => {
  for (const path of ['/mi-cuenta', '/mi-cuenta?filter=courses']) {
    test(`${path} redirige al login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=/);
      await expect(page.getByRole('heading', { name: /Bienvenido de vuelta/ })).toBeVisible();
    });
  }
});

test.describe('login', () => {
  test('contraseña incorrecta muestra error', async ({ page }) => {
    await login(page, USERS.customer.email, 'contraseña-incorrecta');
    await expect(page.getByText('Email o contraseña incorrectos')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('email inexistente muestra el mismo error (no revela cuentas)', async ({ page }) => {
    await login(page, uniqueEmail('ghost'), 'loquesea123');
    await expect(page.getByText('Email o contraseña incorrectos')).toBeVisible();
  });

  test('respeta el callbackUrl', async ({ page }) => {
    await page.goto('/mi-cuenta?filter=courses');
    await expect(page).toHaveURL(/callbackUrl=/);
    const main = page.getByRole('main');
    await main.getByLabel('Email').fill(USERS.customer.email);
    await main.getByLabel('Contraseña', { exact: true }).fill(USERS.customer.password);
    await main.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/\/mi-cuenta\?filter=courses/);
  });

  test('links a registro y recuperación', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
    await expect(page.getByRole('heading', { name: 'Olvidé mi Contraseña' })).toBeVisible();
    await page.goto('/auth/login');
    await page.getByRole('link', { name: 'Regístrate aquí' }).click();
    await expect(page.getByRole('heading', { name: /Únete a nuestra comunidad/ })).toBeVisible();
  });
});

test.describe('registro', () => {
  const name = 'Nueva Persona E2E';
  const password = 'clave-segura-123';

  async function fillRegister(page: Page, email: string, confirm = password) {
    await page.goto('/auth/register');
    const main = page.getByRole('main');
    await main.getByLabel('Nombre').fill(name);
    await main.getByLabel('Email').fill(email);
    await main.getByLabel('Contraseña', { exact: true }).fill(password);
    await main.getByLabel('Confirmar Contraseña').fill(confirm);
    await main.getByRole('button', { name: 'Crear Cuenta' }).click();
  }

  test('registro → verificación por email → login', async ({ page }) => {
    const email = uniqueEmail('register');
    try {
      await fillRegister(page, email);
      await expect(page.getByRole('heading', { name: /Cuenta creada exitosamente/ })).toBeVisible();

      // Sin verificar no puede entrar.
      await login(page, email, password);
      await expect(page.getByText(/Tu email no ha sido verificado/)).toBeVisible();

      const token = (await getUserByEmail(email))?.emailVerificationToken;
      expect(token).toBeTruthy();
      await page.goto(`/api/auth/verify-email?token=${token}`);
      await expect(page).toHaveURL(/\/auth\/login\?verified=true/);
      await expect(page.getByText('Email verificado exitosamente')).toBeVisible();

      // El link es de un solo uso.
      await page.goto(`/api/auth/verify-email?token=${token}`);
      await expect(page.getByRole('heading', { name: 'Enlace Expirado o Ya Utilizado' })).toBeVisible();

      await login(page, email, password);
      await expect(page).toHaveURL(/\/mi-cuenta/);
      await expect(page.getByRole('heading', { name: `Hola, ${name}` })).toBeVisible();
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test('contraseñas distintas no envían el formulario', async ({ page }) => {
    const email = uniqueEmail('register');
    await fillRegister(page, email, 'otra-clave-123');
    await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible();
    expect(await getUserByEmail(email)).toBeNull();
  });

  test('email ya registrado sugiere iniciar sesión', async ({ page }) => {
    await fillRegister(page, USERS.customer.email);
    await expect(page.getByText(/Este email ya está registrado/)).toBeVisible();
  });
});

test.describe('recuperar contraseña', () => {
  test('forgot → token → reset → login con la nueva contraseña', async ({ page }) => {
    const email = uniqueEmail('reset');
    const newPassword = 'nueva-clave-456';
    await createVerifiedUser(email, 'clave-vieja-123');
    try {
      await page.goto('/auth/forgot-password');
      await page.getByRole('main').getByLabel('Email').fill(email);
      await page.getByRole('button', { name: 'Enviar Enlace de Recuperación' }).click();
      await expect(page.getByRole('heading', { name: 'Email Enviado' })).toBeVisible();

      const { passwordResetToken } = (await getUserByEmail(email))!;
      expect(passwordResetToken).toBeTruthy();
      await page.goto(`/auth/reset-password?token=${passwordResetToken}`);
      await expect(page.getByRole('heading', { name: 'Restablecer Contraseña' })).toBeVisible();

      const main = page.getByRole('main');
      await main.getByLabel('Nueva Contraseña').fill(newPassword);
      await main.getByLabel('Confirmar Contraseña').fill(newPassword);
      await main.getByRole('button', { name: 'Restablecer Contraseña' }).click();
      await expect(page.getByRole('heading', { name: 'Contraseña Restablecida' })).toBeVisible();
      await expect(page).toHaveURL(/\/auth\/login\?passwordReset=true/);

      await login(page, email, 'clave-vieja-123');
      await expect(page.getByText('Email o contraseña incorrectos')).toBeVisible();
      await login(page, email, newPassword);
      await expect(page).toHaveURL(/\/mi-cuenta/);

      // El token queda invalidado tras usarse.
      expect((await getUserByEmail(email))?.passwordResetToken).toBeFalsy();
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test('email inexistente responde igual (no revela cuentas)', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.getByRole('main').getByLabel('Email').fill(uniqueEmail('ghost'));
    await page.getByRole('button', { name: 'Enviar Enlace de Recuperación' }).click();
    await expect(page.getByRole('heading', { name: 'Email Enviado' })).toBeVisible();
  });

  test('token inválido muestra error', async ({ page }) => {
    await page.goto('/auth/reset-password?token=token-que-no-existe');
    await expect(page.getByRole('heading', { name: 'Token Inválido' })).toBeVisible();
    await page.getByRole('button', { name: 'Solicitar Nuevo Enlace' }).click();
    await expect(page).toHaveURL('/auth/forgot-password');
  });

  test('link de verificación inválido muestra error', async ({ page }) => {
    await page.goto('/api/auth/verify-email?token=token-que-no-existe');
    await expect(page.getByRole('heading', { name: 'Enlace Expirado o Ya Utilizado' })).toBeVisible();
  });
});
