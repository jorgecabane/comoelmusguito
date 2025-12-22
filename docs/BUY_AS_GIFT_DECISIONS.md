# 🎁 Buy as Gift - Decisiones y Aclaraciones

## 📋 Resumen de Funcionalidad

Permitir que los usuarios compren cursos/workshops/terrariums como regalo para otra persona, con:
- Email del destinatario
- Mensaje personalizado opcional
- Orden vinculada al comprador (quien paga)
- Acceso otorgado al destinatario (quien recibe)
- El destinatario NO ve detalles de pago, solo el regalo

---

## ✅ Decisiones Finales

### 1. **Estructura de Datos en la Orden**

**Decisión:** Agregar campos a nivel de orden (no por item). Todos los productos de una orden son regalo o ninguno.

**Campos a agregar en `order`:**
```typescript
{
  // ... campos existentes
  isGift: boolean;
  recipientEmail?: string;
  recipientName?: string;
  giftMessage?: string;
  giftToken?: string; // Token único para canjeo si destinatario no tiene cuenta
}
```

**Razón:** Mantiene la simplicidad - 1 compra, N productos, todos como regalo o ninguno.

---

### 2. **Email al Destinatario**

**Decisión:** Email inmediato cuando se confirma el pago (webhook).

**Contenido del email:**
- "¡Tienes un regalo de [Nombre del Comprador]!"
- Mensaje personalizado (si existe)
- Detalles del regalo
- Si tiene cuenta: Botón para acceder directamente
- Si no tiene cuenta: Token de canje + Botón para crear cuenta y reclamar regalo

---

### 3. **Creación de Acceso para el Destinatario**

**Decisión:** Híbrido con token de canje.

**Flujo:**
1. Webhook confirma pago
2. Generar `giftToken` único (UUID o similar)
3. Buscar usuario por `recipientEmail`
4. **Si existe cuenta:**
   - Crear `courseAccess` inmediatamente
   - Enviar email con acceso directo
5. **Si NO existe cuenta:**
   - Guardar orden con `giftToken`
   - Enviar email con token de canje
   - Al registrarse con ese email, verificar token y crear acceso automáticamente
6. Para talleres: enviar email con instrucciones (no hay "acceso" como en cursos)

---

### 4. **Vista en "Mi Cuenta"**

**Decisión:**

**Para el Comprador:**
- Mostrar en "Historial de Pedidos" únicamente
- Badge "Regalo" en la orden
- Mostrar: "Regalado a: [Nombre/Email del destinatario]"
- NO mostrar acceso al curso (porque no es para él)

**Para el Destinatario:**
- Mostrar en "Mis Cursos" / "Mis Talleres" con badge "Regalo"
- Mostrar: "Regalo de: [Nombre del comprador]"
- NO mostrar en historial de pedidos
- NO mostrar detalles de pago (precio, orden, etc.)

---

### 5. **Múltiples Regalos en una Orden**

**Decisión:** NO - Todos los productos de una orden son regalo o ninguno (simplicidad).

**UI:** En el checkout, checkbox "Comprar como regalo" a nivel de orden completa.

---

### 6. **Terrarios como Regalo**

**Decisión:**
- Los terrarios NO se envían (solo retiro en tienda por el momento)
- Si en el futuro hubiera envío, el comprador selecciona el destino
- Email al destinatario: "Tienes un terrario de regalo, puedes retirarlo en tienda"
- Email al comprador con confirmación

---

### 7. **Talleres como Regalo**

**Decisión:**
- El comprador selecciona la fecha al comprar (igual que compra normal)
- Email al destinatario con: "Tienes un taller de regalo, fecha: [fecha seleccionada]"
- Para simplificar, no hacemos sistema de canjeo de fechas (eso sería más avanzado)

---

### 8. **Validación de Email del Destinatario**

**Decisión:**
- Solo validar formato de email
- NO validar si existe (privacidad)
- Permitir cualquier email válido

---

### 9. **Mensaje Personalizado**

**Decisión:**
- Campo opcional
- Máximo 500 caracteres
- Solo texto plano (sin HTML)

---

### 10. **Cancelación/Reembolso de Regalos**

**Pregunta:** ¿Qué pasa si se cancela un regalo?

**Recomendación:**
- Si el destinatario ya tiene acceso → mantener acceso (ya fue "entregado")
- Si no tiene acceso → revocar y reembolsar
- Notificar a ambos (comprador y destinatario)

---

## 🏗️ Cambios Necesarios en el Código

### 1. **Schema de Sanity (`order.ts`)**
```typescript
// Agregar a nivel de orden (no en items[]):
{
  name: 'isGift',
  title: 'Es Regalo',
  type: 'boolean',
  initialValue: false,
},
{
  name: 'recipientEmail',
  title: 'Email del Destinatario',
  type: 'string',
  hidden: ({ parent }) => !parent?.isGift,
  validation: (Rule) => Rule.custom((value, context) => {
    const isGift = context.parent?.isGift;
    if (isGift && !value) {
      return 'Email del destinatario es requerido para regalos';
    }
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Email inválido';
    }
    return true;
  }),
},
{
  name: 'recipientName',
  title: 'Nombre del Destinatario',
  type: 'string',
  hidden: ({ parent }) => !parent?.isGift,
},
{
  name: 'giftMessage',
  title: 'Mensaje Personalizado',
  type: 'text',
  hidden: ({ parent }) => !parent?.isGift,
  validation: (Rule) => Rule.max(500),
},
{
  name: 'giftToken',
  title: 'Token de Canje',
  type: 'string',
  description: 'Token único para canjeo si el destinatario no tiene cuenta',
  readOnly: true,
},
```

### 2. **API Checkout (`/api/checkout/route.ts`)**
- Agregar validación de `recipientEmail` si `isGift === true`
- Guardar información del regalo en `saveOrderToSanity`

### 3. **Webhook Flow (`/api/webhooks/flow/route.ts`)**
- Al confirmar pago, verificar si hay items con `isGift === true`
- Crear acceso para destinatario (si tiene cuenta) o marcar como pendiente
- Enviar email al destinatario

### 4. **Email Templates (`lib/resend/client.ts`)**
- Crear `sendGiftEmail()` para destinatarios
- Template HTML para "Tienes un regalo"

### 5. **UI Checkout**
- Checkbox "Comprar como regalo" por item
- Formulario para `recipientEmail`, `recipientName`, `giftMessage`
- Validación en frontend

### 6. **Mi Cuenta**
- Filtrar regalos enviados vs recibidos
- Badge "Regalo" en cards
- Ocultar detalles de pago para destinatarios

### 7. **Registro de Usuario**
- Al registrarse, verificar si hay regalos pendientes
- Crear accesos automáticamente

---

## ✅ Checklist de Implementación

- [ ] Actualizar schema de `order` en Sanity
- [ ] Actualizar tipos TypeScript (`CartItem`, `SanityOrder`)
- [ ] Modificar API checkout para aceptar datos de regalo
- [ ] Modificar webhook para crear accesos a destinatarios
- [ ] Crear template de email para destinatarios
- [ ] Crear UI en checkout (checkbox + formulario)
- [ ] Actualizar "Mi Cuenta" para mostrar regalos
- [ ] Actualizar registro para vincular regalos pendientes
- [ ] Testing: comprar regalo, recibir email, crear cuenta, acceder
- [ ] Testing: múltiples regalos en una orden
- [ ] Testing: terrarios y talleres como regalo

---

## 🎯 Próximos Pasos

1. **Revisar este documento y confirmar decisiones**
2. **Aclarar dudas pendientes**
3. **Comenzar implementación por fases:**
   - Fase 1: Schema y tipos
   - Fase 2: API y webhook
   - Fase 3: UI checkout
   - Fase 4: Emails
   - Fase 5: Mi Cuenta

---

## 💡 Notas Adicionales

- **Privacidad:** El destinatario nunca ve precio ni detalles de pago
- **Seguridad:** Validar que el comprador no pueda "hackear" el sistema para darse acceso a sí mismo
- **UX:** Hacer el proceso de regalo simple y claro
- **Testing:** Probar todos los casos edge (email inválido, destinatario ya tiene cuenta, etc.)
