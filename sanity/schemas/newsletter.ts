/**
 * Schema: Newsletter Subscriber
 * Suscriptores del newsletter
 */

import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'newsletterSubscriber',
  title: 'Suscriptores del Newsletter',
  type: 'document',
  icon: () => '📧',
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) =>
        Rule.required()
          .email()
          .lowercase()
          .error('Debe ser un email válido'),
    }),
    defineField({
      name: 'name',
      title: 'Nombre (Opcional)',
      type: 'string',
      description: 'Nombre del suscriptor si lo proporcionó',
    }),
    defineField({
      name: 'source',
      title: 'Origen',
      type: 'string',
      options: {
        list: [
          { title: 'Footer Home', value: 'footer-home' },
          { title: 'Footer General', value: 'footer-general' },
          { title: 'Página de Contacto', value: 'contact-page' },
          { title: 'Otro', value: 'other' },
        ],
      },
      initialValue: 'footer-home',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subscribedAt',
      title: 'Fecha de Suscripción',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'active',
      title: 'Activo',
      type: 'boolean',
      initialValue: true,
      description: 'Si está desactivado, el suscriptor no recibirá emails',
    }),
    defineField({
      name: 'unsubscribedAt',
      title: 'Fecha de Desuscripción',
      type: 'datetime',
      description: 'Fecha en que el usuario se desuscribió (si aplica)',
    }),
    defineField({
      name: 'tags',
      title: 'Etiquetas',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Etiquetas para segmentación (ej: "interesado-en-terrarios", "interesado-en-cursos")',
    }),
  ],
  preview: {
    select: {
      email: 'email',
      name: 'name',
      active: 'active',
      subscribedAt: 'subscribedAt',
    },
    prepare({ email, name, active, subscribedAt }) {
      const date = subscribedAt
        ? new Date(subscribedAt).toLocaleDateString('es-CL')
        : 'Sin fecha';
      const status = active ? '✅' : '❌';
      return {
        title: name ? `${name} (${email})` : email,
        subtitle: `${status} Suscrito el ${date}`,
      };
    },
  },
  orderings: [
    {
      title: 'Fecha de Suscripción (Más reciente)',
      name: 'subscribedAtDesc',
      by: [{ field: 'subscribedAt', direction: 'desc' }],
    },
    {
      title: 'Fecha de Suscripción (Más antigua)',
      name: 'subscribedAtAsc',
      by: [{ field: 'subscribedAt', direction: 'asc' }],
    },
    {
      title: 'Email (A-Z)',
      name: 'emailAsc',
      by: [{ field: 'email', direction: 'asc' }],
    },
  ],
});

