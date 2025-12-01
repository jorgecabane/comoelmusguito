/**
 * Schema: Terrario (Producto Físico)
 * Para terrarios artesanales vendidos en la tienda
 */

import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'terrarium',
  title: 'Terrarios',
  type: 'document',
  icon: () => '🌿',
  fields: [
    // Información Básica
    defineField({
      name: 'name',
      title: 'Nombre del Terrario',
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
      title: 'Descripción',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'longDescription',
      title: 'Descripción Detallada',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Historia completa del terrario, cuidados, etc.',
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
      validation: (Rule) => Rule.required().min(2).max(6),
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
      description: 'Los terrarios solo se venden en CLP (envío solo a Chile)',
    }),
    defineField({
      name: 'inStock',
      title: 'En Stock',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'stock',
      title: 'Cantidad Disponible',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),

    // Características
    defineField({
      name: 'size',
      title: 'Tamaño',
      type: 'string',
      options: {
        list: [
          { title: 'Mini (< 15cm)', value: 'mini' },
          { title: 'Pequeño (15-25cm)', value: 'small' },
          { title: 'Mediano (25-40cm)', value: 'medium' },
          { title: 'Grande (> 40cm)', value: 'large' },
        ],
      },
    }),
    defineField({
      name: 'category',
      title: 'Categoría',
      type: 'string',
      options: {
        list: [
          { title: 'Bosque Húmedo', value: 'bosque' },
          { title: 'Tropical', value: 'tropical' },
          { title: 'Desértico', value: 'desertico' },
          { title: 'Colgante', value: 'colgante' },
          { title: 'Paisaje', value: 'paisaje' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    // Plantas y Elementos
    defineField({
      name: 'plants',
      title: 'Plantas Incluidas',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Lista de especies de plantas (ej: "Fittonia", "Musgo", etc.)',
    }),
    defineField({
      name: 'hardscape',
      title: 'Hardscape',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Elementos decorativos (piedras, ramas, etc.)',
    }),

    // Cuidados
    defineField({
      name: 'careLevel',
      title: 'Nivel de Cuidado',
      type: 'string',
      options: {
        list: [
          { title: 'Fácil (Principiantes)', value: 'easy' },
          { title: 'Medio', value: 'medium' },
          { title: 'Avanzado', value: 'advanced' },
        ],
      },
    }),
    defineField({
      name: 'lightRequirement',
      title: 'Requerimiento de Luz',
      type: 'string',
      options: {
        list: [
          { title: 'Baja', value: 'low' },
          { title: 'Media', value: 'medium' },
          { title: 'Alta', value: 'high' },
        ],
      },
    }),
    defineField({
      name: 'wateringFrequency',
      title: 'Frecuencia de Riego',
      type: 'string',
      description: 'Ej: "Cada 2-3 semanas" o "Rara vez (terrario cerrado)"',
    }),

    // Envío (solo Chile)
    defineField({
      name: 'shippingAvailable',
      title: 'Envío Disponible',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'shippingRegions',
      title: 'Regiones de Envío',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Regiones de Chile donde se puede enviar',
      hidden: ({ parent }) => !parent?.shippingAvailable,
    }),
    defineField({
      name: 'localPickupOnly',
      title: 'Solo Retiro en Tienda',
      type: 'boolean',
      initialValue: false,
    }),

    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        {
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          validation: (Rule) => Rule.max(60),
        },
        {
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          validation: (Rule) => Rule.max(160),
        },
        {
          name: 'keywords',
          title: 'Keywords',
          type: 'array',
          of: [{ type: 'string' }],
        },
      ],
    }),

    // Admin
    defineField({
      name: 'featured',
      title: 'Destacado',
      type: 'boolean',
      initialValue: false,
      description: 'Mostrar en home y secciones destacadas',
    }),
    defineField({
      name: 'order',
      title: 'Orden de Visualización',
      type: 'number',
      description: 'Menor número aparece primero',
    }),
  ],

  preview: {
    select: {
      title: 'name',
      media: 'images.0',
      price: 'price',
      currency: 'currency',
      inStock: 'inStock',
    },
    prepare(selection) {
      const { title, price, currency, inStock } = selection;
      const formattedPrice = price 
        ? `$${price.toLocaleString('es-CL')} ${currency || 'CLP'}` 
        : 'Sin precio';
      const status = !inStock ? '(Agotado)' : '';
      return {
        title: title || 'Sin título',
        subtitle: `${formattedPrice} ${status}`.trim(),
        media: selection.media,
      };
    },
  },
});

