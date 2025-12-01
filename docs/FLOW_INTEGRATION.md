# Integración con Flow.cl

## 📋 Resumen

Flow.cl es el procesador de pagos utilizado para procesar todas las transacciones. Esta integración maneja:

- ✅ Creación de órdenes de pago
- ✅ Redirección a Flow para procesar el pago
- ✅ Callback después del pago
- ✅ Consulta de estado de pagos
- ✅ Conversión automática de USD a CLP (Flow solo procesa en CLP)

## 🔑 Configuración

### Variables de Entorno

Agregar a `.env.local`:

```env
FLOW_API_KEY=tu_api_key
FLOW_SECRET_KEY=tu_secret_key
FLOW_ENV=sandbox  # 'sandbox' para pruebas, 'production' para producción
```

### Obtener Credenciales

1. **Sandbox (Pruebas):**
   - URL: https://sandbox.flow.cl/app/web/misDatos.php
   - Usar estas credenciales para desarrollo

2. **Producción:**
   - URL: https://www.flow.cl/app/web/misDatos.php
   - Usar estas credenciales en producción

## 🔄 Flujo de Pago

### 1. Usuario hace clic en "Proceder al Pago"

El usuario está en `/carrito` y hace clic en el botón que redirige a `/checkout`.

### 2. Página de Checkout (`/checkout`)

- Usuario completa formulario (email, nombre opcional)
- Al enviar, se llama a `/api/checkout` (POST)
- La API:
  - Calcula totales (convierte USD a CLP si es necesario)
  - Genera `commerceOrder` único
  - Crea orden en Flow usando `createPaymentOrder()`
  - Retorna `paymentUrl` y `token`

### 3. Redirección a Flow

- El frontend redirige al usuario a `paymentUrl` (Flow)
- Usuario completa el pago en Flow

### 4. Callback de Flow (`/checkout/callback`)

Flow redirige de vuelta a:
```
/checkout/callback?token=XXXXX&order=ORD-XXXXX
```

La página de callback:
- Recibe el `token` o `order` de Flow
- Llama a `/api/checkout/status` para consultar el estado
- Muestra resultado al usuario:
  - ✅ **Éxito** (status = 2): Pago confirmado
  - ❌ **Error** (status = 3): Pago rechazado
  - ⏳ **Pendiente** (status = 1): En proceso
  - ❌ **Anulado** (status = 4): Pago anulado

## 📡 API Routes

### `POST /api/checkout`

Crea una orden de pago en Flow.

**Request:**
```json
{
  "items": [
    {
      "id": "product-id",
      "type": "terrarium" | "course" | "workshop",
      "name": "Nombre del producto",
      "price": 50000,
      "currency": "CLP" | "USD",
      "quantity": 1
    }
  ],
  "email": "cliente@email.com",
  "customerName": "Juan Pérez" // opcional
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://www.flow.cl/pagar/...",
  "token": "token-de-flow",
  "flowOrder": "12345",
  "commerceOrder": "ORD-1234567890-abc123"
}
```

### `POST /api/checkout/status`

Consulta el estado de un pago.

**Request:**
```json
{
  "token": "token-de-flow", // o
  "orderId": "ORD-1234567890-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "paymentStatus": 2, // 1=Pendiente, 2=Pagado, 3=Rechazado, 4=Anulado
  "amount": 50000,
  "currency": "CLP",
  "commerceOrder": "ORD-1234567890-abc123",
  "flowOrder": "12345",
  "paymentDate": "2024-01-15 10:30:00",
  "payer": "cliente@email.com"
}
```

## 🔐 Seguridad

### Firma de Requests

Todos los requests a Flow deben estar firmados con `SecretKey`:

1. Ordenar parámetros alfabéticamente (excepto `s`)
2. Concatenar: `nombre=valor&nombre2=valor2`
3. Firmar con SHA256: `SHA256(concatenated + secretKey)`
4. Agregar firma como parámetro `s`

La función `signFlowRequest()` en `lib/flow/utils.ts` maneja esto automáticamente.

## 💱 Conversión de Monedas

### Reglas

1. **Flow solo procesa en CLP** - Todos los pagos se convierten a CLP antes de enviar a Flow
2. **Usuario en Chile (CL):**
   - Items en CLP → usar directamente
   - Items en USD → convertir a CLP usando tasa de cambio
3. **Usuario fuera de Chile:**
   - Items en CLP → usar directamente
   - Items en USD → convertir a CLP usando tasa de cambio
   - **Nota:** El usuario ve el precio en USD en la UI, pero el pago se procesa en CLP

### Tasa de Cambio

- API: `https://api.exchangerate-api.com/v4/latest/USD`
- Cache: 1 hora
- Fallback: 950 CLP = 1 USD (si la API falla)

## 🧪 Testing

### Sandbox

1. Configurar `FLOW_ENV=sandbox` en `.env.local`
2. Usar credenciales de sandbox
3. Probar flujo completo:
   - Agregar productos al carrito
   - Ir a checkout
   - Completar formulario
   - Ser redirigido a Flow sandbox
   - Completar pago de prueba
   - Verificar callback

### Tarjetas de Prueba

Flow sandbox proporciona tarjetas de prueba. Consultar documentación de Flow para números de tarjeta válidos.

## 📝 Notas Importantes

1. **IDs de Orden Únicos:** Cada orden debe tener un `commerceOrder` único. Usamos: `ORD-{timestamp}-{random}`

2. **URLs de Retorno:** 
   - `urlReturn`: Página a la que Flow redirige después del pago
   - `urlConfirmation`: Webhook para confirmación automática (futuro)

3. **Estados de Pago:**
   - `1` = Pendiente
   - `2` = Pagado ✅
   - `3` = Rechazado ❌
   - `4` = Anulado ❌

4. **Métodos de Pago:** 
   - `paymentMethod: 9` = Todos los métodos disponibles
   - Ver documentación de Flow para otros códigos

## 🔗 Referencias

- [Documentación Flow API](https://developers.flow.cl/api)
- [Panel Sandbox](https://sandbox.flow.cl/app/web/misDatos.php)
- [Panel Producción](https://www.flow.cl/app/web/misDatos.php)

