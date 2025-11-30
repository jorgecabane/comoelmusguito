# 🛠️ Tech Stack y Costos - comoelmusguito

## 📊 Resumen de Tecnologías

### Stack Principal (Gratis/Incluido)

```
✅ Next.js 16 - Framework (Open Source)
✅ React 19 - UI Library (Open Source)
✅ TypeScript - Type Safety (Open Source)
✅ Tailwind CSS - Styling (Open Source)
✅ Vercel - Hosting & Analytics (Plan Hobby gratis)
```

### Servicios Externos (Necesarios)

| Servicio | Uso | Plan Recomendado | Costo Mensual |
|----------|-----|------------------|---------------|
| **Sanity CMS** | Gestión contenido | Free (3 usuarios) | **$0** |
| **Resend** | Envío emails | Free (3k emails) | **$0** |
| **Stripe** | Pagos | Pay-per-transaction | **3.6% + $0.30 por venta** |
| **Video Hosting** | Videos cursos | Ver abajo | **$0 - $20** |
| **Dominio** | comoelmusguito.com | Anual | **~$15/año** |

**Total Mensual MVP: $0 - $20 USD** (sin contar comisiones de venta)

---

## 🎥 Video Hosting - Decisión Importante

### Comparativa Detallada

#### 1. YouTube Unlisted (MVP Recomendado) 🆓

```
✅ Ventajas:
- Completamente gratis
- CDN ultra-rápido (Google)
- Player optimizado
- Streaming adaptivo
- Sin límites de almacenamiento

❌ Desventajas:
- Branding de YouTube (logo, sugerencias)
- Menos control sobre player
- No puedes proteger 100% el contenido

💰 Costo: $0/mes

🎯 Usar para: MVP y validar que la gente compra cursos
```

**Implementación:**
```tsx
// Componente simple
<iframe
  src={`https://www.youtube.com/embed/${videoId}`}
  allow="fullscreen"
/>
```

---

#### 2. Bunny.net Stream (Producción Recomendado) ⭐

```
✅ Ventajas:
- Muy económico ($1/TB almacenamiento, $0.01/GB streaming)
- CDN global rápido
- Player personalizable (sin branding)
- DRM y protección de contenido
- Analytics incluidos
- API simple
- Streaming adaptivo (HLS)

❌ Desventaras:
- Requiere setup inicial
- Menos conocido que Vimeo

💰 Costo estimado:
- 50 videos x 500MB = 25GB = $25 almacenamiento one-time
- 100 estudiantes x 10 horas = 1TB streaming = $10/mes
- Total: ~$10-20/mes

🎯 Usar para: Producción cuando tengas primeras ventas
```

**Implementación:**
```tsx
import { BunnyPlayer } from '@/lib/video/bunny';

<BunnyPlayer videoId={lesson.videoId} />
```

---

#### 3. Vimeo Pro (Premium) 💎

```
✅ Ventajas:
- Marca conocida y confiable
- Player hermoso
- Analytics avanzados
- Gestión de videos excelente
- Privacidad y protección
- Soporte técnico

❌ Desventajas:
- Caro para empezar
- Límite de 2TB anuales en plan Plus ($75)

💰 Costo:
- Vimeo Plus: $7/mes (1TB, sin analytics)
- Vimeo Pro: $20/mes (5TB anual, analytics)
- Vimeo Premium: $75/mes (mejor para empresas)

🎯 Usar para: Si prefieres pagar más por marca y facilidad
```

---

#### 4. Mux (Developers)

```
✅ Ventajas:
- API excelente
- Analytics detallados
- Calidad superior
- Hecho para developers

❌ Desventajas:
- Más caro que Bunny
- Pricing complejo

💰 Costo:
- ~$0.015/min de video encoding
- ~$0.005/min de viewing
- Estimado: $30-50/mes

🎯 Usar para: Si necesitas analytics muy avanzados
```

---

### 🎯 Recomendación Final de Video

**Estrategia por Fases:**

```
FASE 1 (Semanas 1-8): YouTube Unlisted
├─ Costo: $0
├─ Validar que cursos se venden
└─ Iterar contenido sin costo

FASE 2 (Mes 3+): Bunny.net
├─ Costo: ~$15/mes
├─ Experiencia profesional
├─ Contenido protegido
└─ Cuando tengas >10 ventas de cursos

ALTERNATIVA: Vimeo Plus
├─ Si prefieres marca conocida
├─ $7/mes más simple
└─ Menos features pero funcional
```

---

## 🔐 Autenticación - NextAuth.js

### ¿Por qué lo necesitamos?

Para que los usuarios puedan:
1. Crear cuenta
2. Hacer login
3. **Acceder a cursos comprados**
4. Ver historial de compras
5. Trackear progreso de lecciones

### Setup Mínimo

```bash
# 1. Instalar
npm install next-auth

# 2. Generar secret
openssl rand -base64 32

# 3. Configurar .env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=el_string_generado_arriba
```

### Proveedores de Login

#### Email/Password (Suficiente para MVP)

```tsx
// Solo necesitas esto para empezar
providers: [
  CredentialsProvider({
    // Usuario crea cuenta con email + contraseña
  })
]
```

#### Login Social (Opcional)

```tsx
// "Iniciar sesión con Google" / GitHub
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
  GitHubProvider({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  })
]
```

**Ventajas login social:**
- ✅ Usuarios no crean otra contraseña
- ✅ Conversión más rápida (menos fricción)
- ✅ Más seguro (OAuth2)

**Desventajas:**
- ⏱️ Requiere setup en Google/GitHub
- 🔧 Más complejidad inicial

### 🎯 Recomendación

**MVP:** Solo Email/Password
**Producción:** Agregar Google (es el más usado)

---

## 📧 Email - Resend

### Plan Free (Perfecto para MVP)

```
✅ 3,000 emails/mes
✅ 100 emails/día  
✅ API simple
✅ React Email (templates en JSX)
✅ Analytics incluidos
✅ Sin tarjeta de crédito para empezar

💰 $0/mes
```

### ¿Cuándo pagar?

```
Tier Pro: $20/mes
- 50,000 emails/mes
- 1,000 emails/día

Necesitas esto cuando:
- Tengas >100 ventas/mes
- O envíes newsletter grande
```

### Uso en comoelmusguito

```typescript
// Ejemplo de uso
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Enviar acceso a curso
await resend.emails.send({
  from: 'Tomás <hola@comoelmusguito.com>',
  to: user.email,
  subject: '🌿 Tu curso está listo',
  react: CursoCompradoEmail({ userName, courseUrl }),
});
```

**Emails necesarios:**
1. ✉️ Confirmación de compra
2. 🎓 Acceso a curso comprado
3. 📦 Tracking de envío (terrarios)
4. 🔐 Reset de contraseña
5. 💌 Newsletter (opcional)

---

## 📊 Analytics - Estrategia

### Fase 1: Vercel Analytics (Gratis)

```
✅ Ya incluido si usas Vercel
✅ No requiere configuración
✅ Datos básicos:
   - Páginas vistas
   - Usuarios únicos
   - Core Web Vitals
   - Fuentes de tráfico

💰 $0/mes
```

**Setup:**
```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Fase 2: Plausible (Recomendado)

```
✅ Privacy-first (sin cookies)
✅ GDPR compliant (no banner de cookies)
✅ Lightweight (<1KB)
✅ UI simple y hermosa
✅ Open source

💰 $9/mes (hasta 10k pageviews/mes)
```

**Ventajas sobre Google Analytics:**
- 🚫 Sin tracking invasivo
- ⚡ 45x más liviano (1KB vs 45KB)
- 🇪🇺 No necesitas banner de cookies
- 👁️ Métricas claras, sin complejidad

**Cuándo agregarlo:**
- Cuando tengas >500 visitantes/día
- O quieras ser "privacy-friendly" desde día 1

### Google Analytics (Opcional)

```
❌ Tracking invasivo
❌ Requiere banner cookies (ley)
❌ Pesado (45KB)
✅ Gratis
✅ Integración con otros servicios Google
```

**Solo usar si:**
- Necesitas Google Ads
- Quieres datos ultra-detallados
- Estás dispuesto a tener banner de cookies

---

## 🌍 Geolocalización

### Vercel Headers (Gratis) ⭐

```typescript
// Ya incluido en Vercel - no requiere API
import { headers } from 'next/headers';

export function getUserCountry() {
  const headersList = headers();
  return headersList.get('x-vercel-ip-country') || 'CL';
}

// Uso
const country = getUserCountry();
if (country === 'CL') {
  // Mostrar terrarios + cursos
  // Precio en CLP
} else {
  // Solo cursos online
  // Precio en USD
}
```

**Precisión:** ~95% correcta (suficiente)

### Alternativas (si necesitas más)

```typescript
// ipapi.co (1000 requests/día gratis)
const response = await fetch('https://ipapi.co/json/');
const data = await response.json();
console.log(data.country_code); // 'CL'
```

---

## 💰 Resumen de Costos

### MVP (Mes 1-3)

| Item | Costo |
|------|-------|
| Hosting (Vercel) | $0 |
| CMS (Sanity) | $0 |
| Email (Resend) | $0 |
| Videos (YouTube) | $0 |
| Analytics (Vercel) | $0 |
| Dominio | $15/año = $1.25/mes |
| **Total** | **~$1.25/mes** |

**+ Comisiones por venta:**
- Stripe: 3.6% + $0.30 por transacción

---

### Producción (Escalado)

| Item | Costo |
|------|-------|
| Hosting (Vercel Pro) | $20/mes |
| CMS (Sanity) | $0 (free tier suficiente) |
| Email (Resend Pro) | $20/mes |
| Videos (Bunny.net) | $15/mes |
| Analytics (Plausible) | $9/mes |
| Dominio | $1.25/mes |
| **Total** | **~$65/mes** |

**Cuándo escalar:**
- Más de 50 ventas/mes
- Más de 1,000 visitantes/día
- Más de 20 cursos publicados

---

## 🎯 Recomendación Stack Final

### Para Empezar (MVP)

```yaml
Frontend: Next.js + TypeScript + Tailwind
Hosting: Vercel (free)
CMS: Sanity (free)
Pagos: Stripe
Videos: YouTube Unlisted (free)
Email: Resend (free)
Analytics: Vercel Analytics (free)
Auth: NextAuth con email/password
Geo: Vercel headers (free)

💰 Costo total: $0-2 USD/mes
```

### Producción (Optimizado)

```yaml
Frontend: Next.js + TypeScript + Tailwind
Hosting: Vercel Pro ($20)
CMS: Sanity (free tier OK)
Pagos: Stripe
Videos: Bunny.net ($15)
Email: Resend Pro ($20)
Analytics: Plausible ($9)
Auth: NextAuth + Google OAuth
Geo: Vercel headers

💰 Costo total: ~$65 USD/mes
```

---

## 📚 Recursos de Setup

### Sanity
- Docs: https://www.sanity.io/docs
- Schema builder: https://www.sanity.io/docs/schema-types
- Gratis: https://www.sanity.io/pricing

### Resend
- Signup: https://resend.com/signup
- Docs: https://resend.com/docs
- React Email: https://react.email

### Stripe
- Chile: https://stripe.com/en-cl
- Docs: https://stripe.com/docs
- Testing: https://stripe.com/docs/testing

### Bunny.net
- Signup: https://bunny.net
- Stream docs: https://docs.bunny.net/docs/stream
- Pricing: https://bunny.net/pricing/

### NextAuth
- Docs: https://next-auth.js.org
- Providers: https://next-auth.js.org/providers
- Setup: https://next-auth.js.org/getting-started/example

### Plausible
- Signup: https://plausible.io/register
- Docs: https://plausible.io/docs
- Open source: https://github.com/plausible/analytics

---

**Última actualización:** Noviembre 2025  
**Mantenedor:** Sistema comoelmusguito

