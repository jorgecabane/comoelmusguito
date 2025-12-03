# 🔄 Flujo Completo de Pago - Planificación

## 📋 Resumen del Flujo

### 1. **Usuario Completa Checkout**
- Usuario en `/checkout` completa formulario
- Se crea orden en Flow con `commerceOrder` único
- Se redirige a Flow con `token` en la URL

### 2. **Usuario Paga en Flow**
- Flow procesa el pago
- Flow genera la **boleta/factura** (Flow es quien emite la boleta oficial)
- Flow redirige de vuelta a nuestra URL

### 3. **Callback de Flow** (`/checkout/callback`)
- Flow redirige con: `?token=XXXXX&order=ORD-XXXXX`
- Consultamos estado del pago
- Mostramos mensaje personalizado según resultado:
  - ✅ **Éxito**: Mensaje de felicitación con nuestro tono
  - ❌ **Error**: Mensaje de error con opciones para reintentar

### 4. **Webhook de Flow** (`/api/webhooks/flow`)
- Flow envía notificación POST cuando el pago se completa
- Validamos la firma de Flow
- Enviamos email de confirmación con Resend
- Guardamos información de la orden (opcional, para historial)

### 5. **Email de Confirmación**
- Enviado automáticamente cuando el pago se confirma
- Incluye:
  - Resumen de la compra
  - Número de orden
  - Detalles de productos
  - Link a boleta de Flow (si Flow lo proporciona)
  - Instrucciones según tipo de producto:
    - **Terrarios**: Retiro/Envío
    - **Cursos**: Acceso al curso
    - **Talleres**: Fecha y hora confirmada

---

## 🎯 Implementación

### A. Webhook de Flow (`/api/webhooks/flow`)

**Propósito**: Recibir notificaciones automáticas de Flow cuando un pago se completa

**Flujo**:
1. Flow envía POST con datos del pago
2. Validamos la firma de Flow (seguridad)
3. Verificamos que el pago esté confirmado (status = 2)
4. Obtenemos detalles de la orden desde nuestro sistema
5. Enviamos email de confirmación
6. Retornamos 200 OK a Flow

**Datos que Flow envía** (según documentación):
- `token`: Token del pago
- `commerceOrder`: Nuestro ID de orden
- `flowOrder`: Número de orden de Flow
- `status`: Estado del pago
- `amount`: Monto pagado
- `currency`: Moneda
- `payer`: Email del pagador
- `s`: Firma para validar

### B. Email con Resend

**Template de Email**:
- Asunto: "¡Tu compra en comoelmusguito está confirmada! 🌱"
- Contenido:
  - Saludo personalizado
  - Resumen de productos comprados
  - Número de orden
  - Total pagado
  - Próximos pasos según tipo de producto
  - Link a boleta de Flow (si está disponible)

**Tipos de Email**:
1. **Terrario**: Instrucciones de retiro/envío
2. **Curso Online**: Link de acceso + credenciales
3. **Taller**: Confirmación de fecha + dirección

### C. Mejora del Callback

**Mensajes Personalizados**:

✅ **Éxito**:
- "¡Tu ecosistema está en camino! 🌿"
- "Hemos recibido tu pago y estamos preparando tu pedido"
- Mostrar resumen de compra
- Botones: "Ver mis pedidos" / "Seguir explorando"

❌ **Error**:
- "Algo salió mal en el proceso de pago"
- "No te preocupes, tu dinero está seguro"
- Botones: "Intentar nuevamente" / "Contactar soporte"

⏳ **Pendiente**:
- "Tu pago está siendo procesado"
- "Te notificaremos por email cuando se confirme"

### D. Almacenamiento de Órdenes

**Opciones**:
1. **Solo en memoria/cache** (simple, para MVP)
2. **Base de datos** (Sanity, PostgreSQL, etc.)
3. **Archivo JSON** (para desarrollo)

**Para MVP**: Usar cache en memoria o localStorage del servidor
**Para Producción**: Base de datos (Sanity o PostgreSQL)

---

## 📧 Estructura del Email

```
┌─────────────────────────────────────┐
│  🌱 comoelmusguito                  │
│                                     │
│  ¡Tu compra está confirmada!        │
│                                     │
│  Hola [Nombre],                     │
│                                     │
│  Gracias por crear vida con         │
│  nosotros. Tu pedido está           │
│  confirmado:                        │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ Orden: ORD-1234567890        │  │
│  │ Fecha: 15 de enero, 2024     │  │
│  │ Total: $60.000 CLP           │  │
│  └─────────────────────────────┘  │
│                                     │
│  📦 Productos:                      │
│  • Terrario Epífito en Cúpula      │
│    $60.000 CLP                     │
│                                     │
│  [Próximos pasos según tipo]        │
│                                     │
│  Ver boleta en Flow →              │
│                                     │
│  Con cariño,                        │
│  Tomás Barrera                      │
│  comoelmusguito                     │
└─────────────────────────────────────┘
```

---

## 🔐 Seguridad

### Validación del Webhook

1. **Verificar firma**: Flow envía firma en parámetro `s`
2. **Validar datos**: Verificar que `commerceOrder` existe
3. **Idempotencia**: Evitar enviar emails duplicados
4. **Rate limiting**: Proteger endpoint de spam

### Almacenamiento Seguro

- No guardar datos de tarjeta (Flow maneja eso)
- Guardar solo: orderId, email, productos, monto, fecha
- Encriptar datos sensibles si se guardan en DB

---

## 🚀 Orden de Implementación

1. ✅ **Webhook endpoint** (`/api/webhooks/flow`)
   - Recibir notificaciones de Flow
   - Validar firma
   - Verificar estado del pago

2. ✅ **Integración con Resend**
   - Configurar Resend
   - Crear templates de email
   - Enviar email de confirmación

3. ✅ **Mejorar callback page**
   - Mensajes más personalizados
   - Mejor UX según resultado
   - Mostrar resumen de compra

4. ⏳ **Almacenamiento de órdenes** (opcional para MVP)
   - Guardar órdenes completadas
   - Historial de compras
   - Dashboard de pedidos

---

## 📝 Notas Importantes

### Sobre la Boleta

- **Flow genera la boleta oficial** (factura/boleta electrónica)
- Nosotros enviamos un **resumen de compra** en el email
- Podemos incluir link a la boleta de Flow si está disponible
- Flow maneja toda la parte fiscal/legal

### Sobre el Email

- Enviar **solo cuando el pago se confirma** (status = 2)
- No enviar en webhook si el callback ya lo hizo (evitar duplicados)
- Usar idempotencia: verificar si ya se envió email para esa orden

### Sobre el Callback

- El callback es **inmediato** (usuario ve resultado al instante)
- El webhook es **asíncrono** (Flow notifica cuando puede)
- Ambos pueden consultar el estado, pero el webhook es más confiable

---

## 🧪 Testing

### Flujos a Probar

1. **Pago exitoso**:
   - Usuario paga → Callback muestra éxito → Webhook envía email

2. **Pago rechazado**:
   - Usuario intenta pagar → Callback muestra error → No email

3. **Pago pendiente**:
   - Usuario inicia pago → Callback muestra pendiente → Webhook confirma después → Email

4. **Webhook sin callback**:
   - Flow notifica directamente → Email se envía → Usuario ve en su email

---

## 📚 Referencias

- [Flow Webhook Documentation](https://developers.flow.cl/api#section/Introduccion/Notificaciones-de-Flow-a-su-comercio)
- [Resend Documentation](https://resend.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

