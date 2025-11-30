# 📦 Resumen: Sanity CMS Configurado

## ✅ Lo Que Se Creó

### 1. Schemas (3)

```
sanity/schemas/
├── terrarium.ts    🌿 Terrarios (productos físicos)
├── course.ts       🎓 Cursos online (productos digitales)
├── workshop.ts     🤝 Talleres presenciales
└── index.ts        📦 Export de todos los schemas
```

### 2. Configuración

```
sanity/
├── sanity.config.ts         Configuración del Studio
└── lib/
    ├── client.ts            Cliente Sanity + preview
    ├── image.ts             Utilidades para imágenes
    └── queries.ts           Queries GROQ predefinidos
```

### 3. Página del Studio

```
app/studio/[[...tool]]/page.tsx
```
**Acceso:** `http://localhost:3000/studio`

---

## 🎯 Diferencias Clave entre Schemas

### 🌿 Terrarios vs 🎓 Cursos

| Característica | Terrarios | Cursos Online |
|---------------|-----------|---------------|
| **Tipo** | Producto físico | Producto digital |
| **Inventario** | `stock`, `inStock` | No aplica |
| **Media** | Galería de fotos | Thumbnail + videos por lección |
| **Envío** | Sí (solo Chile) | No (acceso online) |
| **Contenido** | Descripción + cuidados | Módulos → Lecciones → Videos |
| **Acceso** | Compra única | Lifetime / 1 año / 6 meses |

---

## 📊 Estructura de un Curso

```
Curso
├── Información Básica
│   ├── Nombre, descripción
│   ├── Precio, nivel, duración
│   └── Thumbnail, video promo
│
├── Módulos (array)
│   ├── Módulo 1
│   │   ├── Lección 1
│   │   │   ├── Video URL
│   │   │   ├── Duración
│   │   │   ├── ¿Preview gratis?
│   │   │   └── Materiales descargables
│   │   ├── Lección 2
│   │   └── Lección 3
│   │
│   └── Módulo 2
│       └── ...
│
├── Lo que Aprenderás (bullets)
├── Requisitos
└── Instructor (Tomás)
```

---

## 🎥 Videos en Cursos

### Proveedores Soportados

```typescript
videoProvider: 'vimeo' | 'youtube' | 'bunny'
```

### Recomendación

**MVP:** YouTube Unlisted (gratis)
**Producción:** Bunny.net o Vimeo Pro

### Por Lección

```typescript
{
  videoUrl: "https://vimeo.com/123456789",
  videoProvider: "vimeo",
  duration: 15, // minutos
  isFree: false, // ¿Preview sin comprar?
  downloadables: [ /* PDFs, etc */ ]
}
```

---

## 🔍 Queries Disponibles

### Terrarios

```typescript
// Todos en stock
const terrarios = await client.fetch(terrariumsQuery);

// 6 destacados
const destacados = await client.fetch(featuredTerrariumsQuery);

// Por slug
const terrario = await client.fetch(terrariumBySlugQuery, { 
  slug: 'bosque-nublado' 
});
```

### Cursos

```typescript
// Todos publicados
const cursos = await client.fetch(coursesQuery);

// 3 destacados
const destacados = await client.fetch(featuredCoursesQuery);

// Por slug (con módulos y lecciones)
const curso = await client.fetch(courseBySlugQuery, { 
  slug: 'terrarios-desde-cero' 
});
```

---

## 🎨 Campos Importantes

### Terrarios

**Obligatorios:**
- `name`, `slug`, `description`
- `images` (mínimo 2)
- `price`, `category`

**Destacados:**
- `featured: true` → Aparece en home
- `inStock: true` → Visible en catálogo
- `order` → Orden de aparición

### Cursos

**Obligatorios:**
- `name`, `slug`, `shortDescription`
- `thumbnail`, `price`
- `level`, `duration`, `lessonCount`
- `modules` (mínimo 1)

**Lanzamiento:**
- `published: true` → Visible para comprar
- `featured: true` → Aparece en home

---

## 💡 Tips Importantes

### 1. Slugs

```
✅ terrario-bosque-nublado
✅ curso-terrarios-desde-cero
✅ taller-iniciacion-terrarios

❌ Terrario Bosque Nublado
❌ curso_desde_cero
❌ TallerTerrarios
```

### 2. Imágenes

- **Terrarios:** Mínimo 2, máximo 6
- **Cursos:** Solo thumbnail (16:9)
- **Talleres:** Múltiples fotos del lugar/actividad

### 3. Precios

- **Moneda:** CLP por defecto
- **Cursos:** Opción de `salePrice` (oferta)
- **Formato:** Número sin puntos ni comas (ej: 45000)

### 4. Videos

- URLs completas (ej: `https://vimeo.com/123456789`)
- Provider correcto para cada video
- Duraciones en **minutos**

---

## 🚀 Próximos Pasos

### 1. Setup Inicial
```bash
# 1. Crear proyecto en Sanity.io
# 2. Copiar Project ID
# 3. Crear API Token
# 4. Actualizar .env.local
```

### 2. Primera Prueba
```bash
npm run dev
# Ir a http://localhost:3000/studio
# Agregar primer terrario de prueba
```

### 3. Consumir Datos
```typescript
// En cualquier Server Component
import { client } from '@/sanity/lib/client';
import { terrariumsQuery } from '@/sanity/lib/queries';

const terrarios = await client.fetch(terrariumsQuery);
```

---

## 📁 Archivos Creados

```
sanity/
├── sanity.config.ts                    # Config del Studio
├── schemas/
│   ├── terrarium.ts                    # Schema Terrarios
│   ├── course.ts                       # Schema Cursos
│   ├── workshop.ts                     # Schema Talleres
│   └── index.ts                        # Export
└── lib/
    ├── client.ts                       # Cliente Sanity
    ├── image.ts                        # Image helpers
    └── queries.ts                      # Queries GROQ

app/studio/[[...tool]]/page.tsx         # Página del Studio

docs/
├── SANITY_SETUP.md                     # Guía paso a paso
└── SANITY_RESUMEN.md                   # Este archivo
```

---

## 🎓 Para Aprender Más

**GROQ (Query Language):**
```groq
*[_type == "course" && level == "beginner"] {
  name,
  price,
  "moduleCount": count(modules)
}
```

**Documentación:**
- https://www.sanity.io/docs
- https://www.sanity.io/docs/groq

---

## ✅ Checklist

- [ ] Dependencias instaladas (`npm install`)
- [ ] Proyecto creado en Sanity.io
- [ ] Variables en `.env.local`
- [ ] Studio carga en `/studio`
- [ ] Primer terrario agregado
- [ ] Primer curso agregado
- [ ] Queries funcionan

---

¡Todo listo para comenzar a usar Sanity CMS! 🎉

