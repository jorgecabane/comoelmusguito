/**
 * Adaptador de Sanity para NextAuth
 * Funciones para interactuar con usuarios en Sanity
 */

import 'server-only';
import { client, writeClient } from '@/sanity/lib/client';
import bcrypt from 'bcryptjs';

export interface SanityUser {
  _id: string;
  _type: 'user';
  email: string;
  name?: string;
  image?: string;
  passwordHash?: string;
  provider?: 'credentials' | 'google' | 'github';
  emailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Obtener usuario por email
 */
export async function getUserByEmail(email: string): Promise<SanityUser | null> {
  try {
    const query = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch<SanityUser | null>(query, { email });
    return user;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
}

/**
 * Obtener usuario por ID
 */
export async function getUserById(id: string): Promise<SanityUser | null> {
  try {
    const query = `*[_type == "user" && _id == $id][0]`;
    const user = await client.fetch<SanityUser | null>(query, { id });
    return user;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
}

/**
 * Verificar si usuario tiene passwordHash (para email/password)
 */
export function hasPassword(user: SanityUser | null): boolean {
  return user?.passwordHash !== undefined && user.passwordHash !== null;
}

/**
 * Generar token de verificación único
 */
function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}

/**
 * Crear nuevo usuario
 */
export async function createUser(data: {
  email: string;
  name?: string;
  image?: string;
  password?: string;
  provider?: 'credentials' | 'google' | 'github';
  skipEmailVerification?: boolean; // Para OAuth (Google ya verifica)
}): Promise<SanityUser> {
  const now = new Date().toISOString();
  
  const userDoc: Omit<SanityUser, '_id'> = {
    _type: 'user',
    email: data.email.toLowerCase(),
    name: data.name,
    image: data.image,
    provider: data.provider || 'credentials',
    createdAt: now,
    updatedAt: now,
  };

  // Hash de contraseña si se proporciona
  if (data.password) {
    userDoc.passwordHash = await hashPassword(data.password);
  }

  // Verificación de email
  if (data.skipEmailVerification || data.provider === 'google') {
    // OAuth providers ya verifican el email
    userDoc.emailVerified = true;
  } else {
    // Generar token de verificación para email/password
    userDoc.emailVerified = false;
    userDoc.emailVerificationToken = generateVerificationToken();
    // Token expira en 48 horas
    const expires = new Date();
    expires.setHours(expires.getHours() + 48);
    userDoc.emailVerificationExpires = expires.toISOString();
  }

  // Usar writeClient para operaciones de escritura
  const created = await writeClient.create(userDoc);
  return created as SanityUser;
}

/**
 * Verificar contraseña
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error verificando contraseña:', error);
    return false;
  }
}

/**
 * Hash de contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verificar si email ya existe
 */
export async function emailExists(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return user !== null;
}

/**
 * Actualizar usuario existente (para vincular cuentas)
 */
export async function updateUser(
  userId: string,
  updates: Partial<SanityUser>
): Promise<SanityUser | null> {
  try {
    const updated = await writeClient
      .patch(userId)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .commit();
    return updated as unknown as SanityUser;
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return null;
  }
}

/**
 * Verificar email del usuario
 */
export async function verifyUserEmail(userId: string): Promise<boolean> {
  try {
    await writeClient
      .patch(userId)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date().toISOString(),
      })
      .commit();
    return true;
  } catch (error) {
    console.error('Error verificando email:', error);
    return false;
  }
}

/**
 * Obtener usuario por token de verificación
 */
export async function getUserByVerificationToken(
  token: string
): Promise<SanityUser | null> {
  try {
    const query = `*[_type == "user" && emailVerificationToken == $token][0]`;
    // @ts-expect-error - Sanity type inference issue with generic fetch
    const user = await client.fetch<SanityUser | null>(query, { token });
    
    if (!user) return null;
    
    // Verificar si el token expiró
    if (user.emailVerificationExpires) {
      const expires = new Date(user.emailVerificationExpires);
      if (expires < new Date()) {
        return null; // Token expirado
      }
    }
    
    return user;
  } catch (error) {
    console.error('Error obteniendo usuario por token:', error);
    return null;
  }
}

/**
 * Generar token de reset de contraseña
 */
function generateResetToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}

/**
 * Crear token de reset de contraseña para un usuario
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  try {
    const user = await getUserByEmail(email);
    if (!user || !user.passwordHash) {
      // Usuario no existe o no tiene contraseña (solo OAuth)
      return null;
    }

    const resetToken = generateResetToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Expira en 1 hora

    await writeClient
      .patch(user._id)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: expires.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .commit();

    return resetToken;
  } catch (error) {
    console.error('Error creando token de reset:', error);
    return null;
  }
}

/**
 * Obtener usuario por token de reset de contraseña
 */
export async function getUserByResetToken(
  token: string
): Promise<SanityUser | null> {
  try {
    const query = `*[_type == "user" && passwordResetToken == $token][0]`;
    // @ts-expect-error - Sanity type inference issue with generic fetch
    const user = await client.fetch<SanityUser | null>(query, { token });
    
    if (!user) return null;
    
    // Verificar si el token expiró
    if (user.passwordResetExpires) {
      const expires = new Date(user.passwordResetExpires);
      if (expires < new Date()) {
        return null; // Token expirado
      }
    }
    
    return user;
  } catch (error) {
    console.error('Error obteniendo usuario por token de reset:', error);
    return null;
  }
}

/**
 * Resetear contraseña del usuario
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<boolean> {
  try {
    const passwordHash = await hashPassword(newPassword);
    
    await writeClient
      .patch(userId)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date().toISOString(),
      })
      .commit();
    
    return true;
  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    return false;
  }
}

/**
 * Regenerar token de verificación de email
 */
export async function regenerateVerificationToken(email: string): Promise<string | null> {
  try {
    const user = await getUserByEmail(email);
    if (!user || user.emailVerified) {
      return null;
    }

    const verificationToken = generateVerificationToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 48); // Expira en 48 horas

    await writeClient
      .patch(user._id)
      .set({
        emailVerificationToken: verificationToken,
        emailVerificationExpires: expires.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .commit();

    return verificationToken;
  } catch (error) {
    console.error('Error regenerando token de verificación:', error);
    return null;
  }
}

