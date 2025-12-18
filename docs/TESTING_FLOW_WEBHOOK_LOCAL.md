# 🧪 Guía: Probar Webhook de Flow desde Localhost

## ❌ Problema

Flow necesita hacer un POST a una URL pública para enviar el webhook. `localhost:3000` no es accesible desde internet, por lo que Flow no puede alcanzar tu servidor local.

**NO puedes usar `NEXT_PUBLIC_SITE_URL=https://comoelmusguito.cl`** porque:
- El webhook llegaría a producción, no a tu localhost
- No podrías ver los logs ni debuggear
- Podrías afectar datos de producción

---

## ✅ Soluciones

### **Opción 1: ngrok (Recomendada para Testing Rápido)** ⭐

**Ventajas:**
- ✅ Gratis
- ✅ Fácil de configurar
- ✅ URL pública temporal
- ✅ Perfecto para testing

**Pasos:**

1. **Instalar ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # O descargar desde: https://ngrok.com/download
   ```

2. **Iniciar tu servidor Next.js:**
   ```bash
   npm run dev
   # Servidor corriendo en http://localhost:3000
   ```

3. **En otra terminal, crear túnel:**
   ```bash
   ngrok http 3000
   ```

4. **Obtener la URL pública:**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

5. **Configurar variable de entorno temporalmente:**
   ```bash
   # En .env.local (solo para esta sesión de testing)
   NEXT_PUBLIC_SITE_URL=https://abc123.ngrok.io
   ```

6. **Reiniciar servidor Next.js** para que tome la nueva variable:
   ```bash
   # Ctrl+C y luego
   npm run dev
   ```

7. **Probar:**
   - Ir a `https://abc123.ngrok.io/checkout`
   - Completar una compra de prueba en Flow Sandbox
   - El webhook llegará a tu localhost a través de ngrok
   - Verás los logs en tu terminal

**⚠️ Nota:** La URL de ngrok cambia cada vez que lo reinicias (a menos que tengas cuenta pro). Para testing, está bien.

---

### **Opción 2: localtunnel (Alternativa Gratis)**

**Ventajas:**
- ✅ Gratis
- ✅ No requiere instalación (usa npx)
- ✅ Similar a ngrok

**Pasos:**

1. **Iniciar túnel:**
   ```bash
   npx localtunnel --port 3000
   ```

2. **Obtener URL:**
   ```
   your url is: https://random-subdomain.loca.lt
   ```

3. **Configurar:**
   ```bash
   # En .env.local
   NEXT_PUBLIC_SITE_URL=https://random-subdomain.loca.lt
   ```

4. **Reiniciar servidor y probar**

---

### **Opción 3: Vercel Preview Deployment (Recomendada para Testing Realista)** ⭐⭐

**Ventajas:**
- ✅ Entorno más similar a producción
- ✅ URL estable (mientras el preview existe)
- ✅ Puedes probar con datos reales de Sanity
- ✅ Gratis en plan Hobby

**Pasos:**

1. **Hacer push a una branch:**
   ```bash
   git checkout -b test/webhook-flow
   git add .
   git commit -m "test: webhook flow"
   git push origin test/webhook-flow
   ```

2. **Vercel crea automáticamente un preview deployment:**
   - URL tipo: `https://comoelmusguito-git-test-webhook-flow.vercel.app`

3. **Configurar Flow Sandbox:**
   - En el panel de Flow Sandbox, usar la URL del preview
   - `https://comoelmusguito-git-test-webhook-flow.vercel.app/api/webhooks/flow`

4. **Probar:**
   - Hacer compra de prueba
   - Ver logs en Vercel Dashboard → Functions → Logs
   - O usar `vercel logs` en terminal

**⚠️ Nota:** El preview se elimina cuando haces merge o borras la branch.

---

### **Opción 4: Usar Flow Sandbox con URL de Producción (Solo para Verificar que Funciona)**

**Cuándo usar:**
- Solo para verificar que el webhook funciona end-to-end
- NO para debuggear código

**Pasos:**

1. **Deploy a producción** (o usar la URL actual si ya está deployada)

2. **En Flow Sandbox, configurar:**
   - URL de confirmación: `https://comoelmusguito.cl/api/webhooks/flow`

3. **Hacer compra de prueba**

4. **Verificar:**
   - Revisar logs en Vercel Dashboard
   - Verificar que el email se envió
   - Verificar que la orden se actualizó en Sanity

**⚠️ Limitación:** No puedes debuggear código localmente con esta opción.

---

## 🔧 Configuración Recomendada para Testing Local

### Setup con ngrok:

1. **Crear script helper:**
   ```bash
   # scripts/test-webhook-local.sh
   #!/bin/bash
   
   echo "🚀 Iniciando ngrok para testing de webhook..."
   echo ""
   echo "1. Asegúrate de que tu servidor Next.js esté corriendo en localhost:3000"
   echo "2. Copia la URL 'Forwarding' que ngrok te da"
   echo "3. Actualiza NEXT_PUBLIC_SITE_URL en .env.local con esa URL"
   echo "4. Reinicia tu servidor Next.js"
   echo ""
   echo "Presiona Enter cuando estés listo..."
   read
   
   ngrok http 3000
   ```

2. **Hacer ejecutable:**
   ```bash
   chmod +x scripts/test-webhook-local.sh
   ```

3. **Usar:**
   ```bash
   ./scripts/test-webhook-local.sh
   ```

### Variables de entorno para testing:

```bash
# .env.local (para testing local con ngrok)
NEXT_PUBLIC_SITE_URL=https://abc123.ngrok.io  # Cambiar por tu URL de ngrok
FLOW_ENV=sandbox
FLOW_API_KEY=tu_sandbox_api_key
FLOW_SECRET_KEY=tu_sandbox_secret_key
```

---

## 📋 Checklist de Testing

### Antes de Probar:

- [ ] Servidor Next.js corriendo en `localhost:3000`
- [ ] ngrok (o túnel) activo y URL pública obtenida
- [ ] `NEXT_PUBLIC_SITE_URL` configurado con URL del túnel
- [ ] Servidor Next.js reiniciado (para tomar nueva variable)
- [ ] Flow Sandbox configurado con la URL del túnel
- [ ] Variables de entorno de Flow Sandbox configuradas

### Durante la Prueba:

1. **Ir a checkout:**
   ```
   https://tu-ngrok-url.ngrok.io/checkout
   ```

2. **Completar formulario y crear orden**

3. **En Flow Sandbox, completar el pago de prueba**

4. **Verificar:**
   - [ ] Webhook recibido (ver logs en terminal)
   - [ ] Email enviado al cliente
   - [ ] Orden actualizada en Sanity
   - [ ] Stock descontado (si aplica)
   - [ ] Acceso a curso creado (si aplica)

### Verificar Logs:

**En terminal de Next.js:**
```bash
# Verás logs como:
🔒 Verificando reCAPTCHA en backend...
✅ Resultado verificación reCAPTCHA: true
[Webhook] Actualizando orden ORD-xxx de estado 1 a 2
✅ Email marcado como enviado para orden ORD-xxx
```

**En ngrok dashboard (si tienes cuenta):**
- Ver requests entrantes
- Ver respuestas
- Debuggear problemas de red

---

## 🐛 Troubleshooting

### Problema: "Webhook no llega"

**Causas posibles:**
1. URL de ngrok incorrecta en `NEXT_PUBLIC_SITE_URL`
2. Servidor Next.js no reiniciado después de cambiar variable
3. ngrok desconectado
4. Firewall bloqueando ngrok

**Solución:**
```bash
# 1. Verificar que ngrok está activo
curl https://abc123.ngrok.io/api/webhooks/flow

# 2. Verificar variable de entorno
echo $NEXT_PUBLIC_SITE_URL  # Debe mostrar la URL de ngrok

# 3. Reiniciar servidor Next.js
```

### Problema: "Webhook llega pero da error 401"

**Causa:** Firma de webhook inválida

**Solución:**
- Verificar que `FLOW_SECRET_KEY` es la correcta del Sandbox
- Verificar que Flow está enviando la firma (`s` parameter)

### Problema: "Email no se envía"

**Causas posibles:**
1. `RESEND_API_KEY` no configurada
2. Email ya fue enviado (verificar `emailSent` en Sanity)
3. Error en Resend

**Solución:**
```bash
# Verificar logs del webhook
# Buscar: "Email marcado como enviado" o errores de Resend
```

---

## 📝 Notas Importantes

1. **URLs temporales:** Las URLs de ngrok/localtunnel cambian. Actualiza `NEXT_PUBLIC_SITE_URL` cada vez.

2. **No usar en producción:** Nunca uses URLs de túnel en producción. Solo para testing local.

3. **Limpiar después:** Después de testing, restaura `NEXT_PUBLIC_SITE_URL` a la URL de producción.

4. **Flow Sandbox:** Asegúrate de estar usando las credenciales de **Sandbox**, no producción.

5. **Variables de entorno:** Usa `.env.local` para testing local, no modifiques `.env` de producción.

---

## 🎯 Flujo Completo de Testing

```bash
# Terminal 1: Servidor Next.js
npm run dev

# Terminal 2: ngrok
ngrok http 3000
# Copiar URL: https://abc123.ngrok.io

# Terminal 3: Actualizar .env.local
echo "NEXT_PUBLIC_SITE_URL=https://abc123.ngrok.io" >> .env.local

# Terminal 1: Reiniciar servidor
# Ctrl+C y luego npm run dev

# Navegador: Ir a https://abc123.ngrok.io/checkout
# Completar compra de prueba
# Verificar webhook en logs
```

---

**Última actualización:** 2025-01-XX
