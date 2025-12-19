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
      type: 'url',
      description: 'URL de la foto de perfil (puede venir de Google OAuth o ser una URL externa)',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }).error('Debe ser una URL válida'),
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
      name: 'passwordResetToken',
      title: 'Token de Reset de Contraseña',
      type: 'string',
      description: 'Token para resetear la contraseña',
      hidden: true,
    }),
    defineField({
      name: 'passwordResetExpires',
      title: 'Expiración de Token de Reset',
      type: 'datetime',
      description: 'Fecha de expiración del token de reset de contraseña',
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
      imageUrl: 'image',
      provider: 'provider',
      emailVerified: 'emailVerified',
    },
    prepare({ title, subtitle, imageUrl, provider, emailVerified }) {
      // Agregar indicador de verificación
      const verifiedIcon = emailVerified ? ' ✅' : '';
      const providerText = provider === 'google' ? ' (Google)' : provider === 'github' ? ' (GitHub)' : ' (Email)';

      // No usar media - Sanity usará el icono por defecto del schema (👤)
      // Las URLs de imágenes externas no se pueden usar directamente como media en previews
      return {
        title: title || subtitle || 'Usuario sin nombre',
        subtitle: `${subtitle || 'Sin email'}${providerText}${verifiedIcon}`,
        // No incluir media - usar icono por defecto del schema
      };
    },
  },
});

