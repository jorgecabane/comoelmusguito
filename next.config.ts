import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración de Turbopack (Next.js 16 usa Turbopack por defecto)
  // El override en package.json ya resuelve el conflicto de jsdom
  turbopack: {},
  
  // Excluir jsdom del bundle de producción para evitar errores ESM
  // Nota: webpack config se mantiene para compatibilidad, pero Turbopack es el bundler por defecto
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Excluir jsdom del bundle del servidor
      config.externals = config.externals || [];
      config.externals.push('jsdom');
    }
    return config;
  },
  
  // Optimizaciones para mejorar el tiempo de build
  experimental: {
    // Optimizar imports de Sanity Studio y otras dependencias pesadas
    optimizePackageImports: ['@sanity/vision', 'sanity', 'react-player', 'framer-motion'],
  },
  
  // Cache largo para assets estáticos públicos (videos/imágenes) que casi no cambian.
  // Si un archivo se reemplaza, hay que cambiar su nombre para invalidar el cache del browser.
  async headers() {
    return [
      {
        source: '/videos/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  images: {
    // Cache más largo para imágenes servidas vía /_next/image (default eran 60s)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Sanity CDN
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/**',
      },
    ],
    // Calidades de imagen soportadas
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2678400, // 31 días
    // Calidades permitidas (incluye 90 para imágenes hero de alta calidad)
    qualities: [70, 75, 80, 85, 90],
  },
};

export default nextConfig;
