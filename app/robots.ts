import { MetadataRoute } from 'next';

/**
 * Genera robots.txt
 * Controla qué pueden y no pueden indexar los buscadores
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comoelmusguito.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // API routes privadas
          '/mis-cursos/*',   // Área de usuario autenticado
          '/perfil/*',       // Perfil privado
          '/ordenes/*',      // Órdenes privadas
          '/admin/',         // Admin (si se implementa)
          '/_next/',         // Assets de Next.js
          '/checkout/*',     // Proceso de pago
        ],
      },
      // Bloquear bots específicos si es necesario
      // {
      //   userAgent: 'BadBot',
      //   disallow: '/',
      // },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

