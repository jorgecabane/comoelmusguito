# 🔒 Auditoría de Seguridad - Carrito y Checkout

**Fecha:** 2025-01-XX  
**Estado:** Análisis Completo

## 📋 Resumen Ejecutivo

Este documento analiza las vulnerabilidades de seguridad en el sistema de carrito de compras y checkout, identificando posibles vectores de ataque y proponiendo mejoras.

---

## ⚠️ VULNERABILIDADES CRÍTICAS

### 1. **MANIPULACIÓN DE PRECIOS EN EL CLIENTE** 🔴 CRÍTICO ✅ **RESUELTO**

**Estado:** ✅ **IMPLEMENTADO** - Los precios ahora se validan en el servidor antes de procesar la orden.

**Problema:**
Los precios se almacenan en el carrito del cliente (localStorage) y se envían directamente al servidor sin validación.

**Ubicación:**
- `lib/store/useCartStore.ts` - El carrito guarda `item.price` en localStorage
- `app/api/checkout/route.ts` - El servidor acepta `items` del cliente sin validar precios

**Riesgo:**
Un atacante puede:
1. Modificar el localStorage para cambiar precios
2. Interceptar la petición POST a `/api/checkout` y modificar los precios
3. Comprar productos a precio $0 o precios manipulados

**Evidencia en código:**
```typescript
// app/api/checkout/route.ts línea 83-88
items.forEach((item) => {
  const currency = item.currency;
  if (!totalsByCurrency[currency]) {
    totalsByCurrency[currency] = 0;
  }
  totalsByCurrency[currency] += item.price * item.quantity; // ⚠️ Precio viene del cliente
});
```

**Solución:**
- ✅ **Validar precios en el servidor** consultando Sanity antes de crear la orden ✅ **IMPLEMENTADO**
- ✅ **No confiar en datos del cliente** - usar solo IDs y cantidades ✅ **IMPLEMENTADO**
- ✅ **Recalcular totales en el servidor** basándose en datos de Sanity ✅ **IMPLEMENTADO**

**Implementación:**
- Se agregaron funciones `getTerrariumById()`, `getCourseById()`, `getWorkshopById()` en `lib/sanity/fetch.ts`
- El checkout ahora valida precios comparándolos con los de Sanity (tolerancia de $1 por redondeo)
- Se rechazan órdenes con precios manipulados
- Los totales se calculan usando precios validados del servidor

---

### 2. **FALTA DE VALIDACIÓN DE PRODUCTOS** 🟠 ALTO ✅ **RESUELTO**

**Estado:** ✅ **IMPLEMENTADO** - Todos los productos se validan antes de procesar la orden.

**Problema:**
El servidor no verifica que los productos existan, estén publicados, o que los IDs sean válidos antes de procesar el pago.

**Riesgo:**
- Crear órdenes con productos inexistentes
- Comprar productos despublicados
- Manipular IDs de productos

**Evidencia:**
```typescript
// app/api/checkout/route.ts
// Solo valida stock, pero no verifica que el producto exista o esté publicado
const stockCheck = await checkTerrariumStock(item.id, item.quantity);
```

**Solución:**
- ✅ Validar existencia del producto en Sanity ✅ **IMPLEMENTADO**
- ✅ Verificar que el producto esté `published: true` ✅ **IMPLEMENTADO**
- ✅ Validar que el tipo de producto coincida (terrarium/course/workshop) ✅ **IMPLEMENTADO**

**Implementación:**
- Se valida la existencia de cada producto consultando Sanity por ID
- Se verifica `published: true` para cursos y talleres, `inStock: true` para terrarios
- Se valida el tipo de producto antes de procesar
- Se rechazan órdenes con productos inexistentes o no disponibles

---

### 3. **RACE CONDITIONS EN STOCK** 🟠 ALTO

**Problema:**
Entre la validación de stock y el descuento real, puede haber múltiples compras simultáneas que agoten el stock.

**Flujo actual:**
1. Cliente A valida stock (hay 1 unidad) ✅
2. Cliente B valida stock (hay 1 unidad) ✅
3. Cliente A completa pago → descuenta stock (0 unidades)
4. Cliente B completa pago → descuenta stock (-1 unidades) ⚠️

**Evidencia:**
```typescript
// app/api/checkout/route.ts - Validación
const stockCheck = await checkTerrariumStock(item.id, item.quantity);

// app/api/webhooks/flow/route.ts - Descuento (después del pago)
await decreaseTerrariumStock(item.id, item.quantity);
```

**Solución:**
- ✅ **Reservar stock temporalmente** al crear la orden (con TTL)
- ✅ **Validar stock nuevamente** en el webhook antes de descontar
- ✅ **Usar transacciones atómicas** (ya implementado en `decreaseTerrariumStock`)

---

### 4. **MANIPULACIÓN DE CANTIDADES** 🟡 MEDIO ✅ **RESUELTO**

**Estado:** ✅ **IMPLEMENTADO** - Se agregaron límites de cantidad por producto y por orden.

**Problema:**
No hay límites máximos de compra por transacción o validación de cantidades razonables.

**Riesgo:**
- Comprar cantidades excesivas (ej: 10,000 terrarios)
- Agotar stock para otros clientes
- Posibles problemas de logística

**Solución:**
- ✅ Agregar límites máximos por tipo de producto ✅ **IMPLEMENTADO**
- ✅ Validar cantidades en el servidor ✅ **IMPLEMENTADO**

**Implementación:**
- Límite máximo de 10 unidades por producto (`MAX_QUANTITY_PER_ITEM`)
- Límite máximo de 20 productos por orden (`MAX_ITEMS_PER_ORDER`)
- Validación en `app/api/checkout/route.ts` antes de procesar
- Se rechazan órdenes que excedan estos límites

---

### 5. **FALTA DE VALIDACIÓN DE FECHAS DE TALLERES** 🟡 MEDIO ✅ **RESUELTO**

**Estado:** ✅ **IMPLEMENTADO** - Se valida completamente la fecha del taller antes de procesar.

**Problema:**
Para talleres, se valida que la fecha tenga cupos, pero no se verifica:
- Que la fecha sea válida
- Que la fecha no esté cancelada
- Que la fecha pertenezca al taller correcto

**Evidencia:**
```typescript
// app/api/checkout/route.ts línea 57-73
if (item.type === 'workshop' && item.selectedDate) {
  const spotsCheck = await checkWorkshopSpots(
    item.id,
    item.selectedDate.date, // ⚠️ No valida que la fecha sea válida
    item.quantity
  );
}
```

**Solución:**
- ✅ Validar que la fecha existe en el taller ✅ **IMPLEMENTADO**
- ✅ Verificar que la fecha no esté cancelada ✅ **IMPLEMENTADO**
- ✅ Validar que la fecha sea futura ✅ **IMPLEMENTADO**

**Implementación:**
- Se valida que la fecha existe en el array `dates` del taller
- Se verifica que `status !== 'cancelled'`
- Se valida que la fecha sea futura (`fechaTaller > new Date()`)
- Se rechazan órdenes con fechas inválidas, canceladas o pasadas

---

### 6. **CACHE DE EMAILS EN MEMORIA** 🟡 MEDIO ✅ **RESUELTO**

**Estado:** ✅ **IMPLEMENTADO** - El tracking de emails ahora se hace en Sanity.

**Problema:**
El sistema usa un `Set` en memoria para evitar emails duplicados. En producción con múltiples instancias (Vercel), cada instancia tiene su propio cache.

**Evidencia:**
```typescript
// app/api/webhooks/flow/route.ts línea 23
const sentEmails = new Set<string>(); // ⚠️ Ya no se usa
```

**Riesgo:**
- En despliegues serverless, múltiples instancias pueden enviar el mismo email
- El cache se pierde al reiniciar

**Solución:**
- ✅ Usar base de datos (Sanity) para trackear emails enviados ✅ **IMPLEMENTADO**
- ✅ Usar Redis o similar para cache distribuido (opcional futuro)
- ✅ Verificar en la orden si ya se envió el email ✅ **IMPLEMENTADO**

**Implementación:**
- Campo `emailSent: boolean` agregado al schema de `order`
- Función `markOrderEmailSent()` implementada en `lib/sanity/orders.ts`
- Webhook verifica `savedOrder.emailSent` antes de enviar email
- Se marca como enviado después de enviar exitosamente

---

### 7. **FALTA DE RATE LIMITING** 🟡 MEDIO

**Problema:**
No hay límites de rate limiting en las APIs de checkout, lo que permite:
- Ataques de fuerza bruta
- Spam de órdenes
- DoS

**Solución:**
- ✅ Implementar rate limiting (Vercel Edge Config, Upstash Redis)
- ✅ Límites por IP y por email

---

### 8. **VALIDACIÓN DE FIRMA DE WEBHOOK OPCIONAL** 🟡 MEDIO ✅ **RESUELTO**

**Estado:** ✅ **IMPLEMENTADO** - La validación de firma ahora es obligatoria.

**Problema:**
La validación de firma del webhook de Flow es opcional (solo si `s` está presente).

**Evidencia:**
```typescript
// app/api/webhooks/flow/route.ts línea 76-89 (ANTES)
if (s) {
  const isValid = verifyFlowSignature(flowData, process.env.FLOW_SECRET_KEY || '', s);
  // ...
}
```

**Riesgo:**
- Si Flow no envía la firma, el webhook se procesa sin validación
- Posibles ataques de webhook spoofing

**Solución:**
- ✅ Hacer la validación de firma obligatoria ✅ **IMPLEMENTADO**
- ✅ Rechazar webhooks sin firma válida ✅ **IMPLEMENTADO**

**Implementación:**
- Webhook ahora rechaza requests sin firma (`status: 401`)
- Validación siempre se ejecuta (no es opcional)
- Se loguean intentos de webhook sin firma como posibles ataques

---

## ✅ PROTECCIONES ACTUALES

### 1. **Validación de Precios en Servidor** ✅ **NUEVO**
- Los precios se validan consultando Sanity antes de crear la orden
- Se rechazan órdenes con precios manipulados
- Tolerancia de $1 por redondeo para evitar falsos positivos
- Los totales se calculan usando precios validados del servidor

### 2. **Validación de Productos** ✅ **NUEVO**
- Se valida existencia de cada producto consultando Sanity
- Se verifica estado de publicación/disponibilidad
- Se valida tipo de producto (terrarium/course/workshop)
- Se rechazan órdenes con productos inexistentes o no disponibles

### 3. **Validación de Fechas de Talleres** ✅ **NUEVO**
- Se valida que la fecha existe en el taller
- Se verifica que la fecha no esté cancelada
- Se valida que la fecha sea futura
- Se rechazan órdenes con fechas inválidas

### 4. **Límites de Cantidad** ✅ **NUEVO**
- Máximo 10 unidades por producto
- Máximo 20 productos por orden
- Validación en servidor antes de procesar

### 5. **Validación de Stock/Cupos** ✅
- Se valida stock antes de crear la orden
- Se valida nuevamente en el webhook (implícito al descontar)

### 6. **Transacciones Atómicas** ✅
- `decreaseTerrariumStock` y `decreaseWorkshopSpots` usan operaciones atómicas
- Previenen race conditions al descontar

### 7. **Idempotencia en Webhook** ✅
- Verifica si el email ya fue enviado
- Verifica estado de la orden antes de actualizar

### 8. **Validación de Email** ✅
- Se valida formato de email básico

### 9. **Firma HMAC en Flow** ✅
- Se calcula correctamente la firma para crear órdenes
- Se valida la firma en webhooks (cuando está presente)

---

## 🛠️ PLAN DE MEJORAS PRIORIZADO

### **FASE 1: CRÍTICO (Implementar Inmediatamente)**

#### 1.1 Validar Precios en el Servidor
**Archivo:** `app/api/checkout/route.ts`

```typescript
// Antes de calcular totales, validar y obtener precios reales
const validatedItems = await Promise.all(
  items.map(async (item) => {
    let product;
    let validatedPrice: number;
    let validatedCurrency: 'CLP' | 'USD';

    if (item.type === 'terrarium') {
      product = await getTerrariumById(item.id);
      if (!product || !product.published) {
        throw new Error(`Producto ${item.id} no encontrado o no disponible`);
      }
      validatedPrice = product.price;
      validatedCurrency = product.currency;
    } else if (item.type === 'course') {
      product = await getCourseById(item.id);
      if (!product || !product.published) {
        throw new Error(`Curso ${item.id} no encontrado o no disponible`);
      }
      // Obtener precio según moneda del usuario
      const pricing = getCoursePrice(product, userCurrency);
      validatedPrice = pricing.salePrice || pricing.price;
      validatedCurrency = pricing.currency;
    } else if (item.type === 'workshop') {
      product = await getWorkshopById(item.id);
      if (!product || !product.published) {
        throw new Error(`Taller ${item.id} no encontrado o no disponible`);
      }
      validatedPrice = product.price;
      validatedCurrency = product.currency;
    } else {
      throw new Error(`Tipo de producto inválido: ${item.type}`);
    }

    // Comparar precio del cliente con precio real (con tolerancia por redondeo)
    const priceDiff = Math.abs(item.price - validatedPrice);
    if (priceDiff > 1) { // Tolerancia de $1 por redondeo
      throw new Error(`Precio inválido para ${item.name}. Esperado: ${validatedPrice}, Recibido: ${item.price}`);
    }

    return {
      ...item,
      price: validatedPrice, // Usar precio validado
      currency: validatedCurrency,
    };
  })
);

// Usar validatedItems en lugar de items
```

#### 1.2 Validar Existencia y Estado de Productos
```typescript
// Agregar funciones en lib/sanity/fetch.ts
export async function getTerrariumById(id: string): Promise<Terrarium | null> {
  const query = `*[_type == "terrarium" && _id == $id][0]`;
  return await client.fetch(query, { id });
}

export async function getCourseById(id: string): Promise<Course | null> {
  const query = `*[_type == "course" && _id == $id][0]`;
  return await client.fetch(query, { id });
}

export async function getWorkshopById(id: string): Promise<Workshop | null> {
  const query = `*[_type == "workshop" && _id == $id][0]`;
  return await client.fetch(query, { id });
}
```

#### 1.3 Validar Fechas de Talleres
```typescript
// En app/api/checkout/route.ts
if (item.type === 'workshop' && item.selectedDate) {
  const workshop = await getWorkshopById(item.id);
  if (!workshop) {
    throw new Error(`Taller ${item.id} no encontrado`);
  }

  // Validar que la fecha existe y es válida
  const dateObj = workshop.dates?.find(
    (d) => new Date(d.date).toISOString() === new Date(item.selectedDate.date).toISOString()
  );

  if (!dateObj) {
    throw new Error(`Fecha ${item.selectedDate.date} no válida para el taller`);
  }

  if (dateObj.status === 'cancelled') {
    throw new Error(`La fecha seleccionada está cancelada`);
  }

  const fechaTaller = new Date(dateObj.date);
  if (fechaTaller <= new Date()) {
    throw new Error(`La fecha seleccionada ya pasó`);
  }

  // Validar cupos
  const spotsCheck = await checkWorkshopSpots(
    item.id,
    item.selectedDate.date,
    item.quantity
  );
  // ...
}
```

---

### **FASE 2: ALTO (Implementar Pronto)**

#### 2.1 Reserva Temporal de Stock
```typescript
// Crear función para reservar stock
export async function reserveTerrariumStock(
  terrariumId: string,
  quantity: number,
  orderId: string,
  ttlMinutes: number = 30
): Promise<boolean> {
  // Verificar stock disponible
  const stockCheck = await checkTerrariumStock(terrariumId, quantity);
  if (!stockCheck.available) {
    return false;
  }

  // Crear reserva en Sanity (documento temporal)
  const reservation = {
    _type: 'stockReservation',
    terrarium: { _type: 'reference', _ref: terrariumId },
    orderId,
    quantity,
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  await writeClient.create(reservation);
  return true;
}

// En checkout, reservar stock antes de crear orden en Flow
// En webhook, verificar reserva y descontar stock
```

#### 2.2 Validar Stock en Webhook
```typescript
// En app/api/webhooks/flow/route.ts, antes de descontar stock
const stockCheck = await checkTerrariumStock(item.id, item.quantity);
if (!stockCheck.available) {
  console.error(`⚠️ Stock insuficiente para orden ${commerceOrder}, item ${item.id}`);
  // No descontar, pero marcar orden como problema
  // Enviar alerta al administrador
  return NextResponse.json({ success: true, message: 'Stock insuficiente' }, { status: 200 });
}
```

#### 2.3 Límites de Cantidad
```typescript
// En app/api/checkout/route.ts
const MAX_QUANTITY_PER_ITEM = 10; // Configurable
const MAX_ITEMS_PER_ORDER = 20;

if (items.length > MAX_ITEMS_PER_ORDER) {
  throw new Error(`Máximo ${MAX_ITEMS_PER_ORDER} productos por orden`);
}

for (const item of items) {
  if (item.quantity > MAX_QUANTITY_PER_ITEM) {
    throw new Error(`Máximo ${MAX_QUANTITY_PER_ITEM} unidades por producto`);
  }
}
```

---

### **FASE 3: MEDIO (Mejoras Continuas)**

#### 3.1 Rate Limiting
```typescript
// Usar Vercel Edge Config o Upstash Redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 m'), // 5 requests por 10 minutos
});

// En app/api/checkout/route.ts
const ip = request.headers.get('x-forwarded-for') || 'unknown';
const { success } = await ratelimit.limit(`checkout:${ip}`);
if (!success) {
  return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
}
```

#### 3.2 Tracking de Emails en Sanity
```typescript
// En lugar de Set en memoria, usar campo en la orden
// Agregar campo emailSent: boolean a la orden
// Verificar antes de enviar
if (savedOrder.emailSent) {
  console.log(`Email ya enviado para orden ${commerceOrder}`);
  return NextResponse.json({ success: true, message: 'Email ya enviado' }, { status: 200 });
}

// Después de enviar
await writeClient.patch(savedOrder._id).set({ emailSent: true }).commit();
```

#### 3.3 Validación Obligatoria de Firma
```typescript
// En app/api/webhooks/flow/route.ts
if (!s) {
  console.error('Webhook sin firma rechazado');
  return NextResponse.json(
    { error: 'Firma requerida' },
    { status: 401 }
  );
}

const isValid = verifyFlowSignature(flowData, process.env.FLOW_SECRET_KEY || '', s);
if (!isValid) {
  console.error('Firma inválida en webhook de Flow');
  return NextResponse.json(
    { error: 'Firma inválida' },
    { status: 401 }
  );
}
```

---

## 📊 MATRIZ DE RIESGO

| Vulnerabilidad | Probabilidad | Impacto | Prioridad | Estado |
|----------------|--------------|---------|-----------|--------|
| Manipulación de precios | Alta | Crítico | 🔴 P0 | ✅ **RESUELTO** |
| Falta validación productos | Media | Alto | 🔴 P0 | ✅ **RESUELTO** |
| Race conditions stock | Media | Alto | 🟠 P1 | ⏳ Pendiente |
| Manipulación cantidades | Baja | Medio | 🟡 P2 | ✅ **RESUELTO** |
| Fechas talleres | Media | Medio | 🟡 P2 | ✅ **RESUELTO** |
| Cache emails | Baja | Medio | 🟡 P2 | ✅ **RESUELTO** |
| Rate limiting | Media | Medio | 🟡 P2 | ⏳ Pendiente |
| Firma webhook opcional | Baja | Medio | 🟡 P2 | ✅ **RESUELTO** |

---

## 🧪 TESTING DE SEGURIDAD

### Tests a Implementar:

1. **Test de Manipulación de Precios**
   ```typescript
   // Intentar comprar con precio modificado
   const maliciousItem = { ...validItem, price: 0 };
   // Debe rechazar la orden
   ```

2. **Test de Race Condition**
   ```typescript
   // Simular 2 compras simultáneas del último producto
   // Verificar que solo una se complete
   ```

3. **Test de Validación de Productos**
   ```typescript
   // Intentar comprar producto inexistente
   // Intentar comprar producto despublicado
   ```

4. **Test de Cantidades**
   ```typescript
   // Intentar comprar cantidad excesiva
   // Debe rechazar
   ```

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1 (Crítico) ✅ **COMPLETADA**
- [x] Validar precios en servidor consultando Sanity ✅
- [x] Validar existencia y estado de productos ✅
- [x] Validar fechas de talleres completamente ✅
- [x] Agregar funciones `getTerrariumById`, `getCourseById`, `getWorkshopById` ✅

**Archivos modificados:**
- `app/api/checkout/route.ts` - Validación completa de precios, productos y fechas
- `lib/sanity/fetch.ts` - Funciones para obtener productos por ID
- `sanity/lib/queries.ts` - Queries GROQ para productos por ID

### Fase 2 (Alto) 🔄 **EN PROGRESO**
- [x] Agregar límites de cantidad por item y por orden ✅
- [ ] Implementar reserva temporal de stock
- [ ] Validar stock en webhook antes de descontar

### Fase 3 (Medio) 🔄 **EN PROGRESO**
- [ ] Implementar rate limiting
- [x] Migrar tracking de emails a Sanity ✅
- [x] Hacer validación de firma obligatoria ✅

---

## 🔗 REFERENCIAS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Flow.cl Documentación](https://www.flow.cl/docs)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)

---

**Última actualización:** 2025-01-XX

---

## 📈 RESUMEN DE PROGRESO

### ✅ Issues Resueltos (6/8)
1. ✅ Manipulación de precios en el cliente
2. ✅ Falta de validación de productos
3. ✅ Manipulación de cantidades
4. ✅ Falta de validación de fechas de talleres
5. ✅ Cache de emails en memoria
6. ✅ Validación de firma de webhook opcional

### ⏳ Issues Pendientes (2/8)
1. ⏳ Race conditions en stock
2. ⏳ Falta de rate limiting

### 📊 Progreso General
- **Fase 1 (Crítico):** ✅ 100% Completada
- **Fase 2 (Alto):** 🔄 33% Completada (1/3)
- **Fase 3 (Medio):** 🔄 67% Completada (2/3)
- **Total:** 🔄 75% Completado (6/8 issues)
