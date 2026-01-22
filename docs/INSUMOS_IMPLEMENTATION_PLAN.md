# 🛠️ Plan de Implementación: Insumos para Terrarios

## 📋 Resumen Ejecutivo

Agregar una 4ta categoría de productos: **Insumos para Terrarios**. Estos incluyen sustratos profesionales, herramientas, kits, frascos, urnas, y otros materiales necesarios para crear terrarios en casa, todos con el sello de aprobación de comoelmusguito.

---

## 🎯 Objetivos

1. **Productos Físicos con Stock**: Similar a terrarios, pero más genérico
2. **Categorización Flexible**: Soportar diferentes tipos de insumos
3. **Integración Completa**: Carrito, checkout, emails, mi cuenta
4. **UI/UX Consistente**: Seguir patrones existentes de terrarios/cursos/talleres

---

## 📐 Arquitectura

### 1. Schema de Sanity (`sanity/schemas/supply.ts`)

**Campos Base (Comunes a todos los productos):**
- `name` (string, required)
- `slug` (slug, required)
- `description` (text, required)
- `longDescription` (array of blocks, optional)
- `images` (array of images, min 1, max 6)
- `price` (number, required)
- `currency` (string, default 'CLP')
- `inStock` (boolean, default true)
- `stock` (number, default 0)
- `featured` (boolean, default false)
- `order` (number, optional - para ordenamiento)
- `seo` (object, optional)

**Campos Específicos de Insumos:**
- `category` (string, required) - Tipo de insumo:
  - `'sustrato'` - Sustratos profesionales
  - `'herramienta'` - Herramientas
  - `'kit'` - Kits completos
  - `'frasco'` - Frascos y contenedores
  - `'urna'` - Urnas y recipientes
  - `'accesorio'` - Otros accesorios
  - `'material'` - Materiales varios

- `brand` (string, optional) - Marca del producto
- `weight` (number, optional) - Peso en gramos (para envío)
- `dimensions` (object, optional) - Dimensiones:
  - `length` (number, cm)
  - `width` (number, cm)
  - `height` (number, cm)
- `shippingAvailable` (boolean, default false)
- `shippingRegions` (array of strings, optional)
- `localPickupOnly` (boolean, default true)
- `instructions` (array of blocks, optional) - Instrucciones de uso
- `compatibility` (array of strings, optional) - Con qué tipos de terrarios es compatible
- `warranty` (string, optional) - Garantía o política de devolución

**Ejemplo de Schema:**
```typescript
export default defineType({
  name: 'supply',
  title: 'Insumos',
  type: 'document',
  icon: () => '🛠️',
  fields: [
    // Información Básica
    defineField({
      name: 'name',
      title: 'Nombre del Insumo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descripción Corta',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'longDescription',
      title: 'Descripción Detallada',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    
    // Categorización
    defineField({
      name: 'category',
      title: 'Categoría',
      type: 'string',
      options: {
        list: [
          { title: 'Sustrato', value: 'sustrato' },
          { title: 'Herramienta', value: 'herramienta' },
          { title: 'Kit', value: 'kit' },
          { title: 'Frasco', value: 'frasco' },
          { title: 'Urna', value: 'urna' },
          { title: 'Accesorio', value: 'accesorio' },
          { title: 'Material', value: 'material' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    
    // Galería
    defineField({
      name: 'images',
      title: 'Galería de Imágenes',
      type: 'array',
      of: [{
        type: 'image',
        options: { hotspot: true },
        fields: [
          { name: 'alt', type: 'string', title: 'Texto Alternativo', validation: (Rule) => Rule.required() },
          { name: 'caption', type: 'string', title: 'Caption' },
        ],
      }],
      validation: (Rule) => Rule.required().min(1).max(6),
    }),
    
    // Precio y Stock
    defineField({
      name: 'price',
      title: 'Precio',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'currency',
      title: 'Moneda',
      type: 'string',
      initialValue: 'CLP',
      options: {
        list: [{ title: 'Peso Chileno (CLP)', value: 'CLP' }],
      },
      readOnly: true,
    }),
    defineField({
      name: 'inStock',
      title: 'En Stock',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'stock',
      title: 'Stock Disponible',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
    
    // Información Adicional
    defineField({
      name: 'brand',
      title: 'Marca',
      type: 'string',
    }),
    defineField({
      name: 'weight',
      title: 'Peso (gramos)',
      type: 'number',
      description: 'Para cálculo de envío',
    }),
    defineField({
      name: 'dimensions',
      title: 'Dimensiones',
      type: 'object',
      fields: [
        { name: 'length', title: 'Largo (cm)', type: 'number' },
        { name: 'width', title: 'Ancho (cm)', type: 'number' },
        { name: 'height', title: 'Alto (cm)', type: 'number' },
      ],
    }),
    
    // Envío
    defineField({
      name: 'shippingAvailable',
      title: 'Disponible para Envío',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'shippingRegions',
      title: 'Regiones de Envío',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'localPickupOnly',
      title: 'Solo Retiro en Tienda',
      type: 'boolean',
      initialValue: false,
    }),
    
    // Contenido Adicional
    defineField({
      name: 'instructions',
      title: 'Instrucciones de Uso',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'compatibility',
      title: 'Compatibilidad',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Tipos de terrarios con los que es compatible',
    }),
    defineField({
      name: 'warranty',
      title: 'Garantía / Política',
      type: 'string',
    }),
    
    // Destacado y Orden
    defineField({
      name: 'featured',
      title: 'Destacado',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Orden de Visualización',
      type: 'number',
    }),
    
    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        { name: 'metaTitle', type: 'string', title: 'Título Meta' },
        { name: 'metaDescription', type: 'text', title: 'Descripción Meta', rows: 3 },
        { name: 'keywords', type: 'array', of: [{ type: 'string' }], title: 'Palabras Clave' },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'images.0',
    },
    prepare({ title, subtitle, media }) {
      const categoryLabels: Record<string, string> = {
        sustrato: '🌱 Sustrato',
        herramienta: '🔧 Herramienta',
        kit: '📦 Kit',
        frasco: '🍶 Frasco',
        urna: '🏺 Urna',
        accesorio: '✨ Accesorio',
        material: '🧱 Material',
      };
      return {
        title,
        subtitle: categoryLabels[subtitle] || subtitle,
        media,
      };
    },
  },
});
```

---

## 🔧 Implementación Técnica

### 2. Tipos TypeScript (`types/sanity.ts`)

```typescript
// ============ SUPPLY ============

export type SupplyCategory = 
  | 'sustrato' 
  | 'herramienta' 
  | 'kit' 
  | 'frasco' 
  | 'urna' 
  | 'accesorio' 
  | 'material';

export interface Supply {
  _id: string;
  name: string;
  slug: Slug;
  description: string;
  longDescription?: any[]; // Rich text blocks
  images: SanityImage[];
  price: number;
  currency: 'CLP';
  inStock: boolean;
  stock: number;
  category: SupplyCategory;
  brand?: string;
  weight?: number; // gramos
  dimensions?: {
    length?: number; // cm
    width?: number; // cm
    height?: number; // cm
  };
  shippingAvailable?: boolean;
  shippingRegions?: string[];
  localPickupOnly?: boolean;
  instructions?: any[]; // Rich text blocks
  compatibility?: string[];
  warranty?: string;
  featured?: boolean;
  order?: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}
```

### 3. Actualizar Tipos de Carrito (`types/cart.ts`)

```typescript
// Agregar 'supply' al tipo
export type CartItemType = 'terrarium' | 'course' | 'workshop' | 'supply';

// Agregar campos opcionales para insumos
export interface CartItem {
  // ... campos existentes ...
  
  // Campos opcionales según tipo
  size?: string; // Para terrarios
  selectedDate?: WorkshopDateInfo; // Para talleres
  duration?: number; // Para cursos (horas)
  category?: string; // Para insumos (supply category)
  weight?: number; // Para insumos (para cálculo de envío)
}
```

### 4. Queries GROQ (`sanity/lib/queries.ts`)

```typescript
// ============ INSUMOS ============

export const suppliesQuery = groq`
  *[_type == "supply" && inStock == true] | order(order asc, _createdAt desc) {
    _id,
    name,
    slug,
    description,
    images,
    price,
    currency,
    inStock,
    stock,
    category,
    brand,
    weight,
    dimensions,
    shippingAvailable,
    shippingRegions,
    localPickupOnly,
    featured,
    order
  }
`;

export const featuredSuppliesQuery = groq`
  *[_type == "supply" && featured == true && inStock == true] | order(order asc) [0...6] {
    _id,
    name,
    slug,
    description,
    images,
    price,
    currency,
    inStock,
    stock,
    category,
    brand
  }
`;

export const supplyBySlugQuery = groq`
  *[_type == "supply" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    longDescription,
    images,
    price,
    currency,
    inStock,
    stock,
    category,
    brand,
    weight,
    dimensions,
    shippingAvailable,
    shippingRegions,
    localPickupOnly,
    instructions,
    compatibility,
    warranty,
    seo
  }
`;

export const supplyByIdQuery = groq`
  *[_type == "supply" && _id == $id][0] {
    _id,
    name,
    slug,
    price,
    currency,
    inStock,
    stock,
    category
  }
`;

// Query por categoría
export const suppliesByCategoryQuery = groq`
  *[_type == "supply" && category == $category && inStock == true] | order(order asc, _createdAt desc) {
    _id,
    name,
    slug,
    description,
    images,
    price,
    currency,
    inStock,
    stock,
    category,
    brand
  }
`;
```

### 5. Funciones de Fetch (`lib/sanity/fetch.ts`)

```typescript
// ============ INSUMOS ============

export async function getAllSupplies(): Promise<Supply[]> {
  try {
    return await client.fetch(suppliesQuery);
  } catch (error) {
    console.error('Error fetching supplies:', error);
    return [];
  }
}

export async function getFeaturedSupplies(): Promise<Supply[]> {
  try {
    const featuredResult = await client.fetch(featuredSuppliesQuery);
    if (featuredResult && featuredResult.length > 0) {
      return featuredResult;
    }
    // Fallback: obtener insumos disponibles si no hay destacados
    const fallbackQuery = groq`
      *[_type == "supply" && inStock == true] | order(order asc, _createdAt desc) [0...6] {
        _id,
        name,
        slug,
        description,
        images,
        price,
        currency,
        inStock,
        stock,
        category,
        brand
      }
    `;
    return await client.fetch(fallbackQuery) || [];
  } catch (error) {
    console.error('Error fetching featured supplies:', error);
    return [];
  }
}

export async function getSupplyBySlug(slug: string): Promise<Supply | null> {
  try {
    if (!slug) return null;
    return await client.fetch<Supply | null>(supplyBySlugQuery, { slug });
  } catch (error) {
    console.error('Error fetching supply by slug:', error);
    return null;
  }
}

export async function getSupplyById(id: string): Promise<Supply | null> {
  try {
    if (!id) return null;
    return await client.fetch<Supply | null>(supplyByIdQuery, { id });
  } catch (error) {
    console.error('Error fetching supply by id:', error);
    return null;
  }
}

export async function getSuppliesByCategory(category: SupplyCategory): Promise<Supply[]> {
  try {
    return await client.fetch(suppliesByCategoryQuery, { category });
  } catch (error) {
    console.error(`Error fetching supplies by category ${category}:`, error);
    return [];
  }
}
```

### 6. Validación de Stock (`lib/sanity/inventory.ts`)

```typescript
/**
 * Verificar stock disponible de un insumo
 */
export async function checkSupplyStock(
  supplyId: string,
  requestedQuantity: number
): Promise<{ available: boolean; currentStock: number; inStock: boolean }> {
  try {
    const query = `*[_type == "supply" && _id == $id][0]`;
    const supply = await client.fetch(query, { id: supplyId });

    if (!supply) {
      return { available: false, currentStock: 0, inStock: false };
    }

    const currentStock = supply.stock || 0;
    const inStock = supply.inStock || false;

    return {
      available: inStock && currentStock >= requestedQuantity,
      currentStock,
      inStock,
    };
  } catch (error) {
    console.error(`Error verificando stock de insumo ${supplyId}:`, error);
    return { available: false, currentStock: 0, inStock: false };
  }
}
```

---

## 🎨 UI/UX - Páginas y Componentes

### 7. Página de Listado (`app/insumos/page.tsx`)

**Estructura:**
- Header con título y descripción
- Filtros por categoría (tabs o dropdown)
- Grid de productos (similar a `/terrarios`)
- Breadcrumb
- SEO metadata

**Filtros:**
- Todas las categorías
- Por categoría específica (sustrato, herramienta, kit, etc.)
- Ordenamiento: precio, nombre, más recientes

### 8. Página de Detalle (`app/insumos/[slug]/page.tsx`)

**Estructura:**
- Galería de imágenes
- Información del producto
- Especificaciones (peso, dimensiones)
- Instrucciones de uso
- Compatibilidad
- Botón "Agregar al Carrito"
- Breadcrumb
- Schema.org Product

### 9. Componente de Detalle (`components/product/SupplyDetail.tsx`)

Similar a `TerrariumDetail.tsx` pero adaptado para insumos.

### 10. Sección en Home (`components/sections/home/SuppliesSection.tsx`)

Nueva sección para mostrar insumos destacados en la home, similar a `ExploreSection.tsx`.

---

## 🛒 Carrito y Checkout

### 11. Actualizar Carrito (`app/carrito/page.tsx`)

- Agregar filtro para insumos
- Mostrar categoría del insumo en el item
- Validar stock antes de checkout

### 12. Actualizar Checkout (`app/api/checkout/route.ts`)

```typescript
// Agregar validación para insumos
else if (item.type === 'supply') {
  product = await getSupplyById(item.id);
  if (!product) {
    return NextResponse.json(
      { error: `Insumo "${item.name}" no encontrado` },
      { status: 400 }
    );
  }
  if (!product.inStock) {
    return NextResponse.json(
      { error: `Insumo "${item.name}" no está disponible` },
      { status: 400 }
    );
  }
  validatedPrice = product.price;
  validatedCurrency = product.currency;

  // Validar stock
  const stockCheck = await checkSupplyStock(item.id, item.quantity);
  if (!stockCheck.available) {
    return NextResponse.json(
      {
        error: `Lo sentimos, "${item.name}" ya no está disponible. Solo quedan ${stockCheck.currentStock} unidades.`,
        outOfStock: true,
        itemId: item.id,
        itemName: item.name,
      },
      { status: 400 }
    );
  }
}
```

### 13. Validación de Stock en API (`app/api/cart/validate-stock/route.ts`)

```typescript
// Agregar validación para insumos
if (sanitizedItemType === 'supply') {
  const supply = await getSupplyById(sanitizedItemId);
  // ... validación similar a terrarios
}
```

---

## 📧 Emails

### 14. Actualizar Emails de Confirmación (`lib/resend/client.ts`)

- Agregar sección para insumos en el email
- Mostrar categoría del insumo
- Instrucciones de envío/retiro según configuración

```typescript
const insumos = data.items.filter((item) => item.type === 'supply');

// En el HTML del email:
${insumos.length > 0 ? `
  <h4 style="margin: 0 0 8px 0; color: #2D5016; font-size: 16px; font-weight: 600;">🛠️ Insumos:</h4>
  ${insumos.map((item) => `
    <div style="margin-bottom: 12px;">
      <p style="margin: 0; color: #1A1F16; font-size: 14px;">
        ${item.name} ${item.category ? `(${item.category})` : ''} - Cantidad: ${item.quantity}
      </p>
    </div>
  `).join('')}
` : ''}
```

---

## 👤 Mi Cuenta

### 15. Actualizar Filtros (`app/mi-cuenta/AccountFeed.tsx`)

```typescript
type FilterType = 'all' | 'courses' | 'workshops' | 'terrariums' | 'supplies';

// Agregar filtro de insumos
{ value: 'supplies', label: 'Insumos', icon: Wrench, count: suppliesWithDetails.length }
```

### 16. Extraer Insumos de Órdenes (`app/mi-cuenta/page.tsx`)

```typescript
// Extraer insumos de órdenes confirmadas
const supplyItemsFromOrders = confirmedOrders
  .flatMap((order) => 
    order.items
      .filter((item) => item.type === 'supply')
      .map((item) => ({ 
        ...item, 
        orderId: order.orderId, 
        orderDate: order.createdAt,
        isGift: false,
      }))
  );

// Obtener datos completos de insumos
const suppliesWithDetails = await Promise.all(
  supplyItems.map(async (item) => {
    const supply = await getSupplyById(item.id);
    return {
      ...item,
      supply,
    };
  })
);
```

### 17. Componente de Card (`app/mi-cuenta/cards/SupplyCard.tsx`)

Similar a `TerrariumCard.tsx` pero para insumos.

---

## 📦 Órdenes y Sanity

### 18. Actualizar Schema de Orden (`sanity/schemas/order.ts`)

```typescript
// Agregar 'supply' a la lista de tipos
{
  name: 'type',
  title: 'Tipo',
  type: 'string',
  options: {
    list: [
      { title: 'Terrario', value: 'terrarium' },
      { title: 'Curso Online', value: 'course' },
      { title: 'Taller Presencial', value: 'workshop' },
      { title: 'Insumo', value: 'supply' }, // NUEVO
    ],
  },
}
```

### 19. Actualizar Tipos de Orden (`lib/sanity/orders.ts`)

```typescript
items: Array<{
  id: string;
  type: 'terrarium' | 'course' | 'workshop' | 'supply'; // NUEVO
  // ... resto de campos
  snapshot?: {
    // ... campos existentes
    category?: string; // Para insumos
    weight?: number; // Para insumos
  };
}>;
```

### 20. Actualizar Webhook de Flow (`app/api/webhooks/flow/route.ts`)

```typescript
// Agregar lógica para descontar stock de insumos
if (item.type === 'supply') {
  // Descontar stock similar a terrarios
  await updateSupplyStock(item.id, item.quantity);
}
```

---

## 🔍 SEO

### 21. Schema.org para Insumos

Actualizar `lib/seo/schema.tsx` para incluir insumos como productos.

### 22. Sitemap (`app/sitemap.ts`)

Agregar rutas de insumos al sitemap.

### 23. Metadata en Páginas

Agregar metadata completa en páginas de insumos.

---

## 🧭 Navegación

### 24. Header (`components/shared/Header.tsx`)

Agregar link a `/insumos` en el menú principal.

### 25. Footer (`components/shared/Footer.tsx`)

Agregar link a insumos en el footer.

---

## 📋 Checklist de Implementación

### Fase 1: Backend y Datos
- [ ] Crear schema de Sanity (`sanity/schemas/supply.ts`)
- [ ] Agregar schema al index
- [ ] Actualizar `sanity.config.ts` para incluir insumos
- [ ] Crear tipos TypeScript (`types/sanity.ts`)
- [ ] Crear queries GROQ (`sanity/lib/queries.ts`)
- [ ] Crear funciones de fetch (`lib/sanity/fetch.ts`)
- [ ] Crear función de validación de stock (`lib/sanity/inventory.ts`)

### Fase 2: Tipos y Carrito
- [ ] Actualizar `types/cart.ts` (agregar 'supply')
- [ ] Actualizar `types/sanity.ts` (agregar Supply interface)
- [ ] Actualizar store de carrito si es necesario

### Fase 3: Páginas
- [ ] Crear `/app/insumos/page.tsx` (listado)
- [ ] Crear `/app/insumos/[slug]/page.tsx` (detalle)
- [ ] Agregar metadata y SEO

### Fase 4: Componentes
- [ ] Crear `components/product/SupplyDetail.tsx`
- [ ] Crear `components/sections/home/SuppliesSection.tsx` (opcional)
- [ ] Crear `app/mi-cuenta/cards/SupplyCard.tsx`

### Fase 5: Carrito y Checkout
- [ ] Actualizar `app/carrito/page.tsx`
- [ ] Actualizar `app/api/checkout/route.ts`
- [ ] Actualizar `app/api/cart/validate-stock/route.ts`
- [ ] Actualizar `components/cart/AddToCartButton.tsx`

### Fase 6: Órdenes
- [ ] Actualizar `sanity/schemas/order.ts`
- [ ] Actualizar `lib/sanity/orders.ts`
- [ ] Actualizar `app/api/webhooks/flow/route.ts`

### Fase 7: Emails
- [ ] Actualizar `lib/resend/client.ts` (emails de confirmación)
- [ ] Actualizar templates de email para incluir insumos

### Fase 8: Mi Cuenta
- [ ] Actualizar `app/mi-cuenta/page.tsx`
- [ ] Actualizar `app/mi-cuenta/AccountFeed.tsx` (filtros)
- [ ] Agregar card de insumos

### Fase 9: Navegación y SEO
- [ ] Actualizar Header
- [ ] Actualizar Footer
- [ ] Actualizar sitemap
- [ ] Actualizar schema.org

### Fase 10: Testing
- [ ] Probar creación de insumo en Sanity
- [ ] Probar listado de insumos
- [ ] Probar detalle de insumo
- [ ] Probar agregar al carrito
- [ ] Probar checkout completo
- [ ] Probar validación de stock
- [ ] Probar emails
- [ ] Probar mi cuenta (filtros y visualización)

---

## 🎨 Consideraciones de Diseño

### Categorías con Iconos
- 🌱 Sustrato
- 🔧 Herramienta
- 📦 Kit
- 🍶 Frasco
- 🏺 Urna
- ✨ Accesorio
- 🧱 Material

### Colores y Estilos
- Seguir paleta existente (forest, musgo, cream)
- Usar componentes UI existentes (Card, Button, Badge)
- Mantener consistencia con terrarios

### Responsive
- Mobile-first approach
- Grid adaptable (1 col mobile, 2 tablet, 3 desktop)
- Imágenes optimizadas

---

## 🚀 Próximos Pasos

1. **Revisar y aprobar este plan**
2. **Crear schema en Sanity** (Fase 1)
3. **Implementar backend** (Fases 1-2)
4. **Implementar UI** (Fases 3-4)
5. **Integrar con carrito/checkout** (Fases 5-6)
6. **Completar integración** (Fases 7-9)
7. **Testing completo** (Fase 10)

---

## 📝 Notas Adicionales

### Regalos
- Los insumos pueden ser regalados (similar a terrarios y talleres)
- No requieren acceso especial (a diferencia de cursos)

### Envío
- Similar a terrarios: pueden tener envío o solo retiro
- Considerar peso para cálculo de envío futuro

### Stock
- Sistema de stock igual a terrarios
- Validación en tiempo real antes de checkout

### Escalabilidad
- El schema es genérico y puede extenderse fácilmente
- Categorías pueden agregarse sin cambios de código
- Compatible con futuras funcionalidades (reviews, bundles, etc.)

---

**Última actualización:** Enero 2025
**Estado:** Planificación completa - Listo para implementación
