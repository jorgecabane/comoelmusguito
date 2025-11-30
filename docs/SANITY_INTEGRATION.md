# 🎨 Integración con Sanity CMS

## ✅ Estado: Completado

La integración con Sanity CMS está **completamente funcional** y lista para usar.

---

## 📋 Resumen de la Implementación

### 1. **Schemas de Sanity**

Creamos 3 schemas principales:

- **`terrarium`** - Para terrarios físicos
- **`course`** - Para cursos online
- **`workshop`** - Para talleres presenciales

📁 Ubicación: `sanity/schemas/`

### 2. **Tipos TypeScript**

Todos los datos tienen tipos seguros:

```typescript
import type { Terrarium, Course, Workshop } from '@/types/sanity';
```

📁 Ubicación: `types/sanity.ts`

### 3. **Helpers de Fetch**

Funciones listas para usar en cualquier componente:

```typescript
import { 
  getAllTerrariums, 
  getFeaturedTerrariums, 
  getTerrariumBySlug 
} from '@/lib/sanity/fetch';
```

📁 Ubicación: `lib/sanity/fetch.ts`

### 4. **Utilidades**

Helpers para trabajar con imágenes, precios, fechas:

```typescript
import { 
  getImageUrl, 
  formatPrice, 
  formatDate 
} from '@/lib/sanity/utils';
```

📁 Ubicación: `lib/sanity/utils.ts`

---

## 🌐 Páginas Implementadas

### ✅ Home (`/`)
- Fetch de terrarios y cursos destacados
- Server-side rendering (SSR)
- Revalidación cada 60 segundos

### ✅ Terrarios (`/terrarios`)
- Catálogo completo
- Filtros (preparados para implementar)
- Links a páginas de detalle

### ✅ Detalle de Terrario (`/terrarios/[slug]`)
- Galería de imágenes
- Especificaciones completas
- Plantas y hardscape incluidos
- CTA de compra

### ✅ Cursos (`/cursos`)
- Catálogo completo
- Preview de videos
- Precios con descuento

### ✅ Detalle de Curso (`/cursos/[slug]`)
- Video promocional
- Módulos y lecciones
- Resultados de aprendizaje
- Información del instructor

### ✅ Talleres (`/talleres`)
- Catálogo de talleres presenciales
- Fechas disponibles
- Ubicación y detalles

### ✅ Detalle de Taller (`/talleres/[slug]`)
- Calendario de fechas
- Cupos disponibles
- Ubicación con mapa
- Política de cancelación

---

## 🎨 Componentes Actualizados

### `ExploreSection.tsx` (Home)
- Props: `terrarios: Terrarium[]`
- Fetch desde `page.tsx`

### `LearnSection.tsx` (Home)
- Props: `courses: Course[]`
- Fetch desde `page.tsx`

---

## 🔧 Configuración Necesaria

### Variables de Entorno (`.env.local`)

```bash
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID="tu-project-id"
NEXT_PUBLIC_SANITY_DATASET="production"
NEXT_PUBLIC_SANITY_API_VERSION="2024-01-01"
SANITY_API_TOKEN="tu-token-aqui"
```

### Acceso al Studio

1. **URL**: `https://tudominio.com/studio`
2. **Autenticación**: Login con cuenta de Sanity
3. **Permisos**: Editor o Admin

---

## 📝 Cómo Usar

### Agregar un Nuevo Terrario

1. Ve a `/studio`
2. Click en "Terrarium"
3. Click en "Create new"
4. Completa los campos:
   - Nombre
   - Slug (se genera automáticamente)
   - Descripción
   - Imágenes (sube desde tu PC)
   - Precio y moneda
   - Stock
   - Tamaño, categoría, etc.
5. Marca "Published" para que se muestre
6. Si quieres destacarlo: marca "Featured"
7. Click en "Publish"

### Agregar un Nuevo Curso

1. Ve a `/studio`
2. Click en "Course"
3. Completa información básica
4. Agrega módulos y lecciones
5. Sube thumbnail y video promocional
6. Marca "Published" y "Featured"
7. Publish

### Agregar un Nuevo Taller

1. Ve a `/studio`
2. Click en "Workshop"
3. Completa información
4. Agrega fechas con cupos disponibles
5. Define ubicación
6. Publish

---

## 🚀 Revalidación de Datos

### ISR (Incremental Static Regeneration)

Todas las páginas se revalidan cada **60 segundos**:

```typescript
export const revalidate = 60;
```

Esto significa:
- Las páginas se generan estáticamente
- Se actualizan automáticamente cada minuto
- Ultra rápidas para los usuarios
- Siempre con datos frescos

### Revalidación Manual (Opcional)

Si necesitas revalidar inmediatamente:

```bash
# Revalidar todas las rutas
npm run build
```

---

## 🎯 Próximos Pasos

### Funcionalidades Pendientes:

1. **Carrito de Compras**
   - Estado global (Zustand o Context)
   - Persistencia en localStorage
   - Integración con Stripe

2. **Autenticación de Usuarios**
   - NextAuth.js
   - Login para acceder a cursos comprados

3. **Player de Videos**
   - Integración con Vimeo/Bunny
   - Control de acceso por compra
   - Tracking de progreso

4. **Sistema de Pagos**
   - Stripe Checkout
   - Webhooks para confirmar pagos
   - Emails de confirmación

5. **Filtros Avanzados**
   - Filtrar por categoría, precio, tamaño
   - Búsqueda por texto
   - Ordenamiento

---

## 📚 Recursos

### Documentación Oficial
- [Sanity Docs](https://www.sanity.io/docs)
- [Next.js Image](https://nextjs.org/docs/api-reference/next/image)
- [TypeScript](https://www.typescriptlang.org/docs/)

### Archivos Clave
- `ARCHITECTURE.md` - Arquitectura general
- `SANITY_SETUP.md` - Setup detallado de Sanity
- `SANITY_RESUMEN.md` - Resumen de diferencias

---

## ✅ Checklist de Integración

- [x] Schemas de Sanity creados
- [x] Tipos TypeScript definidos
- [x] Helpers de fetch implementados
- [x] Utilidades de formato
- [x] Home actualizado
- [x] Página de terrarios con datos reales
- [x] Página de detalle de terrarios
- [x] Página de cursos con datos reales
- [x] Página de detalle de cursos
- [x] Página de talleres con datos reales
- [x] Página de detalle de talleres
- [x] Optimización de imágenes
- [x] Revalidación ISR configurada
- [x] SEO metadata por producto
- [x] Errores de linting corregidos

---

## 🎉 ¡Listo para Producción!

La integración está completa. Puedes:

1. ✅ Agregar productos desde `/studio`
2. ✅ Ver productos en el sitio automáticamente
3. ✅ Editar contenido sin tocar código
4. ✅ Imágenes optimizadas automáticamente
5. ✅ Datos siempre actualizados (cada 60s)

**Siguiente paso**: Agregar tu primer terrario, curso y taller desde el Studio! 🌿

