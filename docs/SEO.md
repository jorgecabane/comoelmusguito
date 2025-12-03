# 🔍 Estrategia SEO - comoelmusguito

## 🎯 Objetivos SEO

### Palabras Clave Objetivo (Chile)

**Primarias:**
- terrarios Chile
- terrarios artesanales Chile
- cómo hacer terrarios
- curso terrarios online
- taller terrarios Santiago

**Secundarias:**
- ecosistemas en frasco
- musgo para terrarios Chile
- plantas para terrarios
- terrarios cerrados
- terrarios decorativos
- regalos naturales Chile

**Long-tail:**
- "cómo hacer un terrario paso a paso"
- "dónde comprar terrarios en Santiago"
- "curso online terrarios autosustentables"
- "musgo nativo chileno para terrarios"
- "terrarios como regalo original"

**Internacionales (para cursos online):**
- terrarium workshop online
- how to make terrariums
- online terrarium course
- closed terrarium tutorial

---

## 🏗️ Arquitectura SEO-Friendly

### 1. Estructura de URLs

```
✅ URLs Semánticas y Limpias

Home:
https://comoelmusguito.cl/

Terrarios (Tienda):
https://comoelmusguito.cl/terrarios
https://comoelmusguito.cl/terrarios/bosque-nublado
https://comoelmusguito.cl/terrarios/desertico-suculentas

Cursos Online:
https://comoelmusguito.cl/cursos
https://comoelmusguito.cl/cursos/terrarios-desde-cero
https://comoelmusguito.cl/cursos/terrarios-avanzado

Talleres Presenciales:
https://comoelmusguito.cl/talleres
https://comoelmusguito.cl/talleres/terrario-bosque-santiago-diciembre

Blog/Recursos:
https://comoelmusguito.cl/blog
https://comoelmusguito.cl/blog/como-cuidar-musgo-terrario
https://comoelmusguito.cl/blog/plantas-nativas-terrarios-chile

Sobre:
https://comoelmusguito.cl/sobre
https://comoelmusguito.cl/contacto

❌ URLs a Evitar:
https://comoelmusguito.cl/products?id=123
https://comoelmusguito.cl/p/terrarium-1
https://comoelmusguito.cl/index.php?page=courses
```

### 2. Jerarquía de Contenido

```
Home (Authority Page)
├── Terrarios (Category)
│   ├── Bosque (Product)
│   ├── Desierto (Product)
│   └── Tropical (Product)
│
├── Cursos Online (Category)
│   ├── Desde Cero (Product)
│   └── Avanzado (Product)
│
├── Talleres (Category)
│   └── [Taller Individual] (Event)
│
├── Blog (Content Hub)
│   ├── Tutoriales
│   ├── Cuidados
│   └── Inspiración
│
└── Sobre (About)
```

---

## 📄 Metadata por Página

### Next.js 14 Metadata API

#### Home Page

```typescript
// app/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'comoelmusguito - Terrarios Artesanales y Cursos Online | Tomás Barrera',
  description: 'Descubre terrarios artesanales únicos y aprende a crear ecosistemas autosustentables con el Musguito. Cursos online, talleres presenciales y terrarios hechos a mano en Chile.',
  keywords: [
    'terrarios Chile',
    'terrarios artesanales',
    'curso terrarios online',
    'taller terrarios Santiago',
    'ecosistemas en frasco',
    'musgo terrarios',
    'Tomás Barrera',
    'comoelmusguito'
  ],
  authors: [{ name: 'Tomás Barrera (comoelmusguito)' }],
  creator: 'Tomás Barrera',
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://comoelmusguito.cl',
    siteName: 'comoelmusguito',
    title: 'comoelmusguito - Crea Vida en Cualquier Lugar',
    description: 'Terrarios artesanales únicos y cursos para aprender a crear ecosistemas autosustentables.',
    images: [
      {
        url: '/og/home.jpg',
        width: 1200,
        height: 630,
        alt: 'Terrarios artesanales comoelmusguito',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'comoelmusguito - Terrarios Artesanales',
    description: 'Crea vida en cualquier lugar. Terrarios únicos y cursos online.',
    images: ['/og/home.jpg'],
    creator: '@comoelmusguito',
  },
  alternates: {
    canonical: 'https://comoelmusguito.cl',
    languages: {
      'es-CL': 'https://comoelmusguito.cl',
      'en': 'https://comoelmusguito.cl/en', // Futuro
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'tu-codigo-verificacion-google',
    yandex: 'tu-codigo-yandex',
  },
};
```

#### Producto Individual (Dynamic)

```typescript
// app/terrarios/[slug]/page.tsx
import { getTerrariumBySlug } from '@/lib/cms';

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const terrarium = await getTerrariumBySlug(params.slug);
  
  if (!terrarium) {
    return {
      title: 'Terrario no encontrado',
    };
  }
  
  return {
    title: `${terrarium.name} - Terrario Artesanal | comoelmusguito`,
    description: terrarium.description,
    keywords: [
      terrarium.name,
      'terrario artesanal',
      'terrario Chile',
      ...terrarium.plants.map(p => p.name),
      terrarium.category,
    ],
    openGraph: {
      type: 'product',
      title: terrarium.name,
      description: terrarium.description,
      images: terrarium.images.map(img => ({
        url: img.url,
        width: 1200,
        height: 1200,
        alt: `${terrarium.name} - Vista ${img.index + 1}`,
      })),
      url: `https://comoelmusguito.cl/terrarios/${params.slug}`,
    },
    alternates: {
      canonical: `https://comoelmusguito.cl/terrarios/${params.slug}`,
    },
  };
}
```

#### Curso

```typescript
// app/cursos/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const course = await getCourseBySlug(params.slug);
  
  return {
    title: `${course.name} - Curso Online | comoelmusguito`,
    description: `${course.description} Aprende a tu ritmo con ${course.lessonCount} lecciones en video.`,
    keywords: [
      'curso terrarios online',
      course.name,
      'aprender terrarios',
      'curso online Chile',
      ...course.topics,
    ],
    openGraph: {
      type: 'website',
      title: course.name,
      description: course.description,
      images: [course.thumbnail],
      url: `https://comoelmusguito.cl/cursos/${params.slug}`,
    },
  };
}
```

---

## 🗺️ Sitemap.xml

### Generación Dinámica

```typescript
// app/sitemap.ts
import { getTerrariums, getCourses, getBlogPosts } from '@/lib/cms';

export default async function sitemap() {
  const baseUrl = 'https://comoelmusguito.cl';
  
  // Páginas estáticas
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/terrarios`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cursos`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/talleres`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ];
  
  // Productos dinámicos
  const terrariums = await getTerrariums();
  const terrariumPages = terrariums.map((t) => ({
    url: `${baseUrl}/terrarios/${t.slug}`,
    lastModified: new Date(t.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  
  // Cursos
  const courses = await getCourses();
  const coursePages = courses.map((c) => ({
    url: `${baseUrl}/cursos/${c.slug}`,
    lastModified: new Date(c.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));
  
  // Blog posts
  const posts = await getBlogPosts();
  const blogPages = posts.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  
  return [...staticPages, ...terrariumPages, ...coursePages, ...blogPages];
}
```

---

## 🤖 Robots.txt

```typescript
// app/robots.ts
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/mis-cursos/',
          '/perfil/',
          '/admin/',
          '/_next/',
          '/checkout/',
        ],
      },
    ],
    sitemap: 'https://comoelmusguito.cl/sitemap.xml',
  };
}
```

---

## 📊 Structured Data (JSON-LD)

### Organización

```typescript
// components/seo/OrganizationSchema.tsx
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'comoelmusguito',
    alternateName: 'El Musguito',
    url: 'https://comoelmusguito.cl',
    logo: 'https://comoelmusguito.cl/logo.png',
    description: 'Terrarios artesanales y cursos online para crear ecosistemas autosustentables',
    founder: {
      '@type': 'Person',
      name: 'Tomás Barrera',
      jobTitle: 'Artista y Educador de Terrarios',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hola@comoelmusguito.cl',
      availableLanguage: ['Spanish', 'English'],
    },
    sameAs: [
      'https://www.instagram.com/comoelmusguito',
      'https://www.youtube.com/@comoelmusguito',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CL',
      addressLocality: 'Santiago',
    },
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### Producto

```typescript
// components/seo/ProductSchema.tsx
export function ProductSchema({ product }: { product: Terrarium }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map(img => img.url),
    brand: {
      '@type': 'Brand',
      name: 'comoelmusguito',
    },
    offers: {
      '@type': 'Offer',
      url: `https://comoelmusguito.cl/terrarios/${product.slug}`,
      priceCurrency: 'CLP',
      price: product.price,
      availability: product.inStock 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'comoelmusguito',
      },
    },
    aggregateRating: product.reviews?.length > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviews.length,
    } : undefined,
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### Curso (Educational Course)

```typescript
export function CourseSchema({ course }: { course: Course }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: 'comoelmusguito',
      url: 'https://comoelmusguito.cl',
    },
    image: course.thumbnail,
    offers: {
      '@type': 'Offer',
      category: 'Online',
      priceCurrency: 'CLP',
      price: course.price,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: `PT${course.duration}H`,
    },
    inLanguage: 'es',
    educationalLevel: course.level, // beginner, intermediate, advanced
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### Breadcrumbs

```typescript
export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### Artículo de Blog

```typescript
export function ArticleSchema({ post }: { post: BlogPost }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: `https://comoelmusguito.cl/sobre`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'comoelmusguito',
      logo: {
        '@type': 'ImageObject',
        url: 'https://comoelmusguito.cl/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://comoelmusguito.cl/blog/${post.slug}`,
    },
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### VideoObject (Para cursos con preview)

```typescript
export function VideoSchema({ video }: { video: Video }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnail,
    uploadDate: video.uploadedAt,
    duration: `PT${video.durationSeconds}S`,
    contentUrl: video.url,
    embedUrl: video.embedUrl,
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

---

## 🖼️ Optimización de Imágenes

### Next.js Image Component

```tsx
import Image from 'next/image';

// ✅ Siempre con alt descriptivo
<Image
  src={terrarium.image}
  alt="Terrario bosque nublado con musgo nativo chileno, helechos miniatura y piedras volcánicas en frasco de vidrio transparente"
  width={800}
  height={600}
  quality={85}
  priority={isAboveFold} // true para hero images
  placeholder="blur"
  blurDataURL={terrarium.blurHash}
/>
```

### Nombres de Archivo SEO

```
❌ Mal:
IMG_1234.jpg
photo.png
terrarium1.jpg

✅ Bien:
terrario-bosque-nublado-musgo-chileno.jpg
curso-terrarios-desde-cero-thumbnail.jpg
tomas-barrera-musguito-taller.jpg
```

### Formato y Compresión

- **Formato**: WebP con fallback a JPG
- **Compresión**: 80-85% quality
- **Dimensiones**: Múltiples tamaños (srcset)
- **Lazy loading**: Por defecto (excepto above the fold)

---

## 📝 Contenido SEO-Optimizado

### Estructura de Página Producto

```html
<article>
  <!-- H1: Nombre del producto (1 vez) -->
  <h1>Terrario Bosque Nublado - Ecosistema Autosustentable</h1>
  
  <!-- Descripción rica (150-300 palabras) -->
  <div>
    <p>
      Este terrario artesanal recrea un <strong>bosque nublado en miniatura</strong>,
      con <strong>musgo nativo chileno</strong> recolectado de forma sustentable
      y <strong>helechos miniatura</strong> cultivados por Tomás Barrera.
    </p>
    <!-- Más contenido natural... -->
  </div>
  
  <!-- H2: Características -->
  <h2>Qué Incluye Este Terrario</h2>
  <ul>
    <li>Musgo Dendroligotrichum dendroides (musgo nativo chileno)</li>
    <li>2-3 helechos miniatura</li>
    <li>Base de piedras volcánicas</li>
    <!-- ... -->
  </ul>
  
  <!-- H2: Cuidados -->
  <h2>Cómo Cuidar Tu Terrario</h2>
  <p>Los terrarios cerrados requieren mínimo mantenimiento...</p>
  
  <!-- H2: Envío -->
  <h2>Envío en Chile</h2>
  <p>Enviamos a todo Chile...</p>
</article>
```

### Densidad de Palabras Clave

- **Keyword principal**: 1-2% del contenido
- **Variaciones long-tail**: Natural, no forzado
- **Sinónimos**: "terrario", "ecosistema en frasco", "jardín en miniatura"
- **Evitar**: Keyword stuffing

### Contenido Mínimo por Página

- **Home**: 400-600 palabras (distribuidas en secciones)
- **Categoría**: 200-400 palabras intro + productos
- **Producto**: 300-500 palabras descripción
- **Curso**: 500-800 palabras
- **Blog**: 800-1500+ palabras

---

## 🔗 Link Building Interno

### Estrategia de Enlaces Internos

```tsx
// ✅ Enlaces contextuales
<p>
  Aprende a crear tu propio {' '}
  <Link href="/cursos/terrarios-desde-cero">
    terrario desde cero con nuestro curso online
  </Link>
  {' '} o visita nuestros {' '}
  <Link href="/talleres">
    talleres presenciales en Santiago
  </Link>.
</p>

// ✅ Enlaces relacionados al final
<aside className="related-products">
  <h3>Te Podría Interesar</h3>
  <ProductCard product={relatedProduct} />
</aside>
```

### Anchor Text Natural

```
❌ Mal:
<a href="/cursos">click aquí</a>
<a href="/terrarios">ver más</a>

✅ Bien:
<a href="/cursos">cursos online de terrarios</a>
<a href="/terrarios/bosque">terrario bosque nublado</a>
```

---

## ⚡ Core Web Vitals

### LCP (Largest Contentful Paint) < 2.5s

```tsx
// ✅ Priorizar hero image
<Image
  src="/hero.jpg"
  priority
  quality={85}
/>

// ✅ Preload fuentes críticas
<link
  rel="preload"
  href="/fonts/playfair.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

### FID (First Input Delay) < 100ms

```tsx
// ✅ Code splitting
const VideoPlayer = dynamic(() => import('./VideoPlayer'), {
  ssr: false,
  loading: () => <Skeleton />
});

// ✅ Defer non-critical JS
<Script
  src="https://analytics.example.com/script.js"
  strategy="lazyOnload"
/>
```

### CLS (Cumulative Layout Shift) < 0.1

```tsx
// ✅ Reservar espacio para imágenes
<Image
  src={src}
  width={800}
  height={600}
  // Evita layout shift
/>

// ✅ Skeleton loaders con tamaño exacto
<Skeleton className="h-[400px] w-full" />
```

---

## 📱 Mobile SEO

### Responsive by Default

```tsx
// ✅ Mobile-first CSS
<div className="
  text-3xl      /* Mobile */
  md:text-4xl   /* Tablet */
  lg:text-5xl   /* Desktop */
">
```

### Viewport Meta

```tsx
// app/layout.tsx
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};
```

### Touch Targets

```css
/* ✅ Mínimo 44x44px para tocar */
.btn {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
}
```

---

## 🌍 SEO Internacional (Futuro)

### hreflang Tags

```tsx
// app/layout.tsx
export const metadata = {
  alternates: {
    languages: {
      'es-CL': 'https://comoelmusguito.cl',
      'en': 'https://comoelmusguito.cl/en',
    },
  },
};
```

---

## 📈 Monitoreo y Analytics

### Herramientas Esenciales

1. **Google Search Console**
   - Monitorear indexación
   - Tracking de keywords
   - Identificar errores

2. **Google Analytics 4**
   - Tráfico orgánico
   - Comportamiento usuarios
   - Conversiones

3. **Plausible/Fathom** (Alternativa privacy-first)
   - Analytics sin cookies
   - Cumplimiento GDPR

### Implementación

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

---

## 📋 SEO Checklist por Página

### Antes de Publicar

- [ ] **Title tag**: 50-60 caracteres, keyword al inicio
- [ ] **Meta description**: 150-160 caracteres, call to action
- [ ] **H1**: Solo uno por página, incluye keyword principal
- [ ] **H2-H6**: Jerarquía lógica
- [ ] **URLs**: Semánticas, con keywords
- [ ] **Images**: Alt text descriptivo en todas
- [ ] **Internal links**: 3-5 enlaces relevantes
- [ ] **Schema markup**: JSON-LD apropiado
- [ ] **Canonical URL**: Definido
- [ ] **Open Graph**: Metadata completa
- [ ] **Mobile**: 100% responsive
- [ ] **Performance**: Core Web Vitals en verde
- [ ] **Contenido**: Mínimo 300 palabras
- [ ] **Keywords**: Densidad natural 1-2%

---

## 🎯 Estrategia de Contenido

### Blog Posts Mensuales (Mínimo 2)

**Categorías:**

1. **Tutoriales** (SEO gold)
   - "Cómo hacer un terrario cerrado paso a paso"
   - "Guía completa: Plantas para terrarios en Chile"
   - "Cómo elegir el frasco perfecto para tu terrario"

2. **Cuidados**
   - "5 errores comunes al cuidar terrarios y cómo evitarlos"
   - "Qué hacer si tu terrario tiene moho"
   - "Cómo controlar la humedad en terrarios cerrados"

3. **Inspiración**
   - "10 ideas de terrarios para regalar"
   - "Terrarios temáticos: Del bosque al desierto"
   - "Terrarios colgantes: tendencia 2025"

4. **Local (Chile)**
   - "Plantas nativas chilenas perfectas para terrarios"
   - "Dónde recolectar musgo en Chile de forma sustentable"
   - "Los mejores lugares para comprar materiales en Santiago"

### Formato Optimizado

```markdown
# [Título con Keyword Principal] (H1)

[Introducción 100-150 palabras con keyword]

## Tabla de Contenidos
- Link interno 1
- Link interno 2

## [Subtítulo relevante] (H2)

[Contenido 200+ palabras]

![Alt text descriptivo](imagen.jpg)

## [Otro subtítulo] (H2)

### [Sub-subtítulo] (H3)

[Más contenido]

## Conclusión

[Resumen + CTA a producto/curso relacionado]

## Preguntas Frecuentes

### ¿Pregunta 1?
Respuesta...

### ¿Pregunta 2?
Respuesta...
```

---

## 🚀 Quick Wins Inmediatos

### Día 1
- [x] Configurar Metadata API Next.js
- [x] Crear sitemap.xml dinámico
- [x] Configurar robots.txt
- [ ] Registrar en Google Search Console
- [ ] Configurar Google Analytics

### Semana 1
- [ ] Implementar JSON-LD en todas las páginas
- [ ] Optimizar todas las imágenes
- [ ] Escribir alt text descriptivo
- [ ] Crear 3 blog posts iniciales
- [ ] Internal linking strategy

### Mes 1
- [ ] Perfil completo Google My Business
- [ ] Link building inicial (directorios Chile)
- [ ] 10 blog posts publicados
- [ ] Monitorear primeras keywords
- [ ] Optimizar Core Web Vitals

---

## 📚 Recursos

- [Google Search Central](https://developers.google.com/search)
- [Next.js SEO](https://nextjs.org/learn/seo/introduction-to-seo)
- [Schema.org Documentation](https://schema.org/)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Ahrefs Blog](https://ahrefs.com/blog/)

---

**Última actualización:** Noviembre 2025  
**SEO Lead:** Sistema comoelmusguito

