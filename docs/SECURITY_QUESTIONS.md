# 🔒 Preguntas de Seguridad - Respuestas y Soluciones

Este documento responde las dudas sobre implementaciones de seguridad pendientes.

---

## 1. 📧 Rate Limiting - Preguntas y Respuestas

### ¿Se tiene que configurar por Vercel o se puede hacer por código?

**Respuesta:** Se puede hacer **por código** sin necesidad de configuración especial en Vercel. Hay varias opciones:

#### Opción 1: Upstash Redis (Recomendada) ✅
- **Gratis:** Plan free incluye 10,000 requests/día
- **Implementación:** Por código usando `@upstash/ratelimit`
- **No requiere upgrade de Vercel:** Funciona con plan Hobby (free)
- **Ventajas:**
  - Funciona en serverless (Vercel)
  - Persistente entre instancias
  - Fácil de implementar

```typescript
// Ejemplo de implementación
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 m'), // 5 requests por 10 minutos
});
```

#### Opción 2: Vercel KV (Requiere upgrade)
- **Costo:** Requiere plan Pro ($20/mes) o superior
- **Implementación:** Similar a Upstash pero integrado con Vercel
- **Ventajas:** Integración nativa con Vercel

#### Opción 3: Edge Middleware (Limitado)
- **Gratis:** Incluido en plan free
- **Limitaciones:** Solo funciona en Edge Runtime, no en API Routes normales
- **No recomendado** para nuestro caso

### ¿Viene por defecto en el plan free?

**Respuesta:** ❌ **No viene por defecto**, pero puedes implementarlo gratis con Upstash Redis.

### ¿Qué significa límite por IP y por email?

**Límite por IP:**
- Identifica al usuario por su dirección IP
- **Problema:** Múltiples usuarios detrás de la misma IP (oficina, WiFi público) comparten el límite
- **Ventaja:** Previene ataques desde una IP específica

**Límite por email:**
- Identifica al usuario por su email
- **Ventaja:** Más preciso, cada usuario tiene su propio límite
- **Problema:** Requiere que el usuario ya haya proporcionado su email

**Recomendación:** Usar **ambos**:
- Por IP para endpoints públicos (checkout, registro)
- Por email para endpoints que requieren autenticación

### ¿Cómo se atajaría el límite por email?

**Implementación:**

```typescript
// En app/api/checkout/route.ts
const ip = request.headers.get('x-forwarded-for') || 'unknown';
const email = body.email;

// Rate limit por IP
const ipLimit = await ratelimit.limit(`checkout:ip:${ip}`);
if (!ipLimit.success) {
  return NextResponse.json(
    { error: 'Demasiadas solicitudes. Intenta más tarde.' },
    { status: 429 }
  );
}

// Rate limit por email (si está presente)
if (email) {
  const emailLimit = await ratelimit.limit(`checkout:email:${email}`);
  if (!emailLimit.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes desde este email. Intenta más tarde.' },
      { status: 429 }
    );
  }
}
```

**Límites recomendados:**
- **Checkout:** 5 intentos por 10 minutos (por IP y email)
- **Registro:** 3 intentos por hora (por IP y email)
- **Login:** 5 intentos por 15 minutos (por IP)

---

## 2. 🔄 Race Conditions en Stock - Solución con TTL

### Problema: ¿Qué pasa si el usuario se demora más que el TTL?

**Escenario:**
1. Usuario inicia checkout → Se reserva stock (TTL: 5 minutos)
2. Usuario se demora 10 minutos en completar el pago
3. La reserva expira → Stock vuelve a estar disponible
4. Otro usuario puede comprar el mismo producto
5. Ambos completan el pago → **Stock negativo** ⚠️

### Solución Robusta: Sistema de Reserva con Extensión y Validación Final

#### Componentes de la Solución:

1. **Reserva Temporal con TTL Extensible**
   - TTL inicial: 5 minutos
   - Se puede extender si el usuario sigue activo
   - Se limpia automáticamente si expira

2. **Validación Final en Webhook**
   - Antes de descontar stock, validar nuevamente
   - Si no hay stock suficiente, marcar orden como "problema"
   - Notificar al administrador

3. **Sistema de Prioridad**
   - Las reservas tienen prioridad sobre nuevas compras
   - Si hay reserva activa, no permitir nuevas compras del mismo producto

#### Implementación Propuesta:

```typescript
// 1. Crear schema de reserva en Sanity
// sanity/schemas/stockReservation.ts
{
  _type: 'stockReservation',
  orderId: string,
  productId: string,
  productType: 'terrarium' | 'workshop',
  quantity: number,
  reservedAt: datetime,
  expiresAt: datetime,
  extended: boolean, // Si se extendió el TTL
}

// 2. Función para reservar stock
async function reserveStock(
  productId: string,
  productType: 'terrarium' | 'workshop',
  quantity: number,
  orderId: string,
  initialTTL: number = 5 // minutos
): Promise<boolean> {
  // Verificar stock disponible (excluyendo reservas activas)
  const availableStock = await getAvailableStock(productId, productType);
  
  if (availableStock < quantity) {
    return false; // No hay stock suficiente
  }

  // Crear reserva
  const reservation = {
    _type: 'stockReservation',
    orderId,
    productId,
    productType,
    quantity,
    reservedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + initialTTL * 60 * 1000).toISOString(),
    extended: false,
  };

  await writeClient.create(reservation);
  return true;
}

// 3. Función para extender reserva (si el usuario sigue activo)
async function extendReservation(
  orderId: string,
  additionalMinutes: number = 5
): Promise<boolean> {
  const reservation = await getReservationByOrderId(orderId);
  
  if (!reservation) {
    return false; // No existe la reserva
  }

  const newExpiresAt = new Date(
    Math.max(
      new Date(reservation.expiresAt).getTime(),
      Date.now()
    ) + additionalMinutes * 60 * 1000
  ).toISOString();

  await writeClient
    .patch(reservation._id)
    .set({
      expiresAt: newExpiresAt,
      extended: true,
    })
    .commit();

  return true;
}

// 4. En checkout, extender reserva periódicamente
// (usando un endpoint que el frontend llama cada 4 minutos)
// app/api/checkout/extend-reservation/route.ts
export async function POST(request: NextRequest) {
  const { orderId } = await request.json();
  const extended = await extendReservation(orderId, 5);
  
  if (!extended) {
    return NextResponse.json(
      { error: 'Reserva no encontrada o expirada' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, extended: true });
}

// 5. En webhook, validar stock ANTES de descontar
// app/api/webhooks/flow/route.ts
if (item.type === 'terrarium') {
  // Verificar stock disponible (incluyendo reservas activas)
  const stockCheck = await checkTerrariumStock(item.id, item.quantity);
  
  if (!stockCheck.available) {
    // ⚠️ PROBLEMA: Stock insuficiente después del pago
    console.error(`⚠️ Stock insuficiente para orden ${commerceOrder}, item ${item.id}`);
    
    // Marcar orden como problema
    await markOrderAsProblem(commerceOrder, 'stock_insuficiente');
    
    // NO descontar stock
    // Notificar al administrador
    await notifyAdmin({
      type: 'stock_insufficient_after_payment',
      orderId: commerceOrder,
      itemId: item.id,
      requestedQuantity: item.quantity,
      availableStock: stockCheck.currentStock,
    });
    
    // Retornar éxito para Flow (pero no procesar)
    return NextResponse.json({
      success: true,
      message: 'Pago recibido pero stock insuficiente - requiere atención manual'
    }, { status: 200 });
  }

  // Si hay stock, descontar normalmente
  await decreaseTerrariumStock(item.id, item.quantity);
  
  // Eliminar reserva
  await removeReservation(commerceOrder);
}
```

#### Flujo Completo:

1. **Usuario inicia checkout:**
   - Se reserva stock (TTL: 5 min)
   - Frontend inicia timer para extender cada 4 minutos

2. **Usuario sigue en checkout (4 min después):**
   - Frontend llama `/api/checkout/extend-reservation`
   - Se extiende la reserva otros 5 minutos
   - Se repite mientras el usuario esté activo

3. **Usuario completa pago:**
   - Se crea orden en Flow
   - Se elimina la reserva (o se marca como "completada")

4. **Webhook de Flow:**
   - **Validar stock nuevamente** (puede haber cambiado)
   - Si hay stock → descontar y procesar
   - Si no hay stock → marcar como problema y notificar admin

#### Ventajas de esta Solución:

✅ **Robusta:** Maneja demoras largas del usuario  
✅ **Segura:** Validación final en webhook previene stock negativo  
✅ **Justa:** Las reservas tienen prioridad  
✅ **Transparente:** Notifica problemas al administrador  
✅ **Automática:** Limpia reservas expiradas  

#### Tareas Pendientes:

1. Crear schema `stockReservation` en Sanity
2. Implementar funciones de reserva/extensión
3. Agregar endpoint para extender reservas
4. Modificar webhook para validar stock antes de descontar
5. Crear sistema de notificaciones para admin
6. Implementar limpieza automática de reservas expiradas (cron job o scheduled function)

---

## 3. 📊 Resumen de Implementaciones

### ✅ Implementado (Listo para programar)

1. **Tracking de emails en Sanity** ✅
   - Campo `emailSent` agregado al schema
   - Función `markOrderEmailSent()` implementada
   - Webhook actualizado para usar Sanity en lugar de Set en memoria

2. **Validación obligatoria de firma** ✅
   - Webhook ahora rechaza requests sin firma
   - Validación siempre se ejecuta (no opcional)

### ⏳ Pendiente (Requiere decisión)

1. **Rate Limiting**
   - **Recomendación:** Usar Upstash Redis (gratis)
   - **Implementación:** ~2 horas de trabajo
   - **Costo:** $0 (plan free)

2. **Sistema de Reserva de Stock**
   - **Recomendación:** Implementar solución completa con TTL extensible
   - **Implementación:** ~4-6 horas de trabajo
   - **Costo:** $0 (usa Sanity)

---

## 4. 🎯 Próximos Pasos

### Prioridad Alta:
1. ✅ Tracking de emails en Sanity (COMPLETADO)
2. ✅ Validación obligatoria de firma (COMPLETADO)
3. ⏳ Rate limiting con Upstash Redis
4. ⏳ Sistema de reserva de stock con TTL extensible

### Prioridad Media:
1. Sistema de notificaciones para admin
2. Limpieza automática de reservas expiradas
3. Dashboard de monitoreo de reservas

---

## 5. ❓ Preguntas Adicionales sobre Rate Limiting

### ¿Qué pasa si nos consumimos las 10,000 requests del día de Upstash?

**Respuesta:** Si excedes el límite del plan free de Upstash (500,000 comandos/mes, no 10,000/día), el servicio retornará un error indicando que se excedió el límite.

**Límites reales del plan free:**
- **500,000 comandos/mes** (no 10,000/día)
- **256MB de datos**
- **1 base de datos**

**¿Qué hacer si se excede?**

1. **Opción 1: Fallback a Sanity (Recomendada)** ✅
   - Si Upstash falla, usar Sanity como respaldo
   - Guardar intentos de rate limiting en Sanity
   - Menos eficiente pero funcional

2. **Opción 2: Upgrade a Pay-as-you-go**
   - $0.20 por 100,000 comandos adicionales
   - Sin límite de comandos
   - Solo pagas lo que usas

3. **Opción 3: Implementar rate limiting más inteligente**
   - Solo aplicar rate limiting en endpoints críticos
   - Usar límites más conservadores
   - Cachear resultados cuando sea posible

**Implementación con Fallback:**

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { client } from '@/sanity/lib/client';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 m'),
});

// Función con fallback a Sanity
export async function checkRateLimit(
  key: string,
  limit: number = 5,
  window: string = '10 m'
): Promise<{ success: boolean; remaining: number }> {
  try {
    // Intentar con Upstash primero
    const result = await ratelimit.limit(key);
    return {
      success: result.success,
      remaining: result.remaining,
    };
  } catch (error) {
    // Si Upstash falla, usar Sanity como fallback
    console.warn('Upstash falló, usando Sanity como fallback:', error);
    return await checkRateLimitSanity(key, limit, window);
  }
}

// Fallback usando Sanity
async function checkRateLimitSanity(
  key: string,
  limit: number,
  window: string
): Promise<{ success: boolean; remaining: number }> {
  const now = new Date();
  const windowMs = parseWindow(window); // '10 m' -> 600000ms
  
  // Buscar intentos recientes en Sanity
  const query = `*[_type == "rateLimitAttempt" && key == $key && createdAt > $since] | order(createdAt desc)`;
  const since = new Date(now.getTime() - windowMs).toISOString();
  
  const attempts = await client.fetch(query, { key, since });
  
  if (attempts.length >= limit) {
    return { success: false, remaining: 0 };
  }
  
  // Registrar intento
  await client.create({
    _type: 'rateLimitAttempt',
    key,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + windowMs).toISOString(),
  });
  
  return { success: true, remaining: limit - attempts.length - 1 };
}
```

---

### ¿Qué pasa si Upstash se cae?

**Respuesta:** Si Upstash tiene downtime, el rate limiting dejaría de funcionar temporalmente. Por eso es importante tener un **fallback**.

**Estrategia de Fallback:**

1. **Fallback a Sanity** (como se muestra arriba)
   - Menos eficiente pero funcional
   - No requiere servicios externos adicionales

2. **Fallback a Rate Limiting Local**
   - Usar memoria local como último recurso
   - Solo para emergencias, no ideal para producción

3. **Degradación Graceful**
   - Si Upstash falla, permitir requests pero loguear
   - Notificar al administrador
   - Aplicar rate limiting más permisivo

**Implementación con Degradación:**

```typescript
export async function checkRateLimitWithFallback(key: string) {
  try {
    return await ratelimit.limit(key);
  } catch (error) {
    // Upstash falló - degradar a modo permisivo
    console.error('⚠️ Rate limiting falló, modo permisivo activado:', error);
    
    // Notificar admin (opcional)
    // await notifyAdmin('rate_limit_service_down');
    
    // Permitir request pero loguear
    return { success: true, remaining: 999 };
  }
}
```

---

## 6. 🔄 Reserva de Stock - Preguntas Detalladas

### ¿Cómo se reservaría el stock? ¿Dónde?

**Respuesta:** Se reservaría en **Sanity**, creando documentos temporales de tipo `stockReservation`.

**Ventajas de usar Sanity:**
- ✅ Ya lo tenemos configurado
- ✅ Gratis (dentro de los límites del plan)
- ✅ Persistente y confiable
- ✅ Fácil de consultar y limpiar
- ✅ No requiere servicios adicionales

**Schema propuesto:**

```typescript
// sanity/schemas/stockReservation.ts
{
  _type: 'stockReservation',
  orderId: string, // ID de la orden (ej: ORD-123)
  productId: string, // ID del producto en Sanity
  productType: 'terrarium' | 'workshop',
  quantity: number,
  reservedAt: datetime,
  expiresAt: datetime,
  extended: boolean,
  status: 'active' | 'completed' | 'expired',
}
```

### ¿El TTL cómo se limpiaría? ¿Usaríamos Redis también?

**Respuesta:** **NO necesitamos Redis** para limpiar el TTL. Podemos usar Sanity con una función programada.

**Opciones para limpiar reservas expiradas:**

#### Opción 1: Vercel Cron Jobs (Recomendada) ✅
- **Gratis:** Incluido en plan Hobby
- **Frecuencia:** Cada hora o diario
- **Implementación:** Archivo `vercel.json` o API route con `cron`

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-reservations",
      "schedule": "0 * * * *" // Cada hora
    }
  ]
}
```

```typescript
// app/api/cron/cleanup-reservations/route.ts
export async function GET(request: NextRequest) {
  // Verificar que viene de Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();
  
  // Buscar reservas expiradas
  const query = `*[_type == "stockReservation" && expiresAt < $now && status == "active"]`;
  const expired = await client.fetch(query, { now });
  
  // Marcar como expiradas
  for (const reservation of expired) {
    await writeClient
      .patch(reservation._id)
      .set({ status: 'expired', updatedAt: now })
      .commit();
  }
  
  return NextResponse.json({ 
    cleaned: expired.length,
    message: `Se limpiaron ${expired.length} reservas expiradas`
  });
}
```

#### Opción 2: Limpieza Lazy (On-Demand)
- Limpiar reservas expiradas cuando se consultan
- Más eficiente pero menos predecible

```typescript
async function getActiveReservations(productId: string) {
  const now = new Date().toISOString();
  
  // Buscar reservas activas (excluyendo expiradas)
  const query = `*[_type == "stockReservation" && productId == $productId && status == "active" && expiresAt >= $now]`;
  const active = await client.fetch(query, { productId, now });
  
  // Limpiar expiradas en el proceso
  const expiredQuery = `*[_type == "stockReservation" && productId == $productId && status == "active" && expiresAt < $now]`;
  const expired = await client.fetch(expiredQuery, { productId, now });
  
  // Marcar como expiradas (en background, no bloquea)
  if (expired.length > 0) {
    Promise.all(
      expired.map(r => 
        writeClient.patch(r._id).set({ status: 'expired' }).commit()
      )
    ).catch(console.error);
  }
  
  return active;
}
```

#### Opción 3: Sanity Scheduled Queries (Futuro)
- Sanity está trabajando en scheduled queries
- Por ahora, usar Vercel Cron es la mejor opción

**Recomendación:** Usar **Vercel Cron Jobs** (Opción 1) - es gratis y confiable.

---

## 7. 🛡️ Rate Limiting vs reCAPTCHA

### ¿reCAPTCHA no protege contra rate limiting en login?

**Respuesta:** **reCAPTCHA y rate limiting son complementarios**, no sustitutos:

**reCAPTCHA protege contra:**
- ✅ Bots automatizados
- ✅ Scripts de scraping
- ✅ Ataques automatizados

**reCAPTCHA NO protege contra:**
- ❌ Ataques manuales (humano real intentando muchas veces)
- ❌ Ataques distribuidos (múltiples IPs)
- ❌ DoS al servidor (muchas requests válidas)

**Rate Limiting protege contra:**
- ✅ Ataques manuales (límite de intentos)
- ✅ DoS (limita requests por tiempo)
- ✅ Abuso del sistema

**Solución Combinada (Recomendada):**

```typescript
// app/api/auth/[...nextauth]/route.ts
async authorize(credentials) {
  // 1. Rate limiting (siempre)
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimit = await checkRateLimit(`login:${ip}`, 5, '15 m');
  if (!rateLimit.success) {
    throw new Error('Demasiados intentos. Intenta más tarde.');
  }

  // 2. reCAPTCHA (después de N intentos fallidos)
  const failedAttempts = await getFailedAttempts(credentials.email);
  if (failedAttempts >= 3) {
    // Requerir reCAPTCHA después de 3 intentos fallidos
    if (!recaptchaToken || !await verifyRecaptcha(recaptchaToken)) {
      throw new Error('Verificación de seguridad requerida');
    }
  }

  // 3. Verificar contraseña
  // ...
}
```

**Ventajas de esta combinación:**
- ✅ Rate limiting previene abuso general
- ✅ reCAPTCHA previene bots después de intentos fallidos
- ✅ Menos fricción para usuarios legítimos
- ✅ Más seguridad contra ataques automatizados

---

### ¿Qué solución más genérica podemos tener para rate limiting de nuestros endpoints?

**Respuesta:** Crear un **middleware reutilizable** que se puede aplicar a cualquier endpoint.

**Implementación Genérica:**

```typescript
// lib/rate-limit/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitWithFallback } from './client';

interface RateLimitConfig {
  limit: number;
  window: string;
  identifier?: (req: NextRequest) => string;
  skipIf?: (req: NextRequest) => boolean;
}

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: NextRequest) => {
    // Skip si se cumple la condición
    if (config.skipIf && config.skipIf(request)) {
      return NextResponse.next();
    }

    // Obtener identificador (IP, email, etc.)
    const identifier = config.identifier 
      ? config.identifier(request)
      : request.headers.get('x-forwarded-for') || 'unknown';

    // Verificar rate limit
    const result = await checkRateLimitWithFallback(
      identifier,
      config.limit,
      config.window
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Demasiadas solicitudes. Intenta más tarde.',
          retryAfter: result.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(result.retryAfter || 60),
            'X-RateLimit-Limit': String(config.limit),
            'X-RateLimit-Remaining': String(result.remaining),
          }
        }
      );
    }

    // Agregar headers de rate limit a la respuesta
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(config.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    return response;
  };
}

// Uso en endpoints
// app/api/checkout/route.ts
import { createRateLimitMiddleware } from '@/lib/rate-limit/middleware';

const rateLimitMiddleware = createRateLimitMiddleware({
  limit: 5,
  window: '10 m',
  identifier: (req) => {
    // Rate limit por IP y email
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const body = await req.json();
    return `checkout:${ip}:${body.email}`;
  },
});

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request);
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse;
  }

  // Continuar con la lógica del endpoint
  // ...
}
```

**Configuraciones Predefinidas:**

```typescript
// lib/rate-limit/presets.ts
export const rateLimitPresets = {
  checkout: {
    limit: 5,
    window: '10 m',
    identifier: (req: NextRequest, body: any) => 
      `checkout:${req.headers.get('x-forwarded-for')}:${body.email}`,
  },
  register: {
    limit: 3,
    window: '1 h',
    identifier: (req: NextRequest) => 
      `register:${req.headers.get('x-forwarded-for')}`,
  },
  login: {
    limit: 5,
    window: '15 m',
    identifier: (req: NextRequest, body: any) => 
      `login:${req.headers.get('x-forwarded-for')}:${body.email}`,
  },
  checkEmail: {
    limit: 5,
    window: '1 h',
    identifier: (req: NextRequest) => 
      `check-email:${req.headers.get('x-forwarded-for')}`,
  },
};
```

---

## 8. 🔒 Endpoint Check Email - Hacerlo Privado

### ¿Cómo hacer privado el endpoint `/api/auth/check-email`?

**Respuesta:** Hay varias opciones, desde más simple hasta más robusta:

#### Opción 1: Requerir Autenticación (Simple) ✅

```typescript
// app/api/auth/check-email/route.ts
import { getSession } from '@/lib/auth/get-session';

export async function GET(request: NextRequest) {
  // Requerir sesión activa
  const session = await getSession();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  // Solo permitir verificar el email del usuario autenticado
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');

  // Verificar que el email coincide con el usuario autenticado
  if (email !== session.user.email) {
    return NextResponse.json(
      { error: 'No autorizado para verificar este email' },
      { status: 403 }
    );
  }

  // ... resto de la lógica
}
```

**Ventajas:**
- ✅ Simple de implementar
- ✅ Previene enumeración de usuarios
- ✅ Solo usuarios autenticados pueden verificar emails

**Desventajas:**
- ❌ No funciona para registro (usuario no está autenticado aún)

#### Opción 2: Rate Limiting Estricto + Respuesta Genérica (Recomendada) ✅

```typescript
// app/api/auth/check-email/route.ts
import { createRateLimitMiddleware } from '@/lib/rate-limit/middleware';

const strictRateLimit = createRateLimitMiddleware({
  limit: 5, // Solo 5 checks por hora
  window: '1 h',
});

export async function GET(request: NextRequest) {
  // Aplicar rate limiting estricto
  const rateLimitResponse = await strictRateLimit(request);
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse;
  }

  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  // Siempre retornar el mismo tiempo de respuesta (evitar timing attacks)
  const startTime = Date.now();
  const user = await getUserByEmail(email);
  const elapsed = Date.now() - startTime;

  // Asegurar tiempo mínimo de respuesta (200ms)
  if (elapsed < 200) {
    await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
  }

  // Retornar siempre la misma estructura (no exponer si existe)
  // Solo retornar información útil para el flujo de registro
  return NextResponse.json({
    // No exponer si existe directamente
    canRegister: user === null, // Solo indicar si puede registrar
    // Si existe, no dar más información
  });
}
```

**Ventajas:**
- ✅ Funciona para registro (no requiere autenticación)
- ✅ Rate limiting previene abuso
- ✅ No expone información sensible
- ✅ Timing attack protection

#### Opción 3: Eliminar Endpoint y Usar Validación en Registro (Más Segura) ✅

**Eliminar el endpoint público** y validar solo durante el registro:

```typescript
// app/api/auth/register/route.ts
export async function POST(request: NextRequest) {
  const { email, ... } = await request.json();

  // Verificar si existe (sin endpoint público)
  const exists = await emailExists(email);
  if (exists) {
    return NextResponse.json(
      { 
        error: 'Este email ya está registrado',
        existingUser: true,
      },
      { status: 400 }
    );
  }

  // ... crear usuario
}
```

**En el frontend, validar solo cuando el usuario envía el formulario:**

```typescript
// app/auth/register/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validar solo al enviar
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });

  const data = await response.json();
  
  if (data.existingUser) {
    setError('Este email ya está registrado. ¿Quieres iniciar sesión?');
  }
};
```

**Ventajas:**
- ✅ Más seguro (no hay endpoint de enumeración)
- ✅ Menos superficie de ataque
- ✅ Validación solo cuando es necesaria

**Recomendación:** **Opción 3** (eliminar endpoint) o **Opción 2** (rate limiting estricto) si necesitas validación en tiempo real.

---

## 9. 📊 Resumen de Recomendaciones

### Rate Limiting
- ✅ **Usar Upstash Redis** con fallback a Sanity
- ✅ **Implementar middleware genérico** reutilizable
- ✅ **Combinar con reCAPTCHA** para máxima protección

### Reserva de Stock
- ✅ **Usar Sanity** (no Redis necesario)
- ✅ **Limpieza con Vercel Cron Jobs** (gratis)
- ✅ **TTL extensible** para manejar demoras

### Check Email
- ✅ **Eliminar endpoint público** (más seguro)
- ✅ O **Rate limiting estricto** si se necesita en tiempo real

---

**Última actualización:** 2025-01-XX
