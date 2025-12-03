# 🌿 comoelmusguito

> Terrarios artesanales y cursos online para crear ecosistemas autosustentables

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)

---

## 🎯 Sobre el Proyecto

**comoelmusguito** es la plataforma digital de Tomás Barrera, artista y educador especializado en terrarios. Este proyecto no es solo un e-commerce, es una **experiencia narrativa** que combina:

- 🌱 Venta de terrarios artesanales únicos
- 🎓 Cursos online de creación de terrarios
- 🤝 Talleres presenciales en Chile
- ✍️ Contenido educativo sobre ecosistemas

### Filosofía de Diseño

Este sitio web prioriza la **experiencia sobre la transacción**. No es una tienda convencional, sino un viaje visual e interactivo donde:

1. La **historia** viene primero
2. El **arte** de Tomás es protagonista
3. La **educación** es fundamental
4. La **venta** es una consecuencia natural

---

## 🏗️ Arquitectura

### Stack Tecnológico

```
Frontend:
├── Next.js 16 (App Router)
├── React 19
├── TypeScript 5
├── Tailwind CSS 4
├── Framer Motion (animaciones)
└── Lucide React (iconos)

CMS:
├── Sanity.io (headless CMS)
└── Structured Content

Pagos:
└── Stripe (multi-moneda)

Video:
└── Vimeo Pro (CDN optimizado)

Deployment:
└── Vercel (recomendado)
```

### Características Principales

✅ **SEO-First**: Optimizado desde el día 1  
✅ **Performance**: Core Web Vitals en verde  
✅ **Responsive**: Mobile-first design  
✅ **Accessible**: WCAG AA compliance  
✅ **i18n Ready**: Preparado para multi-idioma  
✅ **Analytics**: Privacy-first tracking  
✅ **Modular**: Integraciones intercambiables

---

## 🚀 Instalación

### Prerequisitos

- Node.js 20+
- npm o pnpm
- Cuenta Sanity.io (gratuita)
- Cuenta Stripe (opcional para desarrollo)

### Setup Local

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/comoelmusguito.git
cd comoelmusguito

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno
cp env.example .env.local

# 4. Editar .env.local con tus credenciales
nano .env.local

# 5. Correr en desarrollo
npm run dev
```

El sitio estará disponible en [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Configuración

### Variables de Entorno Mínimas

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SANITY_PROJECT_ID=tu_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

Ver `env.example` para la lista completa.

### Configurar Sanity

```bash
# Instalar CLI de Sanity
npm install -g @sanity/cli

# Iniciar proyecto Sanity
npx sanity init

# Ejecutar Sanity Studio
npm run sanity
```

---

## 📁 Estructura del Proyecto

```
comoelmusguito/
│
├── app/                    # Next.js App Router
│   ├── (main)/            # Rutas principales
│   ├── (dashboard)/       # Área autenticada
│   ├── api/               # API Routes
│   ├── sitemap.ts         # Sitemap dinámico
│   └── robots.ts          # Robots.txt
│
├── components/            # Componentes React
│   ├── ui/               # Componentes base
│   ├── shared/           # Compartidos (Header, Footer)
│   ├── sections/         # Secciones narrativas
│   └── animations/       # Componentes animados
│
├── lib/                   # Lógica de negocio
│   ├── sanity/           # Cliente y queries CMS
│   ├── payments/         # Integración Stripe
│   ├── seo/              # Utilidades SEO
│   └── utils/            # Helpers generales
│
├── docs/                  # Documentación
│   ├── UI_GUIDELINES.md  # Guía de diseño
│   ├── COMPONENTS.md     # Docs componentes
│   └── SEO.md            # Estrategia SEO
│
├── ARCHITECTURE.md        # Arquitectura del sistema
└── README.md             # Este archivo
```

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para detalles completos.

---

## 🎨 Sistema de Diseño

### Paleta de Colores: "Bosque Húmedo"

```css
--musgo: #2D5016      /* Verde musgo profundo */
--tierra: #8B6F47     /* Tierra rica */
--vida: #6B9362       /* Verde vida */
--ambar: #D4A574      /* Ámbar solar */
```

### Tipografías

- **Títulos**: Playfair Display (Serif elegante)
- **Body**: Inter (Sans-serif moderna)

Ver [docs/UI_GUIDELINES.md](./docs/UI_GUIDELINES.md) para guía completa.

---

## 🔍 SEO

### Características SEO

✅ Metadata dinámica por página  
✅ Sitemap.xml automático  
✅ Robots.txt configurado  
✅ Structured Data (JSON-LD)  
✅ Open Graph completo  
✅ URLs semánticas  
✅ Alt text en todas las imágenes  
✅ Core Web Vitals optimizados

### Verificación SEO

```bash
# Lighthouse CI
npm run lighthouse

# Generar reporte SEO
npm run seo-audit
```

Ver [docs/SEO.md](./docs/SEO.md) para estrategia completa.

---

## 🧩 Componentes

### Componentes Base (UI)

```tsx
import { Button, Card, Input, Modal } from '@/components/ui';

<Button variant="primary">Adoptar Terrario</Button>
<Card hover>
  <Card.Image src="..." />
  <Card.Content>...</Card.Content>
</Card>
```

### Animaciones

```tsx
import { FadeIn, ParallaxImage } from '@/components/animations';

<FadeIn direction="up" delay={0.2}>
  <h2>Título animado</h2>
</FadeIn>
```

Ver [docs/COMPONENTS.md](./docs/COMPONENTS.md) para documentación completa.

---

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor desarrollo

# Producción
npm run build        # Build optimizado
npm run start        # Servidor producción
npm run lint         # Linter

# Sanity
npm run sanity       # Sanity Studio

# Testing (futuro)
npm run test         # Tests unitarios
npm run test:e2e     # Tests end-to-end

# Utilidades
npm run type-check   # Verificar TypeScript
npm run format       # Formatear código
```

---

## 🚢 Deployment

### Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Production
vercel --prod
```

### Variables de Entorno en Vercel

Agregar todas las variables de `env.example` en:
**Project Settings → Environment Variables**

---

## 🤝 Contribución

Este es un proyecto privado, pero si trabajas en él:

### Workflow

1. Crear branch desde `main`
2. Hacer cambios siguiendo guías de estilo
3. Commit con mensajes descriptivos
4. Pull request con descripción detallada

### Convenciones

- **Commits**: Usar [Conventional Commits](https://www.conventionalcommits.org/)
- **Branches**: `feature/nombre`, `fix/nombre`, `docs/nombre`
- **Código**: Seguir [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 📚 Documentación Adicional

- [Arquitectura](./ARCHITECTURE.md) - Estructura y patrones
- [UI Guidelines](./docs/UI_GUIDELINES.md) - Sistema de diseño
- [Componentes](./docs/COMPONENTS.md) - Librería de componentes
- [SEO](./docs/SEO.md) - Estrategia SEO completa

---

## 🔗 Enlaces

- **Sitio Web**: [comoelmusguito.cl](https://comoelmusguito.cl)
- **Instagram**: [@comoelmusguito](https://www.instagram.com/comoelmusguito)
- **YouTube**: [@comoelmusguito](https://www.youtube.com/@comoelmusguito)

---

## 📄 Licencia

© 2025 Tomás Barrera (comoelmusguito). Todos los derechos reservados.

---

## 💚 Mantenido con ❤️ por

**Tomás Barrera** - Artista y Educador  
**Sistema de Desarrollo comoelmusguito**

---

## 🌱 Roadmap

### Fase 1: MVP (Actual)
- [x] Estructura base Next.js
- [x] Sistema de diseño
- [x] Documentación completa
- [ ] Integración Sanity
- [ ] Páginas principales
- [ ] Componentes UI base

### Fase 2: E-commerce
- [ ] Catálogo terrarios
- [ ] Carrito de compras
- [ ] Integración Stripe
- [ ] Sistema de órdenes

### Fase 3: Cursos
- [ ] Plataforma LMS
- [ ] Video player
- [ ] Progreso estudiantes
- [ ] Certificados

### Fase 4: Comunidad
- [ ] Blog activo
- [ ] Newsletter
- [ ] Galería comunidad
- [ ] Reviews y testimonios

### Fase 5: Internacionalización
- [ ] Multi-idioma (EN)
- [ ] Multi-moneda
- [ ] Envíos internacionales

---

**¡Crea vida en cualquier lugar!** 🌿✨
