# 🔒 Auditoría de Seguridad - Autenticación y Cuentas de Usuario

**Fecha:** 2025-01-XX  
**Estado:** Análisis Completo

## 📋 Resumen Ejecutivo

Este documento analiza las vulnerabilidades de seguridad en el sistema de autenticación (login, registro, mi cuenta), identificando posibles vectores de ataque y proponiendo mejoras.

---

## ⚠️ VULNERABILIDADES ENCONTRADAS

### 1. **FALTA DE RATE LIMITING EN LOGIN** 🔴 CRÍTICO

**Problema:**
No hay límites de intentos de login, permitiendo ataques de fuerza bruta.

**Riesgo:**
- Atacante puede intentar miles de contraseñas por minuto
- Cuentas pueden ser comprometidas con contraseñas débiles
- DoS al sistema de autenticación

**Evidencia:**
```typescript
// app/api/auth/[...nextauth]/route.ts
// No hay rate limiting en el endpoint de login
async authorize(credentials) {
  // ... verifica contraseña sin límite de intentos
}
```

**Solución:**
- ✅ Implementar rate limiting por IP y por email
- ✅ Bloquear cuenta después de X intentos fallidos
- ✅ Implementar CAPTCHA después de N intentos

---

### 2. **FALTA DE RATE LIMITING EN REGISTRO** 🟠 ALTO

**Problema:**
No hay límites en el endpoint de registro, permitiendo:
- Spam de cuentas
- Enumeración de emails existentes
- Abuso del sistema

**Evidencia:**
```typescript
// app/api/auth/register/route.ts
// No hay rate limiting
export async function POST(request: NextRequest) {
  // ... crea usuario sin límite
}
```

**Solución:**
- ✅ Rate limiting por IP (3 registros por hora)
- ✅ Rate limiting por email (1 registro por email)
- ✅ CAPTCHA obligatorio (ya implementado con reCAPTCHA)

---

### 3. **ENUMERACIÓN DE USUARIOS** 🟠 ALTO

**Problema:**
El endpoint `/api/auth/check-email` permite verificar si un email existe sin autenticación.

**Evidencia:**
```typescript
// app/api/auth/check-email/route.ts
export async function GET(request: NextRequest) {
  const user = await getUserByEmail(email);
  return NextResponse.json({
    exists: true, // ⚠️ Expone si el email existe
    verified: user.emailVerified || false,
  });
}
```

**Riesgo:**
- Atacante puede enumerar todos los emails registrados
- Información sensible (emails de usuarios)
- Base para ataques dirigidos

**Solución:**
- ✅ Agregar rate limiting estricto (5 requests por hora por IP)
- ✅ Retornar siempre el mismo tiempo de respuesta (evitar timing attacks)
- ✅ Considerar eliminar el endpoint o hacerlo privado

---

### 4. **CONTRASEÑAS DÉBILES** 🟡 MEDIO

**Problema:**
Solo se valida longitud mínima (6 caracteres), no se valida complejidad.

**Evidencia:**
```typescript
// app/api/auth/register/route.ts
if (!password || password.length < 6) {
  return NextResponse.json(
    { error: 'La contraseña debe tener al menos 6 caracteres' },
    { status: 400 }
  );
}
```

**Riesgo:**
- Contraseñas como "123456" son válidas
- Fáciles de adivinar en ataques de fuerza bruta

**Solución:**
- ✅ Validar complejidad (mayúsculas, minúsculas, números, símbolos)
- ✅ Longitud mínima de 8 caracteres
- ✅ Mostrar indicador de fortaleza de contraseña en frontend

---

### 5. **TOKENS DE VERIFICACIÓN DÉBILES** 🟡 MEDIO

**Problema:**
Los tokens de verificación de email se generan con `Math.random()`, que no es criptográficamente seguro.

**Evidencia:**
```typescript
// lib/auth/sanity-adapter.ts
function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}
```

**Riesgo:**
- Tokens predecibles
- Posible adivinación de tokens

**Solución:**
- ✅ Usar `crypto.randomBytes()` para tokens criptográficamente seguros
- ✅ Tokens más largos (32+ caracteres)

---

### 6. **FALTA DE BLOQUEO DE CUENTA** 🟡 MEDIO

**Problema:**
No hay sistema de bloqueo temporal después de múltiples intentos fallidos de login.

**Riesgo:**
- Ataques de fuerza bruta pueden continuar indefinidamente
- No hay protección automática contra ataques

**Solución:**
- ✅ Bloquear cuenta después de 5 intentos fallidos
- ✅ Bloqueo temporal (15 minutos) o permanente hasta reset
- ✅ Notificar al usuario por email si se detecta actividad sospechosa

---

### 7. **FALTA DE VALIDACIÓN DE SESIÓN EN ENDPOINTS** 🟡 MEDIO

**Problema:**
Algunos endpoints que deberían requerir autenticación no la validan explícitamente.

**Evidencia:**
```typescript
// app/api/auth/user-id/route.ts
// No se valida explícitamente la sesión
export async function GET(request: NextRequest) {
  // ... retorna userId sin validar sesión
}
```

**Solución:**
- ✅ Validar sesión en todos los endpoints que requieren autenticación
- ✅ Usar middleware de autenticación

---

### 8. **INFORMACIÓN SENSIBLE EN LOGS** 🟡 MEDIO

**Problema:**
Se loguean emails y tokens parciales en desarrollo, pero podría filtrarse información sensible.

**Evidencia:**
```typescript
// app/api/auth/register/route.ts
console.log('📝 Token recibido:', recaptchaToken.substring(0, 20) + '...');
```

**Solución:**
- ✅ No loguear información sensible en producción
- ✅ Usar variables de entorno para controlar logging
- ✅ Sanitizar logs antes de guardar

---

### 9. **FALTA DE CSRF PROTECTION** 🟡 MEDIO

**Problema:**
NextAuth.js maneja CSRF automáticamente, pero deberíamos verificar que esté configurado correctamente.

**Solución:**
- ✅ Verificar configuración de CSRF en NextAuth
- ✅ Agregar tokens CSRF en formularios críticos

---

### 10. **FALTA DE VALIDACIÓN DE ORIGEN** 🟡 MEDIO

**Problema:**
No se valida el origen de las peticiones en algunos endpoints.

**Solución:**
- ✅ Validar `Origin` header en endpoints sensibles
- ✅ CORS configurado correctamente

---

## ✅ PROTECCIONES ACTUALES

### 1. **Hash de Contraseñas con bcrypt** ✅
- Usa `bcrypt` con salt rounds (10)
- Contraseñas nunca se almacenan en texto plano

### 2. **reCAPTCHA en Registro** ✅
- Implementado con Google reCAPTCHA
- Verificación en backend
- Score mínimo de 0.5

### 3. **Verificación de Email** ✅
- Tokens de verificación con expiración (48 horas)
- Email debe ser verificado para login (si está habilitado)

### 4. **NextAuth.js** ✅
- Framework seguro para autenticación
- Maneja sesiones de forma segura
- Soporte para OAuth (Google)

### 5. **Validación de Email** ✅
- Se valida formato de email
- Se verifica que no exista antes de registrar

### 6. **OAuth con Google** ✅
- Login seguro con Google
- Email verificado automáticamente

---

## 🛠️ PLAN DE MEJORAS PRIORIZADO

### **FASE 1: CRÍTICO (Implementar Inmediatamente)**

#### 1.1 Rate Limiting en Login
```typescript
// app/api/auth/[...nextauth]/route.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const loginRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 intentos por 15 minutos
});

// En authorize()
const ip = request.headers.get('x-forwarded-for') || 'unknown';
const email = credentials.email;

// Rate limit por IP
const ipLimit = await loginRatelimit.limit(`login:ip:${ip}`);
if (!ipLimit.success) {
  throw new Error('Demasiados intentos. Intenta más tarde.');
}

// Rate limit por email
const emailLimit = await loginRatelimit.limit(`login:email:${email}`);
if (!emailLimit.success) {
  throw new Error('Demasiados intentos desde este email. Intenta más tarde.');
}
```

#### 1.2 Rate Limiting en Registro
```typescript
// app/api/auth/register/route.ts
const registerRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 registros por hora
});

const ip = request.headers.get('x-forwarded-for') || 'unknown';
const ipLimit = await registerRatelimit.limit(`register:ip:${ip}`);
if (!ipLimit.success) {
  return NextResponse.json(
    { error: 'Demasiados intentos de registro. Intenta más tarde.' },
    { status: 429 }
  );
}
```

#### 1.3 Rate Limiting en Check Email
```typescript
// app/api/auth/check-email/route.ts
const checkEmailRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 checks por hora
});

const ip = request.headers.get('x-forwarded-for') || 'unknown';
const ipLimit = await checkEmailRatelimit.limit(`check-email:ip:${ip}`);
if (!ipLimit.success) {
  // Retornar respuesta genérica sin exponer si existe
  return NextResponse.json({
    exists: false, // Siempre false para no exponer información
    verified: false,
  });
}
```

#### 1.4 Tokens Criptográficamente Seguros
```typescript
// lib/auth/sanity-adapter.ts
import crypto from 'crypto';

function generateVerificationToken(): string {
  // Generar token seguro de 32 bytes (64 caracteres hex)
  return crypto.randomBytes(32).toString('hex');
}
```

---

### **FASE 2: ALTO (Implementar Pronto)**

#### 2.1 Validación de Complejidad de Contraseña
```typescript
// lib/auth/sanity-adapter.ts
function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial');
  }

  // Verificar contraseñas comunes
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('La contraseña es demasiado común');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

#### 2.2 Bloqueo de Cuenta por Intentos Fallidos
```typescript
// Agregar campos al schema de user
{
  failedLoginAttempts: number,
  accountLockedUntil: datetime,
}

// En authorize()
const user = await getUserByEmail(credentials.email);
if (user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date()) {
  throw new Error('Cuenta bloqueada temporalmente. Intenta más tarde.');
}

// Si login falla
if (!isValid) {
  const failedAttempts = (user.failedLoginAttempts || 0) + 1;
  
  if (failedAttempts >= 5) {
    // Bloquear cuenta por 15 minutos
    await updateUser(user._id, {
      failedLoginAttempts: failedAttempts,
      accountLockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    
    // Notificar al usuario
    await sendSecurityAlertEmail(user.email, 'account_locked');
  } else {
    await updateUser(user._id, {
      failedLoginAttempts: failedAttempts,
    });
  }
  
  return null;
}

// Si login exitoso, resetear contador
await updateUser(user._id, {
  failedLoginAttempts: 0,
  accountLockedUntil: null,
});
```

#### 2.3 Ocultar Información en Check Email
```typescript
// app/api/auth/check-email/route.ts
// Siempre retornar el mismo tiempo de respuesta para evitar timing attacks
const startTime = Date.now();
const user = await getUserByEmail(email);
const elapsed = Date.now() - startTime;

// Asegurar tiempo mínimo de respuesta (ej: 200ms)
if (elapsed < 200) {
  await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
}

// Retornar siempre la misma estructura
return NextResponse.json({
  exists: user !== null,
  verified: user?.emailVerified || false,
});
```

---

### **FASE 3: MEDIO (Mejoras Continuas)**

#### 3.1 Validación de Sesión en Endpoints
```typescript
// lib/auth/middleware.ts
import { getSession } from '@/lib/auth/get-session';
import { NextRequest, NextResponse } from 'next/server';

export async function requireAuth(
  request: NextRequest
): Promise<{ session: any; user: any } | null> {
  const session = await getSession();
  
  if (!session?.user) {
    return null;
  }
  
  return { session, user: session.user };
}

// Uso en endpoints
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  // ... resto del código
}
```

#### 3.2 Logging Seguro
```typescript
// lib/utils/logger.ts
const isProduction = process.env.NODE_ENV === 'production';

export function logInfo(message: string, data?: any) {
  if (!isProduction) {
    console.log(message, sanitizeLogData(data));
  }
}

function sanitizeLogData(data: any): any {
  if (!data) return data;
  
  const sensitive = ['password', 'token', 'email', 'secret'];
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
```

#### 3.3 Validación de Origen
```typescript
// app/api/auth/register/route.ts
const allowedOrigins = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
];

const origin = request.headers.get('origin');
if (origin && !allowedOrigins.includes(origin)) {
  return NextResponse.json(
    { error: 'Origen no permitido' },
    { status: 403 }
  );
}
```

---

## 📊 MATRIZ DE RIESGO

| Vulnerabilidad | Probabilidad | Impacto | Prioridad | Estado |
|----------------|--------------|---------|-----------|--------|
| Falta rate limiting login | Alta | Crítico | 🔴 P0 | ⏳ Pendiente |
| Falta rate limiting registro | Alta | Alto | 🔴 P0 | ⏳ Pendiente |
| Enumeración de usuarios | Media | Alto | 🟠 P1 | ⏳ Pendiente |
| Contraseñas débiles | Alta | Medio | 🟡 P2 | ⏳ Pendiente |
| Tokens débiles | Baja | Medio | 🟡 P2 | ⏳ Pendiente |
| Falta bloqueo de cuenta | Media | Medio | 🟡 P2 | ⏳ Pendiente |
| Falta validación sesión | Baja | Medio | 🟡 P2 | ⏳ Pendiente |
| Info sensible en logs | Baja | Bajo | 🟢 P3 | ⏳ Pendiente |
| Falta CSRF protection | Baja | Medio | 🟡 P2 | ✅ NextAuth maneja |
| Falta validación origen | Baja | Medio | 🟡 P2 | ⏳ Pendiente |

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1 (Crítico)
- [ ] Rate limiting en login (por IP y email)
- [ ] Rate limiting en registro (por IP)
- [ ] Rate limiting en check-email (por IP)
- [ ] Tokens criptográficamente seguros

### Fase 2 (Alto)
- [ ] Validación de complejidad de contraseña
- [ ] Bloqueo de cuenta por intentos fallidos
- [ ] Ocultar información en check-email (timing attacks)

### Fase 3 (Medio)
- [ ] Validación de sesión en endpoints
- [ ] Logging seguro
- [ ] Validación de origen

---

## 🔗 REFERENCIAS

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [bcrypt Best Practices](https://github.com/kelektiv/node.bcrypt.js)

---

**Última actualización:** 2025-01-XX
