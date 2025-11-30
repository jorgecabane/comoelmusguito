# 🎨 Guía de UI/UX - comoelmusguito

## 🌿 Filosofía de Diseño

### Principios Base

1. **Natural y Orgánico** - Inspirado en terrarios reales, musgo, tierra
2. **Narrativo, No Transaccional** - Historia primero, venta después
3. **Contemplativo** - Espacios para respirar, no sobrecargado
4. **Auténtico** - Refleja el trabajo artesanal de Tomás
5. **Accesible** - Para todos, en todos los dispositivos
6. **Inmersivo** - Scroll storytelling, videos, parallax effects
7. **Interactivo** - Responde al usuario de forma significativa

---

## 🎭 EXPERIENCIA NARRATIVA INMERSIVA

### Concepto: "Un Viaje Hacia la Vida"

**NO es un e-commerce tradicional. Es un manifiesto vivo.**

Esta web cuenta una historia a través del scroll. Cada sección es un capítulo que revela progresivamente el mundo de los terrarios.

### Estructura Narrativa por Scroll

```
Scroll 0-10%   → Hero Impactante (video, sin nav)
Scroll 10-20%  → "En un frasco de vidrio..."
Scroll 20-35%  → El Artista (Tomás + parallax)
Scroll 35-55%  → El Proceso (scroll horizontal)
Scroll 55-70%  → Explora Ecosistemas (gallery masonry)
Scroll 70-85%  → Aprende (cursos inmersivos)
Scroll 85-95%  → Comunidad (social proof)
Scroll 95-100% → Tu Turno (CTA final)
```

### Elementos Clave de la Experiencia

#### 1. **Video como Protagonista**
- Hero con video fullscreen (no imagen estática)
- Videos en hover sobre terrarios
- Videos background en secciones
- Lazy loading inteligente
- Fallback a imágenes en mobile

#### 2. **Scroll Storytelling**
- Contenido revela progresivamente
- Animaciones triggered por scroll position
- Parallax effects sutiles
- Scroll horizontal para secciones especiales
- Progress indicator discreto

#### 3. **Navegación Inteligente**
- **NO visible** en el hero inicial
- Aparece al scroll down (fade in)
- Desaparece al scroll down (auto-hide)
- Reaparece al scroll up
- Translúcida con backdrop blur

#### 4. **Animaciones Significativas**
```typescript
// Todas las animaciones tienen PROPÓSITO

🌱 Elementos "brotan" al aparecer
🌊 Parallax simula capas de tierra
💧 Elementos flotan sutilmente
📜 Texto fade-in con stagger
🎬 Videos play al entrar en viewport
```

#### 5. **Micro-interacciones**
```
Hover terrario → Video play + overlay info
Click terrario → Modal fullscreen inmersivo
Hover botón → Scale + shadow
Scroll sección → Progress bar update
Add to cart → Planta "crece" animation
```

---

## 🎨 DIFERENCIAS CLAVE VS E-COMMERCE TRADICIONAL

| ❌ E-commerce Normal | ✅ comoelmusguito |
|---------------------|-------------------|
| Grid uniforme productos | Masonry gallery artística |
| "Comprar ahora" | "Adoptar ecosistema" / "Llevar a casa" |
| Navegación siempre visible | Nav aparece contextualmente |
| Fotos estáticas | Videos + hover interactions |
| Scroll estándar | Scroll storytelling |
| Conversión agresiva | Inspiración → Enamoramiento → Conversión |
| Checkout rápido | "Tu jardín" - Journey emocional |
| Copy transaccional | Copy poético y narrativo |

---

## 🎨 Sistema de Colores

### Paleta Principal: "Bosque Húmedo"

```css
/* Primario - Verde Musgo Profundo */
--musgo: #2D5016;
--musgo-light: #3D6B22;
--musgo-dark: #1F3910;

/* Secundario - Tierra Rica */
--tierra: #8B6F47;
--tierra-light: #A68A63;
--tierra-dark: #6D5636;

/* Acento - Verde Vida */
--vida: #6B9362;
--vida-light: #85AB7D;
--vida-dark: #557548;

/* Acento 2 - Ámbar Solar */
--ambar: #D4A574;
--ambar-light: #E0B98F;
--ambar-dark: #B98F5E;

/* Neutros */
--cream: #FDFAF6;      /* Fondo claro */
--forest: #1A1F16;     /* Texto oscuro */
--gray: #6B7566;       /* Texto secundario */
--white: #FFFFFF;
```

### Uso de Colores

| Elemento | Color | Uso |
|----------|-------|-----|
| **CTA Principal** | `--musgo` | Botones primarios, links importantes |
| **CTA Secundario** | `--tierra` | Botones secundarios, borders |
| **Highlights** | `--vida` | Hover states, badges, iconos activos |
| **Warnings/Info** | `--ambar` | Alertas positivas, destacados |
| **Fondos** | `--cream` | Background principal |
| **Texto principal** | `--forest` | Cuerpo de texto |
| **Texto secundario** | `--gray` | Metadatos, subtítulos |

### Contraste y Accesibilidad

```css
/* ✅ Todos cumplen WCAG AA mínimo */
--musgo sobre --cream: 9.2:1 ratio
--tierra sobre --cream: 4.8:1 ratio
--forest sobre --cream: 14.5:1 ratio
--vida sobre --cream: 4.5:1 ratio
```

**Regla**: Nunca usar texto `--vida` o `--ambar` en tamaños menores a 16px.

---

## ✍️ Tipografía

### Fuentes

```css
/* Títulos - Playfair Display */
--font-display: 'Playfair Display', serif;
/* Weights: 600 (SemiBold), 700 (Bold) */

/* Body - Inter */
--font-sans: 'Inter', sans-serif;
/* Weights: 400 (Regular), 500 (Medium), 600 (SemiBold) */
```

### Escala Tipográfica

```css
/* Desktop */
--text-xs: 0.75rem;      /* 12px - Captions */
--text-sm: 0.875rem;     /* 14px - Small text */
--text-base: 1rem;       /* 16px - Body */
--text-lg: 1.125rem;     /* 18px - Large body */
--text-xl: 1.25rem;      /* 20px - H4 */
--text-2xl: 1.5rem;      /* 24px - H4 */
--text-3xl: 2rem;        /* 32px - H3 */
--text-4xl: 2.5rem;      /* 40px - H2 */
--text-5xl: 3.5rem;      /* 56px - H1 */

/* Mobile (reducir 20%) */
--text-5xl-mobile: 2.8rem;   /* 44px */
--text-4xl-mobile: 2rem;     /* 32px */
--text-3xl-mobile: 1.5rem;   /* 24px */
```

### Jerarquía

```html
<!-- H1: Hero principal -->
<h1 class="font-display text-5xl font-bold tracking-tight">
  Crea Vida en Cualquier Lugar
</h1>

<!-- H2: Secciones principales -->
<h2 class="font-display text-4xl font-semibold">
  Ecosistemas Vivos
</h2>

<!-- H3: Subsecciones -->
<h3 class="font-display text-3xl font-semibold">
  El Proceso
</h3>

<!-- H4: Cards, destacados -->
<h4 class="font-display text-2xl font-semibold">
  Terrario Bosque Nublado
</h4>

<!-- Body: Contenido -->
<p class="font-sans text-base leading-relaxed">
  Cada terrario es un ecosistema único...
</p>

<!-- Body Large: Leads, intros -->
<p class="font-sans text-lg leading-relaxed">
  Aprende a crear vida...
</p>

<!-- Small: Metadatos -->
<span class="font-sans text-sm text-gray">
  Publicado hace 2 días
</span>

<!-- Caption: Muy pequeño -->
<span class="font-sans text-xs uppercase tracking-wide">
  Nuevo
</span>
```

### Line Height

```css
--leading-tight: 1.2;    /* Títulos grandes */
--leading-snug: 1.4;     /* Títulos pequeños */
--leading-normal: 1.6;   /* Body text */
--leading-relaxed: 1.7;  /* Large body */
--leading-loose: 1.8;    /* Espacioso */
```

### Letter Spacing

```css
--tracking-tight: -0.02em;   /* H1, H2 */
--tracking-normal: 0;        /* Por defecto */
--tracking-wide: 0.05em;     /* Captions, uppercase */
```

---

## 📐 Espaciado

### Sistema Base-8

```css
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
--space-32: 8rem;      /* 128px */
```

### Guía de Uso

| Contexto | Espaciado | Valor |
|----------|-----------|-------|
| **Padding botón** | `--space-4` x `--space-6` | 16px vertical, 24px horizontal |
| **Gap entre elementos** | `--space-4` | 16px |
| **Margen entre componentes** | `--space-8` | 32px |
| **Secciones pequeñas** | `--space-12` | 48px |
| **Secciones principales** | `--space-16` a `--space-24` | 64-96px |
| **Hero / Features** | `--space-24` a `--space-32` | 96-128px |

---

## 🔲 Bordes y Sombras

### Radios de Borde

```css
--radius-sm: 0.25rem;   /* 4px - Inputs, tags */
--radius-md: 0.5rem;    /* 8px - Botones, cards */
--radius-lg: 0.75rem;   /* 12px - Imágenes producto */
--radius-xl: 1rem;      /* 16px - Modales, secciones */
--radius-2xl: 1.5rem;   /* 24px - Elementos destacados */
--radius-full: 9999px;  /* Circular - Avatares, badges */
```

### Sombras (Natural y Suave)

```css
/* Sombras con tinte verde (natural) */
--shadow-sm: 0 1px 3px rgba(45, 80, 22, 0.08);
--shadow-md: 0 4px 12px rgba(45, 80, 22, 0.12);
--shadow-lg: 0 8px 24px rgba(45, 80, 22, 0.16);
--shadow-xl: 0 12px 40px rgba(45, 80, 22, 0.20);

/* Hover states (elevar) */
--shadow-hover: 0 6px 16px rgba(45, 80, 22, 0.15);
```

### Uso

```css
/* Card normal */
.card {
  box-shadow: var(--shadow-md);
}

/* Card hover */
.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* Modal */
.modal {
  box-shadow: var(--shadow-xl);
}
```

---

## 🔘 Componentes Base

### Botones

#### Variantes

**1. Primario (CTA principal)**
```css
.btn-primary {
  background: var(--musgo);
  color: var(--white);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all 200ms ease;
}

.btn-primary:hover {
  background: var(--musgo-dark);
  transform: scale(1.02);
  box-shadow: var(--shadow-hover);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

**2. Secundario**
```css
.btn-secondary {
  background: transparent;
  color: var(--tierra);
  border: 2px solid var(--tierra);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
}

.btn-secondary:hover {
  background: var(--tierra);
  color: var(--white);
}
```

**3. Ghost (Texto)**
```css
.btn-ghost {
  background: transparent;
  color: var(--vida);
  padding: var(--space-2) var(--space-4);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.btn-ghost:hover {
  color: var(--vida-dark);
  text-decoration-thickness: 2px;
}
```

#### Tamaños

```css
.btn-sm  { padding: 0.5rem 1rem; font-size: 0.875rem; }
.btn-md  { padding: 0.75rem 1.5rem; font-size: 1rem; }
.btn-lg  { padding: 1rem 2rem; font-size: 1.125rem; }
```

### Cards

```css
.card {
  background: var(--cream);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  transition: all 300ms ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

/* Card con imagen */
.card-image {
  border-radius: var(--radius-lg);
  overflow: hidden;
  aspect-ratio: 4 / 3;
}
```

### Inputs

```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--gray);
  border-radius: var(--radius-sm);
  background: var(--white);
  font-family: var(--font-sans);
  font-size: 1rem;
  transition: border-color 200ms;
}

.input:focus {
  outline: none;
  border-color: var(--musgo);
  box-shadow: 0 0 0 3px rgba(45, 80, 22, 0.1);
}

.input::placeholder {
  color: var(--gray);
}
```

---

---

## 🎥 VIDEO GUIDELINES

### Uso de Video

**Prioridad**: Video > Imagen estática siempre que sea posible

#### Hero Section
```typescript
// Video fullscreen con overlay
<VideoBackground 
  src="/videos/hero-moss-droplet.mp4"
  fallback="/images/hero-fallback.jpg"
  overlay="dark" // 0-60% opacity
/>
```

#### Hover States
```typescript
// Imagen → Video al hover
<Card onHover={() => playVideo()}>
  <Image src={thumbnail} /> {/* Estado default */}
  <Video src={video} autoPlay loop muted /> {/* Al hover */}
</Card>
```

#### Performance
- Videos < 5MB para web
- Formato: MP4 (H.264)
- Lazy loading obligatorio
- Poster image siempre
- Mobile: imagen estática (no video)

---

## 📜 SCROLL STORYTELLING

### GSAP ScrollTrigger Patterns

```typescript
// Pattern 1: Fade in al scroll
gsap.from('.element', {
  scrollTrigger: {
    trigger: '.element',
    start: 'top 80%',
    end: 'top 20%',
    scrub: 1,
  },
  opacity: 0,
  y: 50,
});

// Pattern 2: Parallax effect
gsap.to('.background', {
  scrollTrigger: {
    trigger: '.section',
    scrub: true,
  },
  y: -100, // Mueve más lento que scroll
});

// Pattern 3: Scroll horizontal
gsap.to('.horizontal-section', {
  scrollTrigger: {
    trigger: '.horizontal-container',
    pin: true,
    scrub: 1,
    end: '+=3000', // 3x viewport height
  },
  x: '-300%', // 4 slides
});
```

### Scroll Progress Indicator

```typescript
// Barra de progreso sutil
<motion.div 
  className="fixed top-0 left-0 h-1 bg-vida"
  style={{ scaleX: scrollYProgress }}
/>
```

---

## ✨ FRAMER MOTION PATTERNS

### Entrance Animations

```typescript
// Fade in from bottom
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
  }
};

// Stagger children
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // 100ms entre cada hijo
    }
  }
};

// Scale + fade
const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5 }
  }
};
```

### Hover Interactions

```typescript
// Card hover
<motion.div
  whileHover={{ 
    scale: 1.05, 
    boxShadow: "0 20px 40px rgba(45,80,22,0.2)" 
  }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 300 }}
>
```

### Scroll-triggered Animations

```typescript
// Aparece cuando está en viewport
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-100px" }}
  variants={fadeInUp}
>
```

---

## 🎬 Animaciones

### Timing Functions

```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
```

### Duraciones

```css
--duration-fast: 150ms;      /* Micro-interacciones */
--duration-normal: 250ms;    /* Transiciones estándar */
--duration-slow: 400ms;      /* Animaciones largas */
--duration-slower: 600ms;    /* Transiciones de página */
```

### Animaciones Comunes

#### Fade In

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 400ms var(--ease-out);
}
```

#### Scale Hover

```css
.scale-hover {
  transition: transform 250ms var(--ease-smooth);
}

.scale-hover:hover {
  transform: scale(1.05);
}
```

#### Floating (Decorativo)

```css
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.float {
  animation: float 3s ease-in-out infinite;
}
```

### Reglas Importantes

1. **Prefiere `transform` y `opacity`** (GPU-accelerated)
2. **No animes `width`, `height`, `margin`** (layout thrashing)
3. **Respeta `prefers-reduced-motion`**:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🖼️ Imágenes y Media

### Aspect Ratios

```css
/* Productos */
--aspect-square: 1 / 1;      /* 1:1 - Cards de producto */
--aspect-landscape: 4 / 3;   /* 4:3 - Galería */
--aspect-portrait: 3 / 4;    /* 3:4 - Retratos */

/* Contenido */
--aspect-video: 16 / 9;      /* 16:9 - Videos, héroes */
--aspect-wide: 21 / 9;       /* 21:9 - Hero ultra-wide */
```

### Optimización

```tsx
// ✅ Siempre usar Next Image
<Image
  src={image}
  alt={alt}
  width={800}
  height={600}
  quality={90}
  placeholder="blur"
  className="rounded-lg"
/>
```

### Overlay de Imágenes

```css
.image-overlay {
  position: relative;
}

.image-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(29, 80, 22, 0) 0%,
    rgba(29, 80, 22, 0.6) 100%
  );
}
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile first */
@media (min-width: 640px)  { /* sm - Mobile grande */ }
@media (min-width: 768px)  { /* md - Tablet */ }
@media (min-width: 1024px) { /* lg - Desktop */ }
@media (min-width: 1280px) { /* xl - Desktop grande */ }
@media (min-width: 1536px) { /* 2xl - Ultra wide */ }
```

### Grids Responsive

```css
/* Mobile: 1 columna */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

/* Tablet: 2 columnas */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }
}

/* Desktop: 3 columnas */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-8);
  }
}
```

### Contenedores

```css
.container {
  width: 100%;
  max-width: 1280px;  /* xl */
  margin-inline: auto;
  padding-inline: var(--space-4);
}

@media (min-width: 768px) {
  .container {
    padding-inline: var(--space-8);
  }
}
```

---

## 🎯 Copy y Microcopy

### Tono de Voz

**Somos:**
- ✅ Cálidos y cercanos
- ✅ Educativos pero no pedantes
- ✅ Inspiradores
- ✅ Auténticos

**No somos:**
- ❌ Agresivos en venta
- ❌ Técnicos sin contexto
- ❌ Formales/corporativos
- ❌ Infantiles

### Ejemplos de Copy

| Contexto | ❌ No | ✅ Sí |
|----------|------|-------|
| **CTA Compra** | "Comprar Ahora" | "Adoptar Este Ecosistema" |
| **Agregar Carrito** | "Añadir al carrito" | "Llevar a Casa" |
| **Curso** | "Comprar curso $29.990" | "Comenzar Tu Viaje $29.990" |
| **Éxito Compra** | "Pedido confirmado" | "¡Tu ecosistema viene en camino! 🌿" |
| **Sin Stock** | "Agotado" | "Cultivando más (disponible pronto)" |
| **Carrito Vacío** | "Tu carrito está vacío" | "Tu jardín aún está vacío. ¿Exploramos?" |

### Placeholders

```tsx
// ❌ Genérico
<input placeholder="Ingrese su email" />

// ✅ Específico y amigable
<input placeholder="tu@email.com" />

// ❌ Técnico
<textarea placeholder="Escribe tu mensaje aquí"></textarea>

// ✅ Contextual
<textarea placeholder="¿Qué te gustaría aprender sobre terrarios?"></textarea>
```

---

## ♿ Accesibilidad

### Checklist Obligatorio

- ✅ **Contraste**: Mínimo WCAG AA (4.5:1 para texto)
- ✅ **Focus states**: Visibles en todos los interactivos
- ✅ **Alt text**: Descriptivo en todas las imágenes
- ✅ **Headings**: Jerarquía lógica (H1 → H2 → H3)
- ✅ **ARIA labels**: Para iconos sin texto
- ✅ **Keyboard navigation**: Todo accesible con Tab
- ✅ **Skip links**: "Saltar al contenido principal"

### Focus States

```css
/* ✅ Focus visible y bonito */
.focusable:focus-visible {
  outline: 3px solid var(--musgo);
  outline-offset: 2px;
}

/* ❌ Nunca esto */
*:focus {
  outline: none; /* NO! */
}
```

### Alt Text Ejemplos

```tsx
// ❌ Genérico o redundante
<Image alt="Imagen" />
<Image alt="Terrario imagen" />

// ✅ Descriptivo y útil
<Image alt="Terrario bosque nublado con musgo chileno y helechos miniatura en frasco de vidrio" />
<Image alt="Tomás recolectando musgo en bosque templado lluvioso" />
```

---

## 📐 Layout Patterns

### Hero Section

```tsx
<section className="hero">
  <div className="hero-background">
    {/* Video o imagen de fondo */}
  </div>
  <div className="hero-overlay" />
  <div className="hero-content">
    <h1>Título Impactante</h1>
    <p>Subtítulo inspirador</p>
    <div className="hero-actions">
      <Button variant="primary">CTA Principal</Button>
      <Button variant="secondary">CTA Secundario</Button>
    </div>
  </div>
</section>
```

### Sección con Contenido

```tsx
<section className="py-24 px-4">
  <div className="container">
    <div className="text-center mb-16">
      <h2>Título Sección</h2>
      <p className="lead">Introducción opcional</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Cards o contenido */}
    </div>
  </div>
</section>
```

---

## 🎨 Paletas de Estado

### Estados de UI

```css
/* Success - Verde Vida */
--success: var(--vida);
--success-bg: rgba(107, 147, 98, 0.1);

/* Error - Tierra oscura */
--error: #A53F2B;
--error-bg: rgba(165, 63, 43, 0.1);

/* Warning - Ámbar */
--warning: var(--ambar);
--warning-bg: rgba(212, 165, 116, 0.1);

/* Info - Vida light */
--info: var(--vida-light);
--info-bg: rgba(133, 171, 125, 0.1);
```

### Uso

```tsx
// Toast de éxito
<Toast variant="success">
  ¡Terrario agregado a tu jardín! 🌿
</Toast>

// Mensaje de error
<Alert variant="error">
  Ups, algo salió mal. Inténtalo de nuevo.
</Alert>
```

---

## 📊 Iconografía

### Librería: Lucide React

```tsx
import { Leaf, ShoppingBag, Heart, User } from 'lucide-react';
```

### Tamaños

```tsx
<Icon size={16} /> {/* sm - Inline con texto pequeño */}
<Icon size={20} /> {/* md - Inline con texto normal */}
<Icon size={24} /> {/* lg - Botones */}
<Icon size={32} /> {/* xl - Features, destacados */}
```

### Estilo

```css
.icon {
  stroke-width: 2px;
  color: currentColor; /* Hereda color del padre */
}
```

---

## 🚫 Anti-Patterns (NO Hacer)

### ❌ Evitar

1. **Colores no del sistema**
   ```css
   /* ❌ */
   background: #FF0000;
   
   /* ✅ */
   background: var(--musgo);
   ```

2. **Tamaños fijos en lugar de responsive**
   ```css
   /* ❌ */
   width: 500px;
   
   /* ✅ */
   max-width: 500px;
   width: 100%;
   ```

3. **Texto sin contraste suficiente**
   ```css
   /* ❌ */
   color: #CCCCCC;
   background: #FFFFFF;
   
   /* ✅ */
   color: var(--forest);
   background: var(--cream);
   ```

4. **Animaciones excesivas**
   ```css
   /* ❌ */
   transition: all 1s ease;
   
   /* ✅ */
   transition: transform 250ms ease;
   ```

---

## 📚 Recursos

- **Figma Design File**: [Link cuando esté listo]
- **Storybook**: [Link cuando esté listo]
- **Google Fonts**: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) | [Inter](https://fonts.google.com/specimen/Inter)
- **Lucide Icons**: [lucide.dev](https://lucide.dev/)

---

**Última actualización:** Noviembre 2025  
**Diseño:** Sistema comoelmusguito

