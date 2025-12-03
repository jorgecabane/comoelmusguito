/**
 * NextAuth.js API Route (v4) - App Router compatible
 */

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getUserByEmail, createUser, verifyPassword, updateUser } from '@/lib/auth/sanity-adapter';
import { linkOrdersToUser } from '@/lib/sanity/orders';

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await getUserByEmail(credentials.email as string);
          if (!user || !user.passwordHash) {
            return null;
          }

          // Verificar si el email está verificado (solo si está habilitado)
          const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
          if (requireEmailVerification && !user.emailVerified) {
            // Si se requiere verificación y el email no está verificado, rechazar login
            console.warn(`⚠️ Intento de login con email no verificado: ${credentials.email}`);
            // Lanzar error específico para que NextAuth lo capture
            throw new Error('EmailNotVerified');
          }

          const isValid = await verifyPassword(
            credentials.password as string,
            user.passwordHash
          );

          if (!isValid) {
            return null;
          }

          return {
            id: user._id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Error en autenticación:', error);
          return null;
        }
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
