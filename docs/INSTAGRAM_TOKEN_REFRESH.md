# 🔄 Refresh Automático de Token de Instagram

## ¿Cómo Funciona?

El sistema implementa **refresh automático del token** sin necesidad de autorización manual del usuario.

### ✅ Refresh Automático (Sin Autorización)

**Respuesta corta:** ❌ **NO necesita tu autorización** para refrescar el token.

**Cómo funciona:**
1. Cuando el token expira (error 401), el sistema lo detecta automáticamente
2. Intenta refrescar el token usando el endpoint de Instagram
3. Si el refresh funciona, reintenta la petición original
4. Todo esto sucede **automáticamente** sin intervención

**Limitación:** Solo funciona si el token **aún no ha expirado completamente** (menos de 60 días desde la última renovación).

---

## 🔧 Implementación

### 1. Detección Automática

El endpoint `/api/instagram/feed` detecta automáticamente cuando el token expira:

```typescript
// Si el token expiró, intentar refrescarlo automáticamente
if (result.error && isTokenExpiredError(result.error)) {
  const refreshResult = await refreshInstagramToken(INSTAGRAM_ACCESS_TOKEN);
  // ... reintentar con el nuevo token
}
```

### 2. Reintento Automático

Si el refresh funciona:
- ✅ Se usa el nuevo token para la petición actual
- ✅ La respuesta se retorna normalmente
- ⚠️ Se imprime un warning en los logs con el nuevo token

### 3. Manejo de Errores

Si el refresh falla (token completamente expirado):
- ❌ Retorna error específico
- 📝 Incluye instrucciones para renovación manual

---

## 📝 Persistencia del Token

**Importante:** Cuando el token se refresca automáticamente, se usa en memoria para la request actual, pero **no se actualiza automáticamente en tus variables de entorno**.

### Opciones para Persistir el Token:

#### Opción 1: Manual (Simple)
1. Revisa los logs cuando veas el warning
2. Copia el nuevo token
3. Actualiza `INSTAGRAM_ACCESS_TOKEN` en tus variables de entorno

#### Opción 2: Endpoint de Refresh (Recomendado)
Llama periódicamente a `/api/instagram/refresh`:

```bash
# Ejemplo: Refrescar cada 50 días
curl https://comoelmusguito.cl/api/instagram/refresh
```

El endpoint retorna el nuevo token para que lo actualices.

#### Opción 3: Automatización con Cron (Producción)
Configura un cron job que:
1. Llame a `/api/instagram/refresh` cada 50 días
2. Actualice automáticamente la variable de entorno en tu plataforma

**Ejemplo para Vercel:**
```bash
# Usar Vercel Cron Jobs
# vercel.json
{
  "crons": [{
    "path": "/api/instagram/refresh",
    "schedule": "0 0 */50 * *"
  }]
}
```

---

## 🧪 Testing

### Probar Refresh Automático

1. **Simular token expirado:**
   - Usa un token viejo o inválido
   - Haz una petición a `/api/instagram/feed`
   - Debería intentar refrescar automáticamente

2. **Verificar logs:**
   - Busca el mensaje: `🔄 Token expirado, intentando refrescar automáticamente...`
   - Si funciona: `✅ Token refrescado exitosamente`
   - Si falla: Error con instrucciones

### Probar Endpoint de Refresh

```bash
# Refrescar token manualmente
curl http://localhost:3000/api/instagram/refresh

# Respuesta esperada:
{
  "success": true,
  "token": "nuevo_token_aqui",
  "expiresInDays": 60,
  "expiresAt": "2024-03-15T00:00:00.000Z"
}
```

---

## ⚠️ Token Completamente Expirado

Si el token expira completamente (más de 60 días sin renovar):

- ❌ **NO puede ser refrescado automáticamente**
- ✅ **Necesitas autorización manual nuevamente**

**Proceso:**
1. Ejecuta: `npm run script:instagram-auth`
2. Sigue el proceso de autorización OAuth
3. Obtén el nuevo token
4. Actualiza `INSTAGRAM_ACCESS_TOKEN` en tus variables de entorno

---

## 📊 Flujo Completo

```
Usuario visita página
    ↓
Componente llama a /api/instagram/feed
    ↓
¿Token válido?
    ├─ SÍ → Retorna fotos ✅
    └─ NO → ¿Token expirado?
            ├─ SÍ → Intenta refresh automático
            │       ├─ ¿Refresh exitoso?
            │       │   ├─ SÍ → Reintenta petición → Retorna fotos ✅
            │       │   └─ NO → Error: Token completamente expirado ❌
            │       └─ NO → Error genérico ❌
            └─ NO → Error genérico ❌
```

---

## 💡 Mejores Prácticas

1. **Monitorear logs** - Revisa periódicamente si hay warnings de token refrescado
2. **Refresh preventivo** - Llama a `/api/instagram/refresh` cada 50 días antes de que expire
3. **Automatizar** - En producción, configura un cron job para refresh preventivo
4. **Backup** - Guarda el token en un lugar seguro (password manager, etc.)

---

## 🔗 Referencias

- [Instagram Basic Display API - Refresh Token](https://developers.facebook.com/docs/instagram-basic-display-api/guides/long-lived-access-tokens)
- [Token Expiration](https://developers.facebook.com/docs/instagram-basic-display-api/overview#token-expiration)

