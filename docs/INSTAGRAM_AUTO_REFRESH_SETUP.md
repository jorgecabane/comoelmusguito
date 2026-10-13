# 🚀 Setup Rápido: Refresh Automático de Instagram

Guía paso a paso para configurar el refresh automático del token de Instagram.

---

## ⚡ Setup en 5 Minutos

### 1. Obtener Token de Vercel API

1. Ve a [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Crea un token con nombre "Instagram Auto Refresh"
3. Copia el token

### 2. Obtener Project ID

1. Ve a tu proyecto en Vercel
2. Settings → General
3. Copia el "Project ID"

### 3. Generar CRON_SECRET

```bash
openssl rand -base64 32
```

O:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Agregar Variables de Entorno en Vercel

Ve a Settings → Environment Variables y agrega:

```
VERCEL_TOKEN=tu_token_de_paso_1
VERCEL_PROJECT_ID=tu_project_id_de_paso_2
CRON_SECRET=tu_secret_de_paso_3
```

**Aplicar a:** Production, Preview

### 5. vercel.json

No hay que tocarlo: el secret **no** va en `vercel.json`. Con `CRON_SECRET` definido, Vercel envía `Authorization: Bearer <CRON_SECRET>` solo:

```json
{
  "crons": [
    {
      "path": "/api/instagram/refresh-auto",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

**Nota:** El schedule `0 0 1 * *` ejecuta el cron el día 1 de cada mes. Esto es suficiente ya que el token dura 60 días.

### 6. Deploy

```bash
git add vercel.json
git commit -m "Configurar cron job para refresh automático de Instagram"
git push
```

---

## ✅ Verificar que Funciona

### Probar Manualmente

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://comoelmusguito.cl/api/instagram/refresh-auto
```

Deberías ver:
```json
{
  "success": true,
  "message": "Token refrescado y actualizado en Vercel exitosamente",
  ...
}
```

### Verificar en Vercel

1. Settings → Environment Variables
2. Verifica que `INSTAGRAM_ACCESS_TOKEN` se haya actualizado

---

## 📝 Notas Importantes

1. **El secret nunca va en vercel.json**: basta con `CRON_SECRET` en las variables de entorno
2. **El cron se ejecuta cada 50 días** aproximadamente
3. **El nuevo token** estará disponible después del próximo deploy
4. **Si el token expira completamente** (más de 60 días), necesitarás renovarlo manualmente

---

## 🆘 Problemas Comunes

**Error: "No autorizado"**
- Verifica que `CRON_SECRET` esté definido en Vercel (Production) y redeploya

**Error: "VERCEL_TOKEN no configurado"**
- Verifica que las variables estén en Vercel y aplicadas a Production

**El cron no se ejecuta**
- Verifica que `vercel.json` esté en la raíz del proyecto
- Asegúrate de que el proyecto esté deployado

---

Para más detalles, ver `docs/INSTAGRAM_AUTO_REFRESH.md`

