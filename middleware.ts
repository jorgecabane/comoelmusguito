/**
 * Next.js Middleware
 * Protege rutas que requieren autenticación
 * 
 * Nota: Next.js 16 marca middleware como deprecated en favor de "proxy",
 * pero next-auth todavía usa middleware. Este warning es esperado y el código
 * funciona correctamente. Cuando next-auth soporte proxy, migraremos.
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/mi-cuenta/:path*',
    '/mis-cursos/:path*',
    '/mis-pedidos/:path*',
  ],
};
