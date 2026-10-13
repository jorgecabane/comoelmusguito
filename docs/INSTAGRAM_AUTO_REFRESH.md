# 🤖 Refresh Automático de Token de Instagram

Esta guía explica cómo configurar el refresh automático del token de Instagram usando cron jobs de Vercel y la API de Vercel para actualizar variables de entorno.

---

## 🎯 ¿Qué hace esto?

1. **Cron job de Vercel** se ejecuta cada 50 días
2. **Refresca el token** de Instagram automáticamente
3. **Actualiza la variable de entorno** en Vercel usando la API
4. **Sin intervención manual** - todo es automático

---

## 📋 Configuración Requerida

### Paso 1: Obtener Token de API de Vercel

1. **Ve a Vercel Account Settings**
   - [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Inicia sesión

2. **Crear nuevo token**
   - Haz clic en "Create Token"
   - Nombre: "Instagram Auto Refresh"
   - Scope: "Full Account" (o al menos acceso a proyectos)
   - Copia el token (solo se muestra una vez)

3. **Agregar a variables de entorno**
   ```env
   VERCEL_TOKEN=tu_token_aqui
   ```

### Paso 2: Obtener Project ID

1. **Ve a tu proyecto en Vercel**
   - Settings → General
   - Busca "Project ID"
   - Copia el ID

2. **Agregar a variables de entorno**
   ```env
   VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx
   ```

### Paso 3: Obtener Team ID (Opcional)

Solo si tu proyecto está en un team de Vercel:

1. **Ve a Team Settings**
   - Settings → General
   - Busca "Team ID"
   - Copia el ID

2. **Agregar a variables de entorno**
   ```env
   VERCEL_TEAM_ID=team_xxxxxxxxxxxxx
   ```

Si es un proyecto personal (no team), puedes omitir esta variable.

### Paso 4: Generar CRON_SECRET

Este secret protege el endpoint del cron para que solo Vercel pueda llamarlo:

```bash
# Generar secret aleatorio
openssl rand -base64 32
```

O usando Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Agregar a variables de entorno:**
```env
CRON_SECRET=tu_secret_generado_aqui
```

### Paso 5: Actualizar vercel.json

El archivo `vercel.json` ya está configurado y **no lleva el secret**. Cuando `CRON_SECRET` está definido en el proyecto, Vercel Cron envía automáticamente `Authorization: Bearer <CRON_SECRET>`:

```json
{
  "crons": [
    {
      "path": "/api/instagram/refresh-auto",
      "schedule": "0 0 */50 * *"
    }
  ]
}
```

**⚠️ IMPORTANTE:** Nunca pongas el secret en `vercel.json` (queda en git).

**Nota sobre el schedule:**
- `0 0 */50 * *` = Cada 50 días a medianoche
- Formato: `minuto hora día mes día-semana`
- `*/50` en el campo de día significa "cada 50 días"

---

## 🔧 Variables de Entorno Completas

Agrega todas estas variables en Vercel (Settings → Environment Variables):

```env
# Instagram
INSTAGRAM_APP_ID=tu_app_id
INSTAGRAM_APP_SECRET=tu_app_secret
INSTAGRAM_ACCESS_TOKEN=tu_token_inicial

# Vercel API
VERCEL_TOKEN=tu_vercel_api_token
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx
VERCEL_TEAM_ID=team_xxxxxxxxxxxxx  # Opcional

# Cron Secret
CRON_SECRET=tu_secret_generado
```

**Aplicar a:** Production, Preview, Development (o solo Production si prefieres)

---

## ✅ Verificación

### 1. Probar el Endpoint Manualmente

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://comoelmusguito.cl/api/instagram/refresh-auto
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Token refrescado y actualizado en Vercel exitosamente",
  "token": "nuevo_token_aqui",
  "expiresInDays": 60,
  "expiresAt": "2024-03-15T00:00:00.000Z"
}
```

### 2. Verificar en Vercel

Después de ejecutar el endpoint:
1. Ve a Settings → Environment Variables
2. Verifica que `INSTAGRAM_ACCESS_TOKEN` tenga el nuevo valor
3. El nuevo token estará disponible en el próximo deploy

### 3. Monitorear Logs

En Vercel → Deployments → Function Logs, deberías ver:
```
🔄 Iniciando refresh automático de token de Instagram...
✅ Token de Instagram refrescado exitosamente
📝 Actualizando variable de entorno en Vercel...
✅ Variable de entorno actualizada en Vercel
```

---

## 🕐 Schedule del Cron

El cron está configurado para ejecutarse **el día 1 de cada mes**:
- **Formato:** `0 0 1 * *`
- **Significado:** Día 1 de cada mes a las 00:00 UTC
- **Frecuencia:** Mensual (más que suficiente, el token dura 60 días)

**¿Por qué mensual y no cada 50 días?**
- Vercel no soporta intervalos de días mayores a 31 en el formato cron estándar
- El token de Instagram dura 60 días, así que ejecutarlo mensualmente es seguro
- Es más simple y confiable que intentar hacerlo cada 50 días exactos

**Alternativa si necesitas cada 50 días exactos:**
Puedes usar un servicio externo que sí soporte intervalos personalizados:
- [cron-job.org](https://cron-job.org/) - Gratis, soporta intervalos personalizados
- [EasyCron](https://www.easycron.com/) - Freemium
- [GitHub Actions](https://github.com/features/actions) - Gratis para repos públicos

---

## 🔒 Seguridad

### Protección del Endpoint

El endpoint está protegido por `CRON_SECRET`:
- Solo Vercel (o quien tenga el secret) puede llamarlo
- Sin el secret, retorna 401 Unauthorized
- **Nunca** compartas el `CRON_SECRET` públicamente

### Variables de Entorno

- `VERCEL_TOKEN` tiene acceso completo a tu cuenta de Vercel
- Mantén este token seguro
- Si se compromete, revócalo inmediatamente en Vercel

---

## 🐛 Troubleshooting

### Error: "VERCEL_TOKEN o VERCEL_PROJECT_ID no configurados"

**Solución:**
- Verifica que las variables estén configuradas en Vercel
- Asegúrate de que estén aplicadas al entorno correcto (Production)

### Error: "No autorizado. Secret inválido"

**Solución:**
- Verifica que `CRON_SECRET` esté definido en Vercel (Production) y redeploya
- Si llamas a mano, envía el header `Authorization: Bearer <CRON_SECRET>`

### Error: "No se pudo refrescar el token"

**Solución:**
- El token puede haber expirado completamente (más de 60 días)
- Obtén un nuevo token manualmente: `npm run script:instagram-auth`
- Actualiza `INSTAGRAM_ACCESS_TOKEN` en Vercel

### El cron no se ejecuta

**Solución:**
- Verifica que `vercel.json` esté en la raíz del proyecto
- Asegúrate de que el proyecto esté deployado en Vercel
- Revisa los logs de Vercel para ver si hay errores
- Considera usar un servicio externo de cron si Vercel no es confiable

---

## 📊 Flujo Completo

```
Cron Job (cada 50 días)
    ↓
GET /api/instagram/refresh-auto  (Authorization: Bearer <CRON_SECRET>)
    ↓
Validar header
    ↓
Refrescar token de Instagram
    ↓
Actualizar variable en Vercel (API)
    ↓
✅ Token actualizado automáticamente
```

---

## 💡 Tips

1. **Monitorear logs** - Revisa periódicamente los logs de Vercel para verificar que el cron se ejecute
2. **Backup manual** - Guarda el token en un password manager por si acaso
3. **Alertas** - Configura alertas en Vercel para errores del cron
4. **Testing** - Prueba el endpoint manualmente antes de confiar en el cron

---

## 📚 Referencias

- [Vercel Cron Jobs Docs](https://vercel.com/docs/cron-jobs)
- [Vercel API Docs](https://vercel.com/docs/rest-api)
- [Vercel Environment Variables API](https://vercel.com/docs/rest-api#endpoints/environment-variables)

