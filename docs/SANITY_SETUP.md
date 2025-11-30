# 🗄️ Configuración de Sanity CMS

## ✅ Lo Que Ya Está Listo

```
✅ Schemas creados (terrarios, cursos, talleres)
✅ Configuración de Sanity Studio
✅ Cliente y queries
✅ Utilidades para imágenes
✅ Página del Studio (/studio)
```

---

## 🚀 Paso a Paso para Configurar

### 1. Crear Proyecto en Sanity.io

1. **Ir a:** https://www.sanity.io/
2. **Registrarse/Iniciar sesión**
3. **Crear nuevo proyecto:**
   ```
   Nombre: comoelmusguito
   Dataset: production
   ```

4. **Obtener Project ID:**
   - Lo verás en el dashboard
   - Ejemplo: `abc123xyz`

---

### 2. Crear Token API

1. En el dashboard de Sanity
2. **Settings → API**
3. **Tokens → Add API Token**
4. **Configuración:**
   ```
   Name: production-token
   Permissions: Editor
   ```
5. **Copiar el token** (solo se muestra una vez)

---

### 3. Configurar Variables de Entorno

Actualiza tu `.env.local`:

```bash
# SANITY CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=abc123xyz  # Tu Project ID
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_TOKEN=tu_token_aqui          # El token que copiaste
SANITY_WEBHOOK_SECRET=genera_uno_random # Para webhooks (opcional por ahora)
```

---

### 4. Inicializar Sanity Studio

```bash
# En la raíz del proyecto
npm run dev
```

Luego accede a: **http://localhost:3000/studio**

---

### 5. Agregar CORS Origins

1. En dashboard de Sanity
2. **Settings → API**
3. **CORS Origins → Add CORS Origin**
4. **Agregar:**
   ```
   http://localhost:3000
   https://tudominio.com (producción)
   ```

---

## 📝 Estructura de Schemas

### 🌿 Terrarios (Productos Físicos)

```typescript
{
  name: string
  slug: slug
  description: text
  images: array[image]
  price: number
  inStock: boolean
  stock: number
  size: 'mini' | 'small' | 'medium' | 'large'
  category: 'bosque' | 'tropical' | 'desertico' | etc.
  plants: array[string]
  hardscape: array[string]
  careLevel: 'easy' | 'medium' | 'advanced'
  lightRequirement: 'low' | 'medium' | 'high'
  wateringFrequency: string
  shippingAvailable: boolean
  featured: boolean
}
```

### 🎓 Cursos Online (Productos Digitales)

```typescript
{
  name: string
  slug: slug
  shortDescription: text
  thumbnail: image
  promoVideo: { url, provider }
  price: number
  salePrice?: number
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: number
  lessonCount: number
  modules: array[{
    title: string
    lessons: array[{
      title: string
      videoUrl: url
      videoProvider: 'vimeo' | 'youtube' | 'bunny'
      duration: number
      isFree: boolean (preview gratis)
      downloadables: array[file]
    }]
  }]
  learningOutcomes: array[string]
  requirements: array[string]
  instructor: object
  published: boolean
  featured: boolean
}
```

### 🤝 Talleres Presenciales

```typescript
{
  name: string
  slug: slug
  description: text
  images: array[image]
  dates: array[{
    date: datetime
    spotsAvailable: number
    spotsTotal: number
    status: 'available' | 'limited' | 'sold_out'
  }]
  location: {
    venue: string
    address: string
    city: string
    mapUrl: url
  }
  price: number
  duration: number (horas)
  level: string
  includes: array[string]
  learningOutcomes: array[string]
  published: boolean
}
```

---

## 🎯 Uso en Next.js

### Obtener Datos

```typescript
import { client } from '@/sanity/lib/client';
import { terrariumsQuery } from '@/sanity/lib/queries';

// En Server Component
const terrarios = await client.fetch(terrariumsQuery);

// Con parámetros
const terrario = await client.fetch(terrariumBySlugQuery, {
  slug: 'bosque-nublado'
});
```

### Imágenes

```typescript
import { getSanityImageUrl } from '@/sanity/lib/image';

const imageUrl = getSanityImageUrl(terrarium.images[0], {
  width: 800,
  quality: 90,
  format: 'webp'
});
```

---

## 📊 Queries Disponibles

Ya creadas en `sanity/lib/queries.ts`:

**Terrarios:**
- `terrariumsQuery` - Todos los terrarios en stock
- `featuredTerrariumsQuery` - 6 terrarios destacados
- `terrariumBySlugQuery` - Un terrario por slug

**Cursos:**
- `coursesQuery` - Todos los cursos publicados
- `featuredCoursesQuery` - 3 cursos destacados
- `courseBySlugQuery` - Un curso por slug

**Talleres:**
- `workshopsQuery` - Todos los talleres publicados
- `featuredWorkshopsQuery` - 3 talleres destacados
- `workshopBySlugQuery` - Un taller por slug

**General:**
- `allFeaturedQuery` - Terrarios y cursos destacados juntos

---

## 🔄 Workflow Recomendado

### Para Agregar un Terrario

1. Ir a `/studio`
2. **Terrarios → Crear Nuevo**
3. **Llenar campos obligatorios:**
   - Nombre
   - Slug (auto-genera)
   - Descripción
   - Mínimo 2 imágenes
   - Precio
   - Categoría
   - Stock

4. **Opcional pero recomendado:**
   - Descripción detallada
   - Plantas incluidas
   - Nivel de cuidado
   - Requerimientos de luz/agua

5. **SEO:**
   - Meta Title
   - Meta Description
   - Keywords

6. **Marcar como destacado** si quieres que aparezca en home

7. **Publicar**

---

### Para Agregar un Curso

1. **Terrarios → Crear Nuevo**
2. **Básico:**
   - Nombre, slug, descripción
   - Thumbnail
   - Precio, nivel, duración

3. **Módulos y Lecciones:**
   - Crear módulos
   - Dentro de cada módulo, agregar lecciones
   - Para cada lección:
     - Título, descripción
     - URL del video
     - Duración en minutos
     - Marcar si es preview gratis
     - Subir materiales descargables

4. **Lo que aprenderás:**
   - Mínimo 3 bullets

5. **Marcar como publicado** cuando esté listo

---

## 🎨 Personalización del Studio

El Studio está en `sanity/sanity.config.ts` y ya tiene:

✅ Navegación organizada (Terrarios, Cursos, Talleres)
✅ Íconos personalizados (🌿, 🎓, 🤝)
✅ Vision Tool (para testear queries)
✅ Previews personalizados

---

## 🔐 Seguridad

**Variables Públicas** (NEXT_PUBLIC_):
- ✅ Project ID
- ✅ Dataset
- ✅ API Version

**Variables Privadas** (sin NEXT_PUBLIC_):
- ⚠️ API Token (solo servidor)
- ⚠️ Webhook Secret

**Importante:**
- Nunca commitear `.env.local`
- El API Token tiene permisos de editor
- En producción, crear token separado con menos permisos si solo lees

---

## 📱 Webhooks (Opcional - Futuro)

Para revalidar automáticamente cuando cambias contenido:

1. **Sanity Dashboard → API → Webhooks**
2. **Add Webhook:**
   ```
   Name: Production Revalidation
   URL: https://tudominio.com/api/revalidate
   Dataset: production
   Trigger: Create, Update, Delete
   ```

3. **Crear endpoint** en `app/api/revalidate/route.ts`

---

## 📖 Documentación Adicional

- **Sanity Docs:** https://www.sanity.io/docs
- **GROQ:** https://www.sanity.io/docs/groq
- **Next-Sanity:** https://github.com/sanity-io/next-sanity

---

## ✅ Checklist Post-Setup

- [ ] Proyecto creado en Sanity.io
- [ ] Project ID en `.env.local`
- [ ] API Token creado y configurado
- [ ] CORS Origins agregados
- [ ] `/studio` carga correctamente
- [ ] Primer terrario de prueba creado
- [ ] Primer curso de prueba creado
- [ ] Queries funcionan en Next.js

---

## 🆘 Troubleshooting

### Error: "Invalid Project ID"
→ Verifica que `NEXT_PUBLIC_SANITY_PROJECT_ID` esté correcto

### Error: "CORS not allowed"
→ Agrega tu dominio en CORS Origins

### Studio no carga
→ Verifica que todas las dependencias estén instaladas:
```bash
npm install sanity @sanity/image-url @sanity/vision next-sanity
```

### Imágenes no cargan
→ Verifica que las URLs tengan el Project ID correcto

---

¿Listo para empezar? 🚀

1. Crea tu proyecto en Sanity.io
2. Configura las variables de entorno
3. Accede a `/studio`
4. Agrega tu primer contenido
5. ¡Consúmelo en Next.js!

