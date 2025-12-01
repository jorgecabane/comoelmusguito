/**
 * Schema: Taller Presencial
 * Para talleres y workshops presenciales en Santiago
 */

import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'workshop',
  title: 'Talleres Presenciales',
  type: 'document',
  icon: () => '🤝',
  fields: [
    // Información Básica
    defineField({
      name: 'name',
      title: 'Nombre del Taller',
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
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'longDescription',
      title: 'Descripción Detallada',
      type: 'array',
      of: [{ type: 'block' }],
    }),

    // Media
    defineField({
      name: 'images',
      title: 'Galería de Fotos',
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
            },
          ],
        },
      ],
      validation: (Rule) => Rule.min(1),
    }),

    // Fechas y Ubicación
    defineField({
      name: 'dates',
      title: 'Fechas Disponibles',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'workshopDate',
          fields: [
            {
              name: 'date',
              title: 'Fecha y Hora',
              type: 'datetime',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'spotsAvailable',
              title: 'Cupos Disponibles',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: 'spotsTotal',
              title: 'Cupos Totales',
              type: 'number',
              validation: (Rule) => Rule.required().min(1),
            },
            {
              name: 'status',
              title: 'Estado',
              type: 'string',
              options: {
                list: [
                  { title: 'Disponible', value: 'available' },
                  { title: 'Pocos Cupos', value: 'limited' },
                  { title: 'Agotado', value: 'sold_out' },
                  { title: 'Cancelado', value: 'cancelled' },
                ],
              },
              initialValue: 'available',
            },
          ],
          preview: {
            select: {
              date: 'date',
              available: 'spotsAvailable',
              total: 'spotsTotal',
              status: 'status',
            },
            prepare({ date, available, total, status }) {
              const dateStr = new Date(date).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const statusLabels = {
                available: 'Disponible',
                limited: 'Pocos Cupos',
                sold_out: 'Agotado',
                cancelled: 'Cancelado',
              };
              return {
                title: dateStr,
                subtitle: `${available}/${total} cupos • ${statusLabels[status as keyof typeof statusLabels]}`,
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),

    // Ubicación
    defineField({
      name: 'location',
      title: 'Ubicación',
      type: 'object',
      fields: [
        {
          name: 'venue',
          title: 'Lugar',
          type: 'string',
          description: 'Nombre del lugar (ej: "Taller comoelmusguito")',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'address',
          title: 'Dirección',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'city',
          title: 'Ciudad',
          type: 'string',
          initialValue: 'Santiago',
        },
        {
          name: 'region',
          title: 'Región',
          type: 'string',
          initialValue: 'Región Metropolitana',
        },
        {
          name: 'mapUrl',
          title: 'Google Maps URL',
          type: 'url',
          description: 'Link a Google Maps',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),

    // Pricing (solo CLP - talleres presenciales solo en Chile)
    defineField({
      name: 'price',
      title: 'Precio por Persona',
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
      description: 'Los talleres solo se venden en CLP (presenciales en Chile)',
    }),

    // Detalles del Taller
    defineField({
      name: 'duration',
      title: 'Duración (horas)',
      type: 'number',
      description: 'Duración en horas (ej: 3 para 3 horas)',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'level',
      title: 'Nivel',
      type: 'string',
      options: {
        list: [
          { title: 'Principiante', value: 'beginner' },
          { title: 'Intermedio', value: 'intermediate' },
          { title: 'Avanzado', value: 'advanced' },
          { title: 'Todos los Niveles', value: 'all' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    // Qué Incluye
    defineField({
      name: 'includes',
      title: 'Qué Incluye el Taller',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Lista de lo que incluye (materiales, terrario, café, etc.)',
      validation: (Rule) => Rule.required().min(1),
    }),

    // Lo que Aprenderás
    defineField({
      name: 'learningOutcomes',
      title: 'Lo que Aprenderás',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.required().min(3),
    }),

    // Requisitos
    defineField({
      name: 'requirements',
      title: 'Requisitos',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Qué debe traer el estudiante (si aplica)',
    }),

    // Política de Cancelación
    defineField({
      name: 'cancellationPolicy',
      title: 'Política de Cancelación',
      type: 'text',
      rows: 3,
      description: 'Términos de cancelación y reembolsos',
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
      ],
    }),

    // Admin
    defineField({
      name: 'published',
      title: 'Publicado',
      type: 'boolean',
      initialValue: false,
    }),
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
  ],

  preview: {
    select: {
      title: 'name',
      media: 'images.0',
      price: 'price',
      currency: 'currency',
      published: 'published',
    },
    prepare(selection) {
      const { title, price, currency, published } = selection;
      const formattedPrice = price 
        ? `$${price.toLocaleString('es-CL')} ${currency || 'CLP'}` 
        : 'Sin precio';
      const status = !published ? '(Borrador)' : '';
      return {
        title: title || 'Sin título',
        subtitle: `${formattedPrice} ${status}`.trim(),
        media: selection.media,
      };
    },
  },
});

