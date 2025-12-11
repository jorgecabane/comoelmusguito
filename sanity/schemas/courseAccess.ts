/**
 * Schema: CourseAccess
 * Acceso de usuarios a cursos comprados
 */

import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'courseAccess',
  title: 'Acceso a Curso',
  type: 'document',
  icon: () => '🎓',
  fields: [
    defineField({
      name: 'user',
      title: 'Usuario',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
      options: {
        disableNew: true,
      },
    }),
    defineField({
      name: 'course',
      title: 'Curso',
      type: 'reference',
      to: [{ type: 'course' }],
      validation: (Rule) => Rule.required(),
      options: {
        disableNew: true,
      },
    }),
    defineField({
      name: 'order',
      title: 'Orden',
      type: 'reference',
      to: [{ type: 'order' }],
      description: 'Orden que otorgó este acceso',
      options: {
        disableNew: true,
      },
    }),
    defineField({
      name: 'accessGrantedAt',
      title: 'Fecha de Acceso',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: 'progress',
      title: 'Progreso',
      type: 'object',
      fields: [
        {
          name: 'completedLessons',
          title: 'Lecciones Completadas',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'IDs de lecciones completadas',
        },
        {
          name: 'lastWatched',
          title: 'Última Lección Vista',
          type: 'string',
          description: 'ID de la última lección vista',
        },
        {
          name: 'lastWatchedAt',
          title: 'Última Vez Vista',
          type: 'datetime',
        },
        {
          name: 'totalWatchTime',
          title: 'Tiempo Total de Visualización (minutos)',
          type: 'number',
        },
      ],
    }),
  ],
  preview: {
    select: {
      userName: 'user.name',
      userEmail: 'user.email',
      courseName: 'course.name',
      accessDate: 'accessGrantedAt',
    },
    prepare({ userName, userEmail, courseName, accessDate }) {
      return {
        title: `${userName || userEmail || 'Usuario'} → ${courseName || 'Curso'}`,
        subtitle: accessDate
          ? `Acceso desde ${new Date(accessDate).toLocaleDateString('es-CL')}`
          : 'Sin fecha',
      };
    },
  },
  orderings: [
    {
      title: 'Fecha de Acceso (Más reciente)',
      name: 'accessGrantedAtDesc',
      by: [{ field: 'accessGrantedAt', direction: 'desc' }],
    },
  ],
});



