import { expect, test } from '@playwright/test';
import { BUYER_COURSE_ACCESS, COURSE } from '../fixtures';
import { sanity } from '../helpers/sanity';

const lessonUrl = (m: number, l: number) => `/cursos/${COURSE.slug}/leccion/${m}/${l}`;

test.beforeEach(async ({ page }) => {
  // Los videos de las lecciones son iframes de YouTube: no salir a internet.
  await page.route(/youtube\.com|ytimg\.com|googlevideo\.com|vimeo\.com/, (route) => route.abort());
});

// BUG: components/auth/LazyRecaptchaProvider.tsx:103-107 — remonta <SessionProvider> y useSession() queda sin sesión
// (ver e2e/customer/account.spec.ts), así que app/cursos/[slug]/CourseAccessRedirect.tsx nunca llama a check-access
// y el comprador ve la página de venta en vez de ser redirigido a sus lecciones.
test.fixme('el detalle de un curso comprado redirige a las lecciones', async ({ page }) => {
  await page.goto(`/cursos/${COURSE.slug}`);
  await expect(page).toHaveURL(new RegExp(`/cursos/${COURSE.slug}/leccion/\\d+/\\d+`));
});

test('abre una lección y navega a la siguiente', async ({ page }) => {
  await page.goto(lessonUrl(0, 0));
  await expect(page.getByRole('heading', { level: 1, name: COURSE.lessons[0][0] })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente →' }).click();
  await expect(page).toHaveURL(lessonUrl(0, 1));
  await expect(page.getByRole('heading', { level: 1, name: COURSE.lessons[0][1] })).toBeVisible();
});

test('índices de lección inválidos vuelven a la primera', async ({ page }) => {
  await page.goto(lessonUrl(9, 9));
  await expect(page).toHaveURL(lessonUrl(0, 0));
});

test.describe('progreso', () => {
  test.afterEach(async () => {
    await sanity
      .patch(BUYER_COURSE_ACCESS.id)
      .set({ 'progress.completedLessons': [...BUYER_COURSE_ACCESS.initialProgress.completedLessons], 'progress.lastWatched': BUYER_COURSE_ACCESS.initialProgress.lastWatched })
      .commit();
  });

  test('marcar una lección como completada persiste al recargar', async ({ page }) => {
    await page.goto(lessonUrl(0, 1));
    const completed = page.getByText('Completada', { exact: true });
    await expect(completed).toBeHidden();

    const saved = page.waitForResponse((r) => r.url().endsWith('/api/courses/progress') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Marcar como Completada' }).click();
    expect((await saved).status()).toBe(200);

    await page.reload();
    await expect(completed).toBeVisible();
    await expect(page.getByRole('button', { name: 'Marcar como Completada' })).toHaveCount(0);

    const access = await sanity.getDocument<{ progress: { completedLessons: string[] } }>(BUYER_COURSE_ACCESS.id);
    expect(access?.progress.completedLessons).toEqual(expect.arrayContaining(['0-0', '0-1']));
  });

  test('la API rechaza un lessonId mal formado', async ({ request }) => {
    const response = await request.post('/api/courses/progress', { data: { courseId: COURSE.id, lessonId: 'abc' } });
    expect(response.status()).toBe(400);
  });
});
