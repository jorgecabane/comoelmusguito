/**
 * Schema: User
 * Usuarios del sistema (clientes que se registran)
 */

import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'user',
  title: 'Usuario',
  type: 'document',
  icon: () => '👤',
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) =>
        Rule.required()
          .email(),
    }),
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      description: 'Nombre completo del usuario',
    }),
    defineField({
      name: 'image',
      title: 'Imagen de Perfil',
      type: 'image',
      description: 'Foto de perfil (puede venir de Google OAuth)',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'passwordHash',
      title: 'Hash de Contraseña',
      type: 'string',
      description: 'Hash bcrypt de la contraseña (solo para email/password)',
      hidden: true, // No mostrar en el Studio
    }),
    defineField({
      name: 'provider',
      title: 'Proveedor de Autenticación',
      type: 'string',
      options: {
        list: [
          { title: 'Email/Contraseña', value: 'credentials' },
          { title: 'Google', value: 'google' },
          { title: 'GitHub', value: 'github' },
        ],
      },
      initialValue: 'credentials',
    }),
    defineField({
      name: 'emailVerified',
      title: 'Email Verificado',
      type: 'boolean',
      description: 'Indica si el usuario ha verificado su email',
      initialValue: false,
    }),
    defineField({
      name: 'emailVerificationToken',
      title: 'Token de Verificación',
      type: 'string',
      description: 'Token para verificar el email (se genera al registrar)',
      hidden: true,
    }),
    defineField({
      name: 'emailVerificationExpires',
      title: 'Expiración de Token',
      type: 'datetime',
      description: 'Fecha de expiración del token de verificación',
      hidden: true,
    }),
    defineField({
      name: 'createdAt',
      title: 'Fecha de Registro',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: 'updatedAt',
      title: 'Última Actualización',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'image',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || subtitle || 'Usuario sin nombre',
        subtitle: subtitle || 'Sin email',
        media: media || '👤',
      };
    },
  },
});

