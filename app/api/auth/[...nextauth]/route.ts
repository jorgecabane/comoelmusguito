/**
 * NextAuth.js API Route (v4) - App Router compatible
 */

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getUserByEmail, createUser, verifyPassword, updateUser } from '@/lib/auth/sanity-adapter';
import { linkOrdersToUser } from '@/lib/sanity/orders';
import { applyRateLimit, getClientIP, loginRateLimit } from '@/lib/rate-limit/upstash';

async function findUserWithValidPassword(email: string, password: string) {
  try {
    const user = await getUserByEmail(email);
    if (!user?.passwordHash) {
      return null;
    }
    return (await verifyPassword(password, user.passwordHash)) ? user : null;
  } catch (error) {
    console.error('Error en autenticación:', error);
    return null;
  }
}

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) {
          return null;
        }

        // Fuerza bruta: limitar intentos por IP + email (sin Upstash se permite, ver applyRateLimit)
        const ip = getClientIP({ headers: new Headers(req?.headers) });
        const rateLimit = await applyRateLimit(loginRateLimit, `${ip}:${email}`);
        if (rateLimit?.success === false) {
          throw new Error('TooManyAttempts');
        }

        const user = await findUserWithValidPassword(email, password);
        if (!user) {
          return null;
        }

        // Solo tras validar la contraseña, para no revelar cuentas pendientes a terceros
        const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
        if (requireEmailVerification && !user.emailVerified) {
          // NextAuth expone el mensaje como `error` al cliente (login muestra el aviso de verificación)
          throw new Error('EmailNotVerified');
        }

        return {
          id: user._id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await getUserByEmail(user.email!);
          if (!existingUser) {
            // Usuario nuevo: crear cuenta con Google
            const newUser = await createUser({
              email: user.email!,
              name: user.name || undefined,
              image: user.image || undefined,
              provider: 'google',
              skipEmailVerification: true, // Google ya verifica el email
            });
            
            // Vincular órdenes pasadas por email
            if (newUser._id) {
              const linkedCount = await linkOrdersToUser(user.email!, newUser._id);
              if (linkedCount > 0) {
                console.log(`Vinculadas ${linkedCount} órdenes al nuevo usuario ${newUser._id}`);
              }
            }
          } else {
            // Usuario existe: VINCULAR CUENTA (mismo usuario, mismo email)
            // Actualizar imagen y nombre si vienen de Google y no existen
            const updates: any = {};
            if (user.image && !existingUser.image) {
              updates.image = user.image;
            }
            if (user.name && !existingUser.name) {
              updates.name = user.name;
            }
            // Marcar email como verificado si viene de Google
            if (!existingUser.emailVerified) {
              updates.emailVerified = true;
            }
            // Asegurar que 'google' esté en authMethods
            const currentMethods = new Set<string>(existingUser.authMethods ?? []);
            if (!currentMethods.has('google')) {
              currentMethods.add('google');
              updates.authMethods = Array.from(currentMethods);
            }

            if (Object.keys(updates).length > 0) {
              await updateUser(existingUser._id, updates);
            }
            
            // Vincular órdenes si no están vinculadas
            if (existingUser._id) {
              const linkedCount = await linkOrdersToUser(user.email!, existingUser._id);
              if (linkedCount > 0) {
                console.log(`Vinculadas ${linkedCount} órdenes al usuario existente ${existingUser._id}`);
              }
            }
            
            // IMPORTANTE: Usar el mismo ID de usuario existente
            // NextAuth usará este ID para la sesión
            user.id = existingUser._id;
          }
        } catch (error) {
          console.error('Error creando usuario desde Google:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export { authOptions };
