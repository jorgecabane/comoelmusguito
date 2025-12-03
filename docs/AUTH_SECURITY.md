# Seguridad y Autenticación - Evaluación e Implementación

Este documento evalúa 3 mejoras de seguridad y autenticación para el sistema.

## 1. CAPTCHA (reCAPTCHA v3 de Google)

### Dificultad: ⭐⭐ (Fácil-Medio)

**¿Por qué implementarlo?**
- Previene registros automatizados (bots)
- Protege contra ataques de fuerza bruta
- Reduce spam y usuarios maliciosos
- **Gratis** hasta 1 millón de verificaciones/mes

### Implementación

#### Paso 1: Instalar dependencia
```bash
npm install react-google-recaptcha-v3
```

#### Paso 2: Configurar variables de entorno
```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_site_key_aqui
RECAPTCHA_SECRET_KEY=tu_secret_key_aqui
```

#### Paso 3: Obtener credenciales
1. Ir a https://www.google.com/recaptcha/admin/create
2. Registrar sitio (tipo: reCAPTCHA v3)
3. Agregar dominios: `localhost`, `comoelmusguito.cl`
4. Copiar Site Key y Secret Key

#### Paso 4: Implementar en el frontend
- Agregar provider en `app/layout.tsx`
- Agregar verificación en `app/auth/register/page.tsx`

#### Paso 5: Validar en el backend
- Verificar token en `app/api/auth/register/route.ts`

### Costo
- **Gratis** para hasta 1M de verificaciones/mes
- Después: $1 por cada 1,000 verificaciones adicionales

### Alternativas
- **hCaptcha**: Similar, más privacidad
- **Cloudflare Turnstile**: Gratis, sin tracking

---

## 2. Confirmación de Email con Resend

### Dificultad: ⭐⭐⭐ (Medio)

**¿Por qué implementarlo?**
- Verifica que el email sea válido
- Previene cuentas con emails falsos
- Mejora la calidad de la base de datos
- Ya tienes Resend configurado ✅

### Cambios necesarios

#### 1. Agregar campo `emailVerified` al schema de usuario
- Modificar `sanity/schemas/user.ts`
- Agregar campo booleano `emailVerified` (default: false)

#### 2. Generar token de verificación
- Crear token único al registrar
- Guardar token en el usuario (o en tabla separada)
- Token expira en 24-48 horas

#### 3. Enviar email de confirmación
- Usar Resend (ya configurado)
- Crear template de email
- Incluir link con token

#### 4. Crear ruta de verificación
- `app/api/auth/verify-email/route.ts`
- Validar token
- Marcar email como verificado

#### 5. Modificar login
- Verificar que email esté confirmado
- Mostrar mensaje si no está verificado
- Permitir reenvío de email

### Flujo
```
Usuario se registra
  ↓
Se crea usuario con emailVerified: false
  ↓
Se genera token único
  ↓
Se envía email con link de verificación
  ↓
Usuario hace click en el link
  ↓
Se valida token y marca emailVerified: true
  ↓
Usuario puede hacer login
```

### Costo
- Resend: **Gratis** hasta 3,000 emails/mes
- Después: $20/mes por 50,000 emails

---

## 3. Google SSO (Single Sign-On)

### Dificultad: ⭐ (Muy Fácil - Ya está parcialmente implementado)

**¿Por qué implementarlo?**
- Mejor experiencia de usuario
- No requiere contraseña
- Más seguro (Google maneja la seguridad)
- Ya está en el código ✅

### Lo que falta

#### 1. Configurar Google OAuth
1. Ir a https://console.cloud.google.com/
2. Crear proyecto (o usar existente)
3. Habilitar "Google+ API"
4. Crear credenciales OAuth 2.0
5. Agregar URLs autorizadas:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://comoelmusguito.cl/api/auth/callback/google`

#### 2. Variables de entorno
```env
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_client_id_aqui
```

#### 3. Verificar que funcione
- El código ya está en `app/api/auth/[...nextauth]/route.ts`
- Solo falta configurar las variables

### Costo
- **Gratis** (Google OAuth es gratuito)

---

## Recomendación de Prioridad

1. **Google SSO** (⭐) - Ya está implementado, solo falta configurar
2. **CAPTCHA** (⭐⭐) - Fácil de agregar, buena protección
3. **Email Verification** (⭐⭐⭐) - Más complejo pero muy valioso

---

## Próximos Pasos

¿Quieres que implemente alguna de estas opciones? Puedo:
- ✅ Implementar CAPTCHA completo
- ✅ Implementar verificación de email completo
- ✅ Ayudar a configurar Google SSO
- ✅ Implementar todas las opciones

