/**
 * Schema: Curso Online
 * Para cursos digitales con lecciones en video
 */

import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'course',
  title: 'Cursos Online',
  type: 'document',
  icon: () => '🎓',
  fields: [
    // Información Básica
    defineField({
      name: 'name',
      title: 'Nombre del Curso',
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
      name: 'shortDescription',
      title: 'Descripción Corta',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().max(200),
      description: 'Para cards y previews (máx 200 caracteres)',
    }),
    defineField({
      name: 'longDescription',
      title: 'Descripción Completa',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Descripción detallada del curso',
    }),

    // Media
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
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
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'promoVideo',
      title: 'Video Promocional',
      type: 'object',
      fields: [
        {
          name: 'url',
          title: 'URL del Video',
          type: 'url',
          description: 'URL de Vimeo, YouTube, Bunny.net, etc.',
        },
        {
          name: 'provider',
          title: 'Proveedor',
          type: 'string',
          options: {
            list: [
              { title: 'Vimeo', value: 'vimeo' },
              { title: 'YouTube', value: 'youtube' },
              { title: 'Bunny.net', value: 'bunny' },
            ],
          },
        },
      ],
      description: 'Video corto de presentación del curso (1-2 min)',
    }),

    // Pricing - Multi-moneda
    defineField({
      name: 'priceCLP',
      title: 'Precio en CLP',
      type: 'number',
      description: 'Precio en pesos chilenos',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'priceUSD',
      title: 'Precio en USD',
      type: 'number',
      description: 'Precio en dólares (opcional, para ventas internacionales)',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'salePriceCLP',
      title: 'Precio en Oferta (CLP)',
      type: 'number',
      description: 'Precio con descuento en CLP (opcional)',
      validation: (Rule) =>
        Rule.custom((salePriceCLP, context) => {
          const priceCLP = (context.parent as any)?.priceCLP;
          if (salePriceCLP && priceCLP && salePriceCLP >= priceCLP) {
            return 'El precio en oferta debe ser menor al precio regular';
          }
          return true;
        }),
    }),
    defineField({
      name: 'salePriceUSD',
      title: 'Precio en Oferta (USD)',
      type: 'number',
      description: 'Precio con descuento en USD (opcional)',
      validation: (Rule) =>
        Rule.custom((salePriceUSD, context) => {
          const priceUSD = (context.parent as any)?.priceUSD;
          if (salePriceUSD && priceUSD && salePriceUSD >= priceUSD) {
            return 'El precio en oferta debe ser menor al precio regular';
          }
          return true;
        }),
    }),
    // Mantener currency para compatibilidad (determinado automáticamente)
    defineField({
      name: 'currency',
      title: 'Moneda Principal',
      type: 'string',
      initialValue: 'CLP',
      options: {
        list: [
          { title: 'Peso Chileno (CLP)', value: 'CLP' },
          { title: 'Dólar (USD)', value: 'USD' },
        ],
      },
      description: 'Moneda principal del producto (se usa si no hay precio específico)',
    }),

    // Información del Curso
    defineField({
      name: 'level',
      title: 'Nivel',
      type: 'string',
      options: {
        list: [
          { title: 'Principiante', value: 'beginner' },
          { title: 'Intermedio', value: 'intermediate' },
          { title: 'Avanzado', value: 'advanced' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Duración Total (horas)',
      type: 'number',
      description: 'Duración total en horas (ej: 3.5 para 3h 30min)',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'lessonCount',
      title: 'Número de Lecciones',
      type: 'number',
      validation: (Rule) => Rule.required().min(1),
    }),

    // Módulos y Lecciones
    defineField({
      name: 'modules',
      title: 'Módulos del Curso',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'module',
          fields: [
            {
              name: 'title',
              title: 'Título del Módulo',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Descripción',
              type: 'text',
              rows: 2,
            },
            {
              name: 'order',
              title: 'Orden',
              type: 'number',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'lessons',
              title: 'Lecciones',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'lesson',
                  fields: [
                    {
                      name: 'title',
                      title: 'Título de la Lección',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'description',
                      title: 'Descripción',
                      type: 'text',
                      rows: 2,
                    },
                    {
                      name: 'duration',
                      title: 'Duración (minutos)',
                      type: 'number',
                      validation: (Rule) => Rule.required().min(1),
                    },
                    {
                      name: 'videoUrl',
                      title: 'URL del Video',
                      type: 'url',
                      description: 'URL del video de la lección',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'videoProvider',
                      title: 'Proveedor de Video',
                      type: 'string',
                      options: {
                        list: [
                          { title: 'Vimeo', value: 'vimeo' },
                          { title: 'YouTube Unlisted', value: 'youtube' },
                          { title: 'Bunny.net', value: 'bunny' },
                        ],
                      },
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'isFree',
                      title: 'Lección Gratuita (Preview)',
                      type: 'boolean',
                      initialValue: false,
                      description: 'Permitir preview sin comprar el curso',
                    },
                    {
                      name: 'downloadables',
                      title: 'Materiales Descargables',
                      type: 'array',
                      of: [
                        {
                          type: 'file',
                          fields: [
                            {
                              name: 'title',
                              type: 'string',
                              title: 'Título del Archivo',
                            },
                          ],
                        },
                      ],
                    },
                    {
                      name: 'order',
                      title: 'Orden',
                      type: 'number',
                      validation: (Rule) => Rule.required(),
                    },
                  ],
                  preview: {
                    select: {
                      title: 'title',
                      duration: 'duration',
                      isFree: 'isFree',
                    },
                    prepare({ title, duration, isFree }) {
                      return {
                        title,
                        subtitle: `${duration} min ${isFree ? '(Preview Gratis)' : ''}`,
                      };
                    },
                  },
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'title',
              lessons: 'lessons',
            },
            prepare({ title, lessons }) {
              const lessonCount = Array.isArray(lessons) ? lessons.length : 0;
              const lessonText = lessonCount === 1 ? 'lección' : 'lecciones';
              return {
                title,
                subtitle: `${lessonCount} ${lessonText}`,
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),

    // Lo que Aprenderás
    defineField({
      name: 'learningOutcomes',
      title: 'Lo que Aprenderás',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Lista de bullets de lo que el estudiante aprenderá',
      validation: (Rule) => Rule.required().min(3),
    }),

    // Requisitos
    defineField({
      name: 'requirements',
      title: 'Requisitos',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Materiales necesarios, conocimientos previos, etc.',
    }),

    // Materiales del Curso
    defineField({
      name: 'materials',
      title: 'Materiales Incluidos',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'PDFs, plantillas, recursos descargables',
    }),

    // Instructor (Tomás)
    defineField({
      name: 'instructor',
      title: 'Instructor',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Nombre',
          type: 'string',
          initialValue: 'Tomás Barrera',
        },
        {
          name: 'bio',
          title: 'Biografía',
          type: 'text',
          rows: 3,
        },
        {
          name: 'photo',
          title: 'Foto',
          type: 'image',
        },
      ],
    }),

    // Acceso
    defineField({
      name: 'accessType',
      title: 'Tipo de Acceso',
      type: 'string',
      initialValue: 'lifetime',
      options: {
        list: [
          { title: 'De por Vida', value: 'lifetime' },
          { title: '1 Año', value: '1year' },
          { title: '6 Meses', value: '6months' },
        ],
      },
    }),
    defineField({
      name: 'certificate',
      title: 'Incluye Certificado',
      type: 'boolean',
      initialValue: true,
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
      name: 'published',
      title: 'Publicado',
      type: 'boolean',
      initialValue: false,
      description: 'El curso está disponible para la venta',
    }),
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
    defineField({
      name: 'enrollmentCount',
      title: 'Número de Estudiantes',
      type: 'number',
      readOnly: true,
      description: 'Se actualiza automáticamente',
    }),
  ],

  preview: {
    select: {
      title: 'name',
      media: 'thumbnail',
      price: 'price',
      currency: 'currency',
      level: 'level',
      published: 'published',
    },
    prepare(selection) {
      const { title, price, currency, level, published } = selection;
      const levelLabels = {
        beginner: 'Principiante',
        intermediate: 'Intermedio',
        advanced: 'Avanzado',
      };
      const formattedPrice = price 
        ? `$${price.toLocaleString('es-CL')} ${currency || 'CLP'}` 
        : 'Sin precio';
      const levelText = level ? levelLabels[level as keyof typeof levelLabels] : 'Sin nivel';
      const status = !published ? '(Borrador)' : '';
      return {
        title: title || 'Sin título',
        subtitle: `${formattedPrice} • ${levelText} ${status}`.trim(),
        media: selection.media,
      };
    },
  },
});

