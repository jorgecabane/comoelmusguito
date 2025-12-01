# 🏗️ Arquitectura - comoelmusguito

## 📐 Principios Fundamentales

### 1. **Modularidad**
- Cada funcionalidad debe ser independiente y reutilizable
- Componentes deben ser agnósticos del contexto
- Integraciones externas deben ser intercambiables

### 2. **Separation of Concerns**
- UI separada de lógica de negocio
- Data fetching aislado en servicios
- Componentes "tontos" vs componentes "inteligentes"

### 3. **Progresive Enhancement**
- La experiencia base funciona sin JavaScript
- Animaciones son mejoras, no requisitos
- Mobile-first approach

---

## 🗂️ Estructura de Carpetas

```
comoelmusguito/
│
├── app/                          # Next.js App Router
│   ├── (main)/                   # Grupo de rutas principales
│   │   ├── page.tsx              # Home - Experiencia narrativa
│   │   ├── terrarios/            # Tienda de terrarios
│   │   │   ├── page.tsx          # Listado galería
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Detalle terrario
│   │   ├── cursos/               # Cursos online
│   │   │   ├── page.tsx          # Catálogo cursos
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Detalle curso
│   │   ├── talleres/             # Cursos presenciales
│   │   │   └── page.tsx
│   │   ├── sobre/    # Sobre Tomás
│   │   │   └── page.tsx
│   │   └── contacto/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/              # Grupo de rutas autenticadas
│   │   ├── layout.tsx            # Layout dashboard
│   │   ├── mis-cursos/           # Cursos comprados
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       ├── page.tsx      # Player del curso
│   │   │       └── [leccion]/
│   │   │           └── page.tsx  # Lección individual
│   │   ├── perfil/
│   │   │   └── page.tsx
│   │   └── ordenes/
│   │       └── page.tsx
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticación
│   │   ├── payments/             # Webhooks Stripe
│   │   ├── sanity/               # Webhooks Sanity
│   │   └── newsletter/           # Suscripción email
│   │
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Estilos globales
│   └── not-found.tsx             # 404 personalizado
│
├── components/                   # Componentes React
│   ├── ui/                       # Componentes base reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts              # Barrel export
│   │
│   ├── shared/                   # Componentes compartidos
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   ├── Cart/
│   │   │   ├── CartButton.tsx
│   │   │   ├── CartDrawer.tsx
│   │   │   └── CartItem.tsx
│   │   └── index.ts
│   │
│   ├── sections/                 # Secciones de páginas (narrativas)
│   │   ├── home/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ArtistSection.tsx
│   │   │   ├── ProcessSection.tsx
│   │   │   ├── GallerySection.tsx
│   │   │   └── index.ts
│   │   ├── terrarios/
│   │   │   ├── TerrariumGrid.tsx
│   │   │   ├── TerrariumCard.tsx
│   │   │   └── TerrariumDetail.tsx
│   │   └── cursos/
│   │       ├── CourseGrid.tsx
│   │       ├── CourseCard.tsx
│   │       └── CoursePlayer.tsx
│   │
│   └── animations/               # Componentes con animaciones
│       ├── FadeIn.tsx
│       ├── ParallaxImage.tsx
│       ├── ScrollReveal.tsx
│       └── VideoBackground.tsx
│
├── lib/                          # Utilidades y configuraciones
│   ├── sanity/                   # Configuración Sanity
│   │   ├── client.ts             # Cliente Sanity
│   │   ├── config.ts             # Config base
│   │   ├── queries.ts            # GROQ queries
│   │   └── schemas/              # Schemas Sanity
│   │       ├── terrarium.ts
│   │       ├── course.ts
│   │       ├── lesson.ts
│   │       └── index.ts
│   │
│   ├── payments/                 # Integración pagos
│   │   ├── stripe.ts             # Cliente Stripe
│   │   ├── types.ts              # Types de pagos
│   │   └── utils.ts              # Helpers pagos
│   │
│   ├── auth/                     # Autenticación
│   │   ├── config.ts             # Config NextAuth
│   │   └── utils.ts
│   │
│   ├── utils/                    # Utilidades generales
│   │   ├── cn.ts                 # clsx + tailwind-merge
│   │   ├── format.ts             # Formateo números, fechas
│   │   └── validations.ts        # Validaciones forms
│   │
│   └── constants/                # Constantes
│       ├── routes.ts             # Rutas de la app
│       ├── config.ts             # Config general
│       └── copy.ts               # Textos y copy
│
├── types/                        # TypeScript types globales
│   ├── sanity.ts                 # Types de Sanity
│   ├── products.ts               # Types de productos
│   ├── courses.ts                # Types de cursos
│   └── index.ts
│
├── hooks/                        # Custom React hooks
│   ├── useCart.ts                # Estado del carrito
│   ├── useScrollPosition.ts      # Scroll tracking
│   ├── useMediaQuery.ts          # Responsive
│   └── useCourseProgress.ts      # Progreso cursos
│
├── context/                      # React Context providers
│   ├── CartContext.tsx           # Carrito global
│   └── UserContext.tsx           # Usuario autenticado
│
├── styles/                       # Estilos adicionales
│   └── animations.css            # Animaciones custom CSS
│
├── public/                       # Assets estáticos
│   ├── images/
│   │   ├── placeholders/         # Imágenes temporales
│   │   ├── logo/                 # Logo variantes
│   │   └── og/                   # Open Graph images
│   └── videos/
│       └── placeholders/         # Videos temporales
│
├── sanity/                       # Sanity Studio (opcional)
│   ├── sanity.config.ts
│   └── schemas/                  # Mirror de lib/sanity/schemas
│
├── docs/                         # Documentación
│   ├── UI_GUIDELINES.md          # Guía UI/UX
│   ├── COMPONENTS.md             # Docs de componentes
│   └── API.md                    # Docs de API
│
├── ARCHITECTURE.md               # Este archivo
├── README.md                     # Setup del proyecto
├── .env.local.example            # Variables de entorno ejemplo
└── package.json
```

---

## 🔌 Arquitectura de Integraciones (Modular)

### Patrón: **Adapter Pattern**

Todas las integraciones externas deben ser intercambiables sin cambiar el código de la app.

#### Ejemplo: Pagos

```typescript
// lib/payments/types.ts
export interface PaymentProvider {
  createCheckoutSession(items: CartItem[]): Promise<CheckoutSession>;
  processWebhook(payload: any): Promise<WebhookResult>;
  refundPayment(paymentId: string): Promise<RefundResult>;
}

// lib/payments/stripe.ts
export class StripePaymentProvider implements PaymentProvider {
  async createCheckoutSession(items: CartItem[]) {
    // Implementación Stripe
  }
  // ...
}

// lib/payments/mercadopago.ts (futuro)
export class MercadoPagoProvider implements PaymentProvider {
  async createCheckoutSession(items: CartItem[]) {
    // Implementación Mercado Pago
  }
  // ...
}

// lib/payments/index.ts
const paymentProvider: PaymentProvider = 
  process.env.PAYMENT_PROVIDER === 'mercadopago' 
    ? new MercadoPagoProvider()
    : new StripePaymentProvider();

export default paymentProvider;
```

**Beneficio**: Cambiar de Stripe a Mercado Pago solo requiere cambiar una variable de entorno.

---

### CMS (Sanity)

```typescript
// lib/cms/types.ts
export interface CMSProvider {
  getTerrariums(): Promise<Terrarium[]>;
  getTerrariumBySlug(slug: string): Promise<Terrarium>;
  getCourses(): Promise<Course[]>;
  // ...
}

// lib/cms/sanity.ts
export class SanityCMSProvider implements CMSProvider {
  async getTerrariums() {
    return this.client.fetch(queries.terrariums);
  }
  // ...
}

// Fácil migrar a otro CMS en el futuro
```

---

### Video Hosting

```typescript
// lib/video/types.ts
export interface VideoProvider {
  getVideoUrl(videoId: string): string;
  getEmbedCode(videoId: string): string;
  uploadVideo(file: File): Promise<string>;
}

// lib/video/vimeo.ts
export class VimeoProvider implements VideoProvider { /* ... */ }

// lib/video/mux.ts (futuro)
export class MuxProvider implements VideoProvider { /* ... */ }
```

---

## 🎨 Componentes UI - Filosofía

### 1. **Atomic Design**

```
Átomos (atoms)        → Button, Input, Icon
Moléculas (molecules) → SearchBar, CardHeader
Organismos (organisms)→ Navigation, ProductCard
Templates             → PageLayout, DashboardLayout
Páginas (pages)       → Ensamblaje final
```

### 2. **Componentes Controlados vs No Controlados**

**Componentes "Tontos" (Presentational):**
```typescript
// ✅ Solo reciben props, no tienen estado
export function TerrariumCard({ terrarium, onAddToCart }: Props) {
  return (
    <Card>
      <Image src={terrarium.image} />
      <h3>{terrarium.name}</h3>
      <Button onClick={() => onAddToCart(terrarium)}>
        Adoptar
      </Button>
    </Card>
  );
}
```

**Componentes "Inteligentes" (Container):**
```typescript
// ✅ Manejan lógica, estado, data fetching
export function TerrariumGridContainer() {
  const { data, loading } = useTerrariums();
  const { addToCart } = useCart();
  
  if (loading) return <Skeleton />;
  
  return (
    <div className="grid">
      {data.map(t => (
        <TerrariumCard 
          key={t.id} 
          terrarium={t} 
          onAddToCart={addToCart} 
        />
      ))}
    </div>
  );
}
```

### 3. **Composición sobre Herencia**

```typescript
// ❌ MAL - Herencia rígida
class BaseCard extends Component { /* ... */ }
class TerrariumCard extends BaseCard { /* ... */ }

// ✅ BIEN - Composición flexible
<Card>
  <Card.Image src={image} />
  <Card.Content>
    <Card.Title>{title}</Card.Title>
    <Card.Description>{desc}</Card.Description>
  </Card.Content>
  <Card.Footer>
    <Button>Adoptar</Button>
  </Card.Footer>
</Card>
```

---

## 🔄 Data Fetching Patterns

### Server Components por Defecto

```typescript
// ✅ Server Component (por defecto en Next.js 14)
export default async function TerrariosPage() {
  const terrariums = await cms.getTerrariums();
  
  return <TerrariumGrid terrariums={terrariums} />;
}
```

### Client Components Solo Cuando Necesario

```typescript
'use client'; // ⚠️ Solo si necesitas interactividad

export function CartButton() {
  const { items } = useCart(); // Necesita estado del cliente
  
  return <Button>Carrito ({items.length})</Button>;
}
```

### Patterns de Carga

```typescript
// ✅ Loading state con Suspense
<Suspense fallback={<TerrariumGridSkeleton />}>
  <TerrariumGrid />
</Suspense>

// ✅ Error boundaries
<ErrorBoundary fallback={<ErrorMessage />}>
  <CoursePlayer />
</ErrorBoundary>
```

---

## 🎭 Animaciones - Reglas

### 1. **Semánticas, No Decorativas**

```typescript
// ❌ Animación sin propósito
<motion.div animate={{ rotate: 360 }} />

// ✅ Animación con propósito (feedback de acción)
<motion.button
  whileTap={{ scale: 0.95 }}
  whileHover={{ scale: 1.02 }}
>
  Agregar al Carrito
</motion.button>
```

### 2. **Performance First**

```typescript
// ✅ Animar solo propiedades optimizadas
const variants = {
  hidden: { opacity: 0, y: 20 },  // opacity + transform ✅
  visible: { opacity: 1, y: 0 }
};

// ❌ Evitar animar propiedades costosas
const bad = {
  hidden: { height: 0, width: 0 }  // Layout thrashing ❌
};
```

### 3. **Progresive Enhancement**

```typescript
// ✅ Funciona sin animaciones
const prefersReducedMotion = useReducedMotion();

<motion.div
  initial="hidden"
  animate="visible"
  variants={prefersReducedMotion ? {} : variants}
>
```

---

## 🔐 Seguridad y Validaciones

### 1. **Validación en Cliente Y Servidor**

```typescript
// ✅ Cliente (UX rápida)
const handleSubmit = (data) => {
  if (!validateEmail(data.email)) {
    setError('Email inválido');
    return;
  }
  submitForm(data);
};

// ✅ Servidor (seguridad real)
export async function POST(req: Request) {
  const data = await req.json();
  
  if (!validateEmail(data.email)) {
    return Response.json({ error: 'Invalid' }, { status: 400 });
  }
  
  // Procesar...
}
```

### 2. **Variables de Entorno**

```typescript
// ✅ Prefijo NEXT_PUBLIC_ solo para variables públicas
NEXT_PUBLIC_SANITY_PROJECT_ID=...  // OK exponer
STRIPE_SECRET_KEY=...               // NUNCA exponer

// En código:
const publicKey = process.env.NEXT_PUBLIC_STRIPE_KEY; // Cliente
const secretKey = process.env.STRIPE_SECRET_KEY;      // Solo servidor
```

---

## 📱 Responsive Design

### Mobile-First

```css
/* ✅ Base (mobile) */
.card {
  padding: 1rem;
  grid-template-columns: 1fr;
}

/* ✅ Tablet y arriba */
@media (min-width: 768px) {
  .card {
    padding: 2rem;
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ✅ Desktop */
@media (min-width: 1024px) {
  .card {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Breakpoints Estándar

```typescript
export const breakpoints = {
  sm: '640px',   // Mobile grande
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Desktop grande
  '2xl': '1536px' // Ultra wide
};
```

---

## 🧪 Testing (Futuro)

### Pirámide de Testing

```
        /\
       /  \    E2E Tests (pocos, críticos)
      /____\
     /      \  Integration Tests
    /________\
   /          \ Unit Tests (muchos, rápidos)
  /__________\
```

**Prioridades:**
1. Unit tests para utilidades y helpers
2. Integration tests para componentes complejos
3. E2E para flujos críticos (checkout, registro)

---

## 🚀 Performance

### 1. **Optimización de Imágenes**

```typescript
// ✅ Siempre usar Next Image
import Image from 'next/image';

<Image
  src={terrarium.image}
  alt={terrarium.name}
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={terrarium.blurHash}
/>
```

### 2. **Code Splitting**

```typescript
// ✅ Lazy load componentes pesados
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  loading: () => <Skeleton />,
  ssr: false // No renderizar en servidor si no es necesario
});
```

### 3. **Caché Strategy**

```typescript
// ✅ Revalidación incremental
export const revalidate = 3600; // 1 hora

// ✅ Caché agresivo para assets estáticos
export const metadata = {
  icons: {
    icon: '/logo.svg',
  },
};
```

---

## 📦 Deployment

### Vercel (Recomendado)

```bash
# Producción
vercel --prod

# Preview
vercel
```

### Variables de Entorno Requeridas

```bash
# CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=

# Pagos
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Auth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Video
VIMEO_ACCESS_TOKEN=

# Email
RESEND_API_KEY=
```

---

## 🎯 Convenciones de Código

### Naming

```typescript
// ✅ Componentes: PascalCase
export function TerrariumCard() {}

// ✅ Funciones/variables: camelCase
const getUserCourses = () => {};

// ✅ Constantes: SCREAMING_SNAKE_CASE
const MAX_CART_ITEMS = 50;

// ✅ Types/Interfaces: PascalCase con I prefix para interfaces
interface ITerrariumProps {}
type Terrarium = {};
```

### Imports Order

```typescript
// 1. React/Next
import { useState } from 'react';
import Image from 'next/image';

// 2. External libraries
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

// 3. Internal absolute imports
import { Button } from '@/components/ui';
import { useCar } from '@/hooks/useCart';

// 4. Relative imports
import { TerrariumCard } from './TerrariumCard';

// 5. Types
import type { Terrarium } from '@/types';

// 6. Styles (si aplica)
import styles from './styles.module.css';
```

---

## 🔮 Escalabilidad Futura

### Preparado para:

1. **Internacionalización (i18n)**
   - Estructura de carpetas soporta `/es/`, `/en/`
   - Copy centralizado en `lib/constants/copy.ts`

2. **Multi-tenant**
   - Si Tomás quiere white-label para otros artistas
   - Arquitectura modular lo permite

3. **App Móvil**
   - API routes pueden servir a React Native
   - Sanity CMS sirve a cualquier cliente

4. **Analytics avanzado**
   - Estructura de eventos lista para implementar

---

## 📚 Recursos y Referencias

- [Next.js Docs](https://nextjs.org/docs)
- [Sanity Docs](https://www.sanity.io/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Stripe Docs](https://stripe.com/docs)
- [React Patterns](https://reactpatterns.com/)

---

**Última actualización:** Noviembre 2025
**Mantenedor:** Sistema de Arquitectura comoelmusguito

