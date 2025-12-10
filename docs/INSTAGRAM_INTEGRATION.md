# 📸 Guía de Integración con Instagram

Esta guía explica cómo integrar Instagram para mostrar las últimas fotos en tu sitio web.

---

## 🎯 Objetivo

Mostrar las últimas 8 fotos de Instagram en la sección "Una Comunidad de 40,000+ Personas" del home.

---

## 📋 Opciones de API de Instagram

### Opción 1: Instagram Basic Display API (Recomendada para cuentas personales)

**Ventajas:**
- ✅ Gratis
- ✅ Funciona con cuentas personales
- ✅ Fácil de configurar
- ✅ Perfecto para mostrar fotos públicas

**Limitaciones:**
- ⚠️ Solo muestra fotos de tu propia cuenta
- ⚠️ Requiere autenticación manual inicial
- ⚠️ Token expira cada 60 días (necesita renovación)

### Opción 2: Instagram Graph API (Para cuentas de negocio)

**Ventajas:**
- ✅ Más funciones avanzadas
- ✅ Tokens de larga duración
- ✅ Mejor para cuentas de negocio/creador

**Limitaciones:**
- ⚠️ Requiere cuenta de Instagram Business o Creator
- ⚠️ Requiere Facebook Page conectada
- ⚠️ Configuración más compleja

---

## 🚀 Configuración: Instagram Basic Display API

### Paso 1: Crear App en Facebook Developers

1. **Accede a Facebook Developers**
   - Ve a [developers.facebook.com](https://developers.facebook.com)
   - Inicia sesión con tu cuenta de Facebook

2. **Crear una App**
   - Haz clic en "Mis Apps" → "Crear App"
   - Selecciona "Consumidor" como tipo de app
   - Completa el formulario:
     - **Nombre de la app**: "comoelmusguito"
     - **Email de contacto**: tu email
     - **Propósito de la app**: "Mostrar fotos de Instagram en mi sitio web"

3. **Agregar Producto "Instagram Basic Display"**
   - En el dashboard de tu app, busca "Instagram Basic Display"
   - Haz clic en "Configurar"
   - Sigue las instrucciones

### Paso 2: Configurar OAuth Redirect URIs

1. **Ve a Configuración → Básico**
   - Busca "Dominios de la app"
   - Agrega tus dominios:
     ```
     localhost:3000
     comoelmusguito.vercel.app
     comoelmusguito.cl
     ```

2. **Ve a Productos → Instagram Basic Display → Configuración**
   - En "Valid OAuth Redirect URIs", agrega:
     ```
     http://localhost:3000/api/instagram/callback
     https://comoelmusguito.vercel.app/api/instagram/callback
     https://comoelmusguito.cl/api/instagram/callback
     ```
   - **Nota:** El redirect URI se construye automáticamente como `NEXT_PUBLIC_SITE_URL + '/api/instagram/callback'`
   - Asegúrate de que `NEXT_PUBLIC_SITE_URL` esté configurada correctamente

### Paso 3: Obtener Credenciales

1. **App ID y App Secret**
   - Ve a Configuración → Básico
   - Copia el **App ID**
   - Copia el **App Secret** (haz clic en "Mostrar" para verlo)

2. **Agregar a variables de entorno**
   ```env
   INSTAGRAM_APP_ID=tu_app_id
   INSTAGRAM_APP_SECRET=tu_app_secret
   ```

### Paso 4: Obtener Access Token (Una vez)

El proceso es automático gracias al endpoint `/api/instagram/callback` que ya está implementado.

1. **Generar URL de autorización**
   ```bash
   npm run script:instagram-auth
   ```
   Esto te dará una URL como:
   ```
   https://api.instagram.com/oauth/authorize?client_id=XXX&redirect_uri=XXX&scope=user_profile,user_media&response_type=code
   ```

2. **Autorizar la app**
   - Copia la URL del paso anterior
   - Ábrela en tu navegador
   - Inicia sesión con tu cuenta de Instagram
   - Autoriza el acceso

3. **Obtener el token automáticamente**
   - Después de autorizar, Instagram te redirigirá a `/api/instagram/callback?code=XXX`
   - El endpoint `/api/instagram/callback` automáticamente:
     1. ✅ Intercambia el código por un token corto (1 hora)
     2. ✅ Intercambia el token corto por un **long-lived token (60 días)**
     3. ✅ Te retorna el long-lived token en la respuesta JSON
   
   **No necesitas hacer nada manual** - el intercambio es automático.

4. **Guardar el token**
   - Copia el `token` de la respuesta JSON
   - Agrégalo a tus variables de entorno como `INSTAGRAM_ACCESS_TOKEN`
   - El token que recibes **ya es un long-lived token** (dura 60 días)

---

## 💻 Implementación

### Flujo Completo del Token

El endpoint `/api/instagram/callback` maneja todo el proceso automáticamente:

```typescript
// 1. Recibe código de autorización de Instagram
GET /api/instagram/callback?code=XXX

// 2. Intercambia código por token corto (1 hora)
POST https://api.instagram.com/oauth/access_token
  → Obtiene: shortLivedToken (expira en 1 hora)

// 3. Intercambia token corto por long-lived token (60 días)
GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&...
  → Obtiene: longLivedToken (expira en 60 días)

// 4. Retorna el long-lived token en la respuesta JSON
```

**Todo esto sucede automáticamente** - no necesitas hacer llamadas manuales a la API.

### Componentes Implementados

1. **API Route para Obtener Fotos**
   - `app/api/instagram/feed/route.ts` - Obtiene las últimas fotos

2. **Componente para Mostrar Fotos**
   - `components/social/InstagramFeed.tsx` - Muestra el feed en el frontend

3. **CommunitySection Actualizado**
   - Ya usa el componente `InstagramFeed` real

---

## 🔄 Renovación del Token

El token de Instagram Basic Display expira cada 60 días. Puedes renovarlo **sin autorización manual del usuario** siempre que no haya expirado completamente.

### 🤖 Refresh Automático (Recomendado) ⭐

**Configuración automática con cron job de Vercel:**
- ✅ Se ejecuta cada 50 días automáticamente
- ✅ Refresca el token sin intervención
- ✅ Actualiza la variable de entorno en Vercel usando la API
- ✅ Sin recordatorios manuales

**Ver guía completa:** `docs/INSTAGRAM_AUTO_REFRESH.md`  
**Setup rápido:** `docs/INSTAGRAM_AUTO_REFRESH_SETUP.md`

### 🔧 Endpoints Disponibles

#### 1. Feed de Instagram
```
GET /api/instagram/feed?limit=8
```
- Obtiene las últimas fotos de Instagram
- Si el token expira, retorna error 401 con instrucciones para renovarlo

#### 2. Refresh Manual del Token
```
GET /api/instagram/refresh
```
- Refresca el token manualmente (sin autorización del usuario)
- Útil para renovar el token antes de que expire
- Retorna el nuevo token para que lo actualices en Vercel

#### 3. Refresh Automático (Cron)
```
GET /api/instagram/refresh-auto?secret=xxx
```
- Endpoint protegido para el cron job de Vercel
- Refresca el token y actualiza automáticamente en Vercel
- No debe llamarse manualmente (usa el endpoint de refresh manual)

### 📝 Proceso de Renovación

#### Paso 1: Refrescar el Token

**Opción A: Si el token aún no expiró completamente**
```bash
# Llamar al endpoint de refresh
curl https://comoelmusguito.cl/api/instagram/refresh
```
Copia el `token` de la respuesta JSON.

**Opción B: Si el token expiró completamente**
```bash
# Obtener nuevo token con autorización
npm run script:instagram-auth
```
Sigue el proceso de autorización y copia el token.

#### Paso 2: Actualizar en Vercel

Tienes 3 opciones (ver `docs/VERCEL_ENV_VARIABLES.md` para detalles):

1. **Dashboard de Vercel** (Más fácil) ⭐
   - Settings → Environment Variables
   - Edita `INSTAGRAM_ACCESS_TOKEN`
   - Guarda y redesplega

2. **Vercel CLI**
   ```bash
   vercel env rm INSTAGRAM_ACCESS_TOKEN
   vercel env add INSTAGRAM_ACCESS_TOKEN
   vercel --prod
   ```

3. **API de Vercel** (Avanzado, para automatización)

#### Paso 3: Redesplegar

Después de actualizar la variable, necesitas hacer un nuevo deploy:
- Dashboard: Haz clic en "Redeploy"
- CLI: `vercel --prod`
- Git: Haz push (si tienes auto-deploy)

### ⏰ ¿Cuándo Renovar?

- **Cada 50-55 días** (preventivo, antes de que expire)
- **Cuando veas error 401** en el feed
- **Monitorear logs** periódicamente

### ⚠️ Token Completamente Expirado

Si el token expira completamente (más de 60 días sin renovar):
- ❌ No puede ser refrescado con `/api/instagram/refresh`
- ✅ Necesitas autorización manual nuevamente
- 📝 Sigue el proceso inicial: `npm run script:instagram-auth`

---

## 📝 Variables de Entorno Necesarias

```env
# Instagram Basic Display API
INSTAGRAM_APP_ID=tu_app_id
INSTAGRAM_APP_SECRET=tu_app_secret
INSTAGRAM_ACCESS_TOKEN=tu_long_lived_token

# Nota: INSTAGRAM_REDIRECT_URI se construye automáticamente usando:
# NEXT_PUBLIC_SITE_URL + '/api/instagram/callback'
# Asegúrate de tener NEXT_PUBLIC_SITE_URL configurada (ya deberías tenerla)
```
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
grep

---

## 🆘 Alternativa: Usar Servicio de Terceros

Si la configuración de Instagram API es muy compleja, puedes usar servicios como:

- **Instafeed.js** - Librería simple (requiere token)
- **Elfsight Instagram Feed** - Widget gratuito (con marca de agua)
- **SnapWidget** - Widget gratuito (con marca de agua)

**Recomendación**: Usar Instagram Basic Display API directamente para control total y sin marca de agua.

---

## ✅ Checklist de Configuración

- [ ] Crear app en Facebook Developers
- [ ] Agregar producto "Instagram Basic Display"
- [ ] Configurar OAuth Redirect URIs
- [ ] Obtener App ID y App Secret
- [ ] Autorizar la app con tu cuenta de Instagram
- [ ] Obtener access token inicial
- [ ] Intercambiar por long-lived token (60 días)
- [ ] Agregar variables de entorno
- [ ] Implementar API route para obtener fotos
- [ ] Crear componente InstagramFeed
- [ ] Integrar en CommunitySection
- [ ] Probar en localhost
- [ ] Probar en producción

---

## 📚 Referencias

- [Instagram Basic Display API Docs](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Facebook Developers Console](https://developers.facebook.com/)
- [OAuth Flow Guide](https://developers.facebook.com/docs/instagram-basic-display-api/overview)

