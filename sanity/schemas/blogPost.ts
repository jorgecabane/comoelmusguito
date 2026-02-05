/**
 * Schema: Blog Post / Proyecto
 * Para documentar proyectos grandes realizados por el Musguito
 */

import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'blogPost',
  title: 'Proyectos',
  type: 'document',
  icon: () => '📝',
  fields: [
    // Información Básica
    defineField({
      name: 'name',
      title: 'Título del Proyecto',
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
      name: 'excerpt',
      title: 'Resumen',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().max(200),
      description: 'Descripción corta para cards y previews (máx 200 caracteres)',
    }),
    defineField({
      name: 'content',
      title: 'Contenido',
      type: 'array',
      of: [
        {
          type: 'block',
          // Deshabilitar blockquote estándar para evitar errores de hidratación
          // Usar el bloque personalizado "Cita Destacada" en su lugar
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H1', value: 'h1' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
          ],
        },
        {
          type: 'image',
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Texto Alternativo',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
          ],
          options: {
            hotspot: true,
          },
        },
        {
          type: 'object',
          name: 'videoBlock',
          title: 'Video',
          fields: [
            {
              name: 'url',
              title: 'URL del Video',
              type: 'url',
              description: 'URL de Vimeo o YouTube',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'provider',
              title: 'Proveedor',
              type: 'string',
              options: {
                list: [
                  { title: 'Vimeo', value: 'vimeo' },
                  { title: 'YouTube', value: 'youtube' },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'caption',
              title: 'Caption (opcional)',
              type: 'string',
            },
          ],
          preview: {
            select: {
              url: 'url',
              provider: 'provider',
            },
            prepare({ url, provider }) {
              return {
                title: `Video (${provider || 'N/A'})`,
                subtitle: url || 'Sin URL',
              };
            },
          },
        },
        {
          type: 'object',
          name: 'quoteBlock',
          title: 'Cita Destacada',
          fields: [
            {
              name: 'quote',
              title: 'Cita',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'author',
              title: 'Autor (opcional)',
              type: 'string',
            },
          ],
          preview: {
            select: {
              quote: 'quote',
              author: 'author',
            },
            prepare({ quote, author }) {
              const preview = quote ? quote.slice(0, 50) + (quote.length > 50 ? '...' : '') : 'Sin cita';
              return {
                title: preview,
                subtitle: author ? `— ${author}` : 'Cita',
              };
            },
          },
        },
        {
          type: 'object',
          name: 'separatorBlock',
          title: 'Separador Visual',
          fields: [
            {
              name: 'style',
              title: 'Estilo',
              type: 'string',
              options: {
                list: [
                  { title: 'Línea Simple', value: 'line' },
                  { title: 'Línea con Espacio', value: 'spaced' },
                ],
              },
              initialValue: 'line',
            },
          ],
          preview: {
            prepare() {
              return {
                title: 'Separador Visual',
              };
            },
          },
        },
      ],
      description: 'Contenido completo del proyecto con texto, imágenes, videos y citas',
    }),

    // Media
    defineField({
      name: 'featuredImage',
      title: 'Imagen Destacada',
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
      description: 'Imagen principal para hero y cards',
    }),
    defineField({
      name: 'gallery',
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
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
          ],
        },
      ],
      description: 'Galería adicional de fotos del proyecto',
    }),
    defineField({
      name: 'featuredVideo',
      title: 'Video Destacado',
      type: 'object',
      fields: [
        {
          name: 'url',
          title: 'URL del Video',
          type: 'url',
          description: 'URL de Vimeo o YouTube',
        },
        {
          name: 'provider',
          title: 'Proveedor',
          type: 'string',
          options: {
            list: [
              { title: 'Vimeo', value: 'vimeo' },
              { title: 'YouTube', value: 'youtube' },
            ],
          },
        },
      ],
      description: 'Video principal del proyecto (opcional, para hero)',
    }),

    // Metadatos del Proyecto
    defineField({
      name: 'projectDate',
      title: 'Fecha del Proyecto',
      type: 'date',
      validation: (Rule) => Rule.required(),
      description: 'Fecha en que se realizó el proyecto',
    }),
    defineField({
      name: 'location',
      title: 'Ubicación',
      type: 'string',
      description: 'Ubicación del proyecto (ej: "Santiago, Chile", "Valparaíso")',
    }),
    defineField({
      name: 'tags',
      title: 'Tags / Categorías',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      description: 'Categorías del proyecto (ej: "Instalación", "Comercial", "Residencial")',
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
      description: 'El proyecto está visible en el sitio',
    }),
    defineField({
      name: 'featured',
      title: 'Destacado',
      type: 'boolean',
      initialValue: false,
      description: 'Mostrar en secciones destacadas',
    }),
    defineField({
      name: 'order',
      title: 'Orden de Visualización',
      type: 'number',
      description: 'Menor número aparece primero (por defecto se ordena por fecha)',
    }),
  ],

  preview: {
    select: {
      title: 'name',
      media: 'featuredImage',
      date: 'projectDate',
      published: 'published',
    },
    prepare(selection) {
      const { title, date, published } = selection;
      const formattedDate = date ? new Date(date).toLocaleDateString('es-CL') : 'Sin fecha';
      const status = !published ? '(Borrador)' : '';
      return {
        title: title || 'Sin título',
        subtitle: `${formattedDate} ${status}`.trim(),
        media: selection.media,
      };
    },
  },
});
