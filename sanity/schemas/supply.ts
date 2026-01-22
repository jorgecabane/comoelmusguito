/**
 * Schema: Insumo (Producto Físico)
 * Para insumos profesionales para crear terrarios
 */

import { defineField, defineType } from 'sanity';

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
      options: {
        source: 'name',
        maxLength: 96,
      },
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
      description: 'Descripción completa del insumo, características, etc.',
    }),

    // Categorización
    defineField({
      name: 'category',
      title: 'Categoría',
      type: 'string',
      options: {
        list: [
          { title: '🌱 Sustrato', value: 'sustrato' },
          { title: '🔧 Herramienta', value: 'herramienta' },
          { title: '📦 Kit', value: 'kit' },
          { title: '🍶 Frasco', value: 'frasco' },
          { title: '🏺 Urna', value: 'urna' },
          { title: '✨ Accesorio', value: 'accesorio' },
          { title: '🧱 Material', value: 'material' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    // Galería de Imágenes
    defineField({
      name: 'images',
      title: 'Galería de Imágenes',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Texto Alternativo',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required().min(1).max(6),
    }),

    // Pricing & Stock (solo CLP - productos físicos solo para Chile)
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
        list: [
          { title: 'Peso Chileno (CLP)', value: 'CLP' },
        ],
      },
      readOnly: true,
      description: 'Los insumos solo se venden en CLP (envío solo a Chile)',
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
      description: 'Cantidad disponible en inventario',
    }),

    // Información Adicional
    defineField({
      name: 'brand',
      title: 'Marca',
      type: 'string',
      description: 'Marca del producto (opcional)',
    }),
    defineField({
      name: 'weight',
      title: 'Peso (gramos)',
      type: 'number',
      description: 'Peso del producto para cálculo de envío',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'dimensions',
      title: 'Dimensiones',
      type: 'object',
      fields: [
        {
          name: 'length',
          title: 'Largo (cm)',
          type: 'number',
          validation: (Rule) => Rule.min(0),
        },
        {
          name: 'width',
          title: 'Ancho (cm)',
          type: 'number',
          validation: (Rule) => Rule.min(0),
        },
        {
          name: 'height',
          title: 'Alto (cm)',
          type: 'number',
          validation: (Rule) => Rule.min(0),
        },
      ],
      description: 'Dimensiones del producto',
    }),

    // Envío
    defineField({
      name: 'shippingAvailable',
      title: 'Disponible para Envío',
      type: 'boolean',
      initialValue: false,
      description: 'Si está marcado, el producto puede enviarse',
    }),
    defineField({
      name: 'shippingRegions',
      title: 'Regiones de Envío',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Regiones donde se puede enviar (dejar vacío para todas)',
    }),
    defineField({
      name: 'localPickupOnly',
      title: 'Solo Retiro en Tienda',
      type: 'boolean',
      initialValue: true,
      description: 'Si está marcado, solo se puede retirar en tienda',
    }),

    // Contenido Adicional
    defineField({
      name: 'instructions',
      title: 'Instrucciones de Uso',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Instrucciones detalladas de cómo usar el insumo',
    }),
    defineField({
      name: 'compatibility',
      title: 'Compatibilidad',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Tipos de terrarios con los que es compatible (opcional)',
    }),
    defineField({
      name: 'warranty',
      title: 'Garantía / Política',
      type: 'string',
      description: 'Información sobre garantía o política de devolución',
    }),

    // Destacado y Orden
    defineField({
      name: 'featured',
      title: 'Destacado',
      type: 'boolean',
      initialValue: false,
      description: 'Mostrar en la página principal',
    }),
    defineField({
      name: 'order',
      title: 'Orden de Visualización',
      type: 'number',
      description: 'Número para ordenar productos (menor = primero)',
    }),

    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        {
          name: 'metaTitle',
          type: 'string',
          title: 'Título Meta',
          description: 'Título para SEO (si no se especifica, usa el nombre)',
        },
        {
          name: 'metaDescription',
          type: 'text',
          title: 'Descripción Meta',
          rows: 3,
          description: 'Descripción para SEO (si no se especifica, usa la descripción corta)',
        },
        {
          name: 'keywords',
          type: 'array',
          of: [{ type: 'string' }],
          title: 'Palabras Clave',
        },
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
