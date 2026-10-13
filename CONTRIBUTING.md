# Cómo contribuir

Guía para quienes se suman al proyecto (dev y UX). Para arquitectura y convenciones de código, ver `CLAUDE.md` y `ARCHITECTURE.md`.

## 1. Setup local

```bash
git clone git@github.com:jorgecabane/comoelmusguito.git
cd comoelmusguito
npm ci                     # instala dependencias y activa los hooks de Husky
npx playwright install chromium
```

Variables de entorno: pide acceso a Vercel o el `.env.local` a @jorgecabane (nunca por chat público ni commiteado). Base en `env.example`.

```bash
npm run dev                # http://localhost:3000
```

> ⚠️ El `.env.local` apunta a **datos de producción** (Sanity `production`, Flow real). Lo que crees o compres localmente es real. Para probar flujos que escriben datos, usa los E2E (dataset `test`).

## 2. Ambientes

| Ambiente | Rama | URL | Datos |
|---|---|---|---|
| Producción | `main` | comoelmusguito.cl | producción |
| Dev (en vivo) | `develop` | dev.comoelmusguito.cl | **producción** (mismas credenciales) |
| Preview por PR | cualquier PR | `*.vercel.app` (requiere login Vercel) | producción |
| E2E / CI | — | localhost:3100 | Sanity `test` (seed) |

`develop` se despliega solo al hacer merge. Úsalo para mostrar cambios en vivo antes de pasar a producción.

## 3. Flujo de trabajo

1. Crea una rama desde `develop`: `feat/…`, `fix/…`, `chore/…`, `ui/…`.
2. Commits chicos, formato [Conventional Commits](https://www.conventionalcommits.org/) en español: `feat(carrito): permitir editar cantidad`.
3. Abre un PR **hacia `develop`**. Describe qué cambia, cómo probarlo y adjunta screenshots si hay cambios visuales.
4. El PR necesita: CI en verde + aprobación de @jorgecabane (CODEOWNERS). No se puede hacer push directo a `main` ni a `develop`.
5. Cuando `develop` está validado en dev.comoelmusguito.cl, @jorgecabane abre el PR `develop → main` para producción.

## 4. Quality gates

| Cuándo | Qué corre |
|---|---|
| `git commit` (Husky) | ESLint en archivos staged, typecheck, unit tests |
| `git push` (Husky) | unit tests con coverage ≥90% + suite E2E completa |
| PR (GitHub Actions) | lint, typecheck, coverage ≥90%, build, E2E. **Obligatorio para hacer merge.** |

`--no-verify` se salta Husky, pero no la CI: si algo falla, el PR no se puede mergear. No lo uses.

## 5. Tests

**Unitarios (Vitest)** — `npm test`, `npm run test:watch`, `npm run test:coverage`
- Junto al archivo: `lib/flow/utils.ts` → `lib/flow/utils.test.ts`.
- Alcance del coverage: `lib/`, `app/api/`, `sanity/lib/`, `middleware.ts`. Mínimo **90%** en líneas, ramas, funciones y statements; la CI falla si baja.
- Todo cambio en ese alcance trae sus tests. Lo que toca plata (checkout, Flow/PayPal, órdenes, stock, cupos, regalos) y auth debe probar también los casos de error.
- Mockea solo los bordes (cliente Sanity, Resend, `fetch`, next-auth, Upstash) con `vi.mock`; variables de entorno con `vi.stubEnv`.

**E2E (Playwright)** — `npm run e2e`, `npm run e2e:ui`
- Corren contra el dataset **`test`** de Sanity con datos de prueba (`scripts/seed-e2e.ts`), nunca contra producción. Emails, pagos y captcha quedan desactivados.
- Una carpeta por rol: `e2e/anon` (visitante), `e2e/customer` (cliente sin compras), `e2e/buyer` (cliente con cursos y pedidos).
- Varias corridas (CI y el pre-push de cada uno) usan el dataset a la vez. El catálogo (productos, cursos, taller, blog; ids fijos `e2e-`) es **solo lectura** para los tests. Usuarios, pedidos, accesos y el regalo son **por corrida** (`E2E_RUN_ID`, creados en `e2e/global-setup.ts` y borrados en `e2e/global-teardown.ts`): un test solo puede mutar esos o los datos que él mismo crea. Importa todo desde `e2e/fixtures.ts`.
- Flujo nuevo visible para el usuario ⇒ spec nuevo. Usa locators accesibles (`getByRole`, `getByLabel`), sin `waitForTimeout`. Si tu test crea datos, usa emails únicos y límpialos.
- Correr uno: `npx playwright test e2e/anon/carrito.spec.ts --project=anon`.

## 6. Estándares de código

- TypeScript estricto; nada de `any` nuevo (usa tipos de `types/`).
- Server Components por defecto; `"use client"` solo si hay interactividad.
- Acceso a datos **solo** vía `lib/sanity/*`; nunca el cliente de Sanity desde componentes.
- Copy, rutas y labels en español; identificadores de código en inglés.
- Tailwind con los tokens del proyecto (`docs/UI_GUIDELINES.md`); nada de colores o tamaños hardcodeados.
- Accesibilidad WCAG 2.2 AA: `<label>` reales, foco visible, contraste ≥4.5:1, `alt` en imágenes, todo usable con teclado.
- Funciones cortas (<50 líneas), archivos <400 líneas, sin código comentado, sin abstracciones "por si acaso".
- Nunca loguees passwords, tokens ni datos personales.

## 7. UX / diseño

- Cambios visuales: incluye screenshots antes/después (desktop + mobile) en el PR.
- Revisa el resultado en el preview del PR o en dev.comoelmusguito.cl tras el merge.
- Tokens, tipografías y componentes: `docs/UI_GUIDELINES.md`.
