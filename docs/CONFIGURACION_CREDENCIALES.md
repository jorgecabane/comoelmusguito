# 🔐 Guía de Configuración de Credenciales

Esta guía te explica cómo obtener las credenciales necesarias para las funcionalidades de seguridad y autenticación.

---

## 1. Google OAuth (SSO) 🔵

### ¿Qué necesitas?
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (mismo valor que GOOGLE_CLIENT_ID)

### Pasos para obtenerlas:

1. **Ir a Google Cloud Console**
   - Visita: https://console.cloud.google.com/
   - Inicia sesión con tu cuenta de Google
   - ⚠️ **Recomendación**: Usa la cuenta oficial del negocio (ej: `hola@comoelmusguito.cl`) si es posible
   - Si no tienes cuenta del negocio, cualquier cuenta de Google funciona, pero considera:
     - El nombre de la app aparecerá en la pantalla de consentimiento de Google
     - Si la persona que creó las credenciales deja el equipo, puede ser difícil recuperar acceso

2. **Crear o seleccionar proyecto**
   - Si no tienes proyecto, crea uno nuevo
   - O selecciona un proyecto existente

3. **Habilitar Google+ API**
   - Ve a "APIs & Services" > "Library"
   - Busca "Google+ API" o "Google Identity"
   - Haz clic en "Enable"

4. **Crear credenciales OAuth 2.0**
   - Ve a "APIs & Services" > "Credentials"
   - Haz clic en "Create Credentials" > "OAuth client ID"
   - Si es la primera vez, configura la pantalla de consentimiento:
     - Tipo: "External" (o "Internal" si es solo para tu organización)
     - Nombre de la app: "comoelmusguito"
     - Email de soporte: tu email
     - Guarda y continúa

5. **Configurar OAuth Client**
   - Tipo de aplicación: "Web application"
   - Nombre: "comoelmusguito Web"
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     https://comoelmusguito.cl
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:3000/api/auth/callback/google
     https://comoelmusguito.cl/api/auth/callback/google
     ```
   - Haz clic en "Create"

6. **Copiar credenciales**
   - Se mostrará un popup con:
     - **Client ID** → `GOOGLE_CLIENT_ID` y `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
     - **Client Secret** → `GOOGLE_CLIENT_SECRET`
   - ⚠️ **IMPORTANTE**: Guarda el Client Secret de forma segura, solo se muestra una vez

7. **Agregar a variables de entorno**
   ```env
   GOOGLE_CLIENT_ID=tu_client_id_aqui
   GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_client_id_aqui
   ```

### ✅ Verificación
- Una vez configurado, el botón "Continuar con Google" aparecerá en las páginas de login y registro
- Al hacer clic, deberías ser redirigido a Google para autenticarte

---

## 2. reCAPTCHA v3 🛡️

### ¿Qué necesitas?
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- `RECAPTCHA_SECRET_KEY`

### Pasos para obtenerlas:

1. **Ir a Google reCAPTCHA**
   - Visita: https://www.google.com/recaptcha/admin/create
   - Inicia sesión con tu cuenta de Google
   - ⚠️ **Recomendación**: Usa la cuenta oficial del negocio (ej: `hola@comoelmusguito.cl`) si es posible
   - Cualquier cuenta de Google funciona, pero es mejor usar la del negocio para gestión centralizada

2. **Registrar nuevo sitio**
   - **Etiqueta**: "comoelmusguito"
   - **Tipo de reCAPTCHA**: Selecciona **"reCAPTCHA v3"**
   - **Dominios**: Agrega:
     ```
     localhost
     comoelmusguito.cl
     ```
   - Acepta los términos de servicio
   - Haz clic en "Submit"

3. **Copiar credenciales**
   - Se mostrarán dos claves:
     - **Site Key** → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
     - **Secret Key** → `RECAPTCHA_SECRET_KEY`
   - ⚠️ **IMPORTANTE**: Guarda el Secret Key de forma segura

4. **Agregar a variables de entorno**
   ```env
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_site_key_aqui
   RECAPTCHA_SECRET_KEY=tu_secret_key_aqui
   ```

### ✅ Verificación
- El CAPTCHA funciona de forma invisible (v3)
- Se ejecuta automáticamente al enviar el formulario de registro
- Si no está configurado, el registro funcionará sin CAPTCHA (modo desarrollo)

### 💰 Costo
- **Gratis** hasta 1 millón de verificaciones/mes
- Después: $1 por cada 1,000 verificaciones adicionales

---

## 3. Resend (Email) 📧

### ¿Qué necesitas?
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

### Pasos para obtenerlas:

1. **Crear cuenta en Resend**
   - Visita: https://resend.com/
   - Crea una cuenta gratuita

2. **Verificar dominio (opcional pero recomendado)**
   - Ve a "Domains" en el dashboard
   - Agrega tu dominio `comoelmusguito.cl`
   - Sigue las instrucciones para verificar DNS

3. **Crear API Key**
   - Ve a "API Keys"
   - Haz clic en "Create API Key"
   - Nombre: "comoelmusguito-production"
   - Permisos: "Sending access"
   - Copia la API Key (solo se muestra una vez)

4. **Agregar a variables de entorno**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@comoelmusguito.cl
   ```

### ✅ Verificación
- Los emails de verificación se enviarán automáticamente al registrar
- Revisa los logs del servidor para confirmar envío

### 💰 Costo
- **Gratis** hasta 3,000 emails/mes
- Después: $20/mes por 50,000 emails

### 🔧 Desactivar Verificación de Email (Desarrollo)
Si no tienes el dominio configurado en Resend o quieres probar sin emails:

```env
REQUIRE_EMAIL_VERIFICATION=false
```

**Comportamiento:**
- `true` (default): Usuario debe verificar email antes de hacer login
- `false`: Usuario puede hacer login inmediatamente después de registrarse

**⚠️ Importante:** En producción, siempre usa `REQUIRE_EMAIL_VERIFICATION=true` para seguridad.

---

## 📝 Resumen de Variables de Entorno

Agrega todas estas variables a tu archivo `.env.local`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_client_id_aqui

# reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_site_key_aqui
RECAPTCHA_SECRET_KEY=tu_secret_key_aqui

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@comoelmusguito.cl

# Verificación de Email (true = requerir verificación, false = permitir login inmediato)
REQUIRE_EMAIL_VERIFICATION=true  # false para desarrollo/testing

# NextAuth
NEXTAUTH_SECRET=tu_secret_aqui
NEXTAUTH_URL=http://localhost:3000  # En producción: https://comoelmusguito.cl
```

---

## 🚀 Orden de Implementación Recomendado

1. **Google OAuth** (⭐ Más fácil, ya está en el código)
   - Solo necesitas las credenciales
   - Funciona inmediatamente

2. **reCAPTCHA** (⭐⭐ Fácil-Medio)
   - Protege contra bots
   - Funciona de forma invisible

3. **Email Verification** (⭐⭐⭐ Medio)
   - Ya está implementado
   - Solo necesitas Resend configurado

---

## ❓ Preguntas Frecuentes

### ¿Necesito usar una cuenta de Google específica?
**Respuesta corta**: No, cualquier cuenta de Google funciona, pero es mejor usar la cuenta del negocio.

**Detalles**:
- **Google OAuth y reCAPTCHA**: Puedes usar cualquier cuenta de Google
- **Recomendación**: Usa `hola@comoelmusguito.cl` (o la cuenta oficial del negocio) porque:
  - Es más profesional y fácil de gestionar
  - Si alguien deja el equipo, no pierdes acceso a las credenciales
  - El nombre de la app en la pantalla de consentimiento será más consistente
  - Mejor para auditoría y seguridad
- **Resend**: Aquí sí importa más el dominio verificado (debe ser `comoelmusguito.cl`), pero la cuenta puede ser diferente

### ¿Puedo usar solo algunas funcionalidades?
Sí, todas son opcionales:
- Sin Google OAuth: El botón simplemente no aparecerá
- Sin reCAPTCHA: El registro funcionará sin protección
- Sin Resend: Los emails no se enviarán (pero el registro funcionará)

### ¿Qué pasa si no configuro nada?
El sistema funcionará, pero:
- No habrá login con Google
- No habrá protección CAPTCHA
- No se enviarán emails de verificación (pero el registro funcionará)

### ¿Necesito pagar algo?
No, todas las opciones tienen planes gratuitos:
- Google OAuth: Gratis
- reCAPTCHA: Gratis hasta 1M verificaciones/mes
- Resend: Gratis hasta 3,000 emails/mes

---

## 🔗 Enlaces Útiles

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
- [Resend Dashboard](https://resend.com/)
- [NextAuth.js Docs](https://next-auth.js.org/)

