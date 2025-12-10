# 🔧 Cómo Actualizar Variables de Entorno en Vercel

Esta guía explica cómo actualizar variables de entorno en Vercel, especialmente útil para renovar el token de Instagram.

---

## 📋 Opciones para Actualizar Variables de Entorno

### Opción 1: Dashboard de Vercel (Más Fácil) ⭐

1. **Accede a tu proyecto**
   - Ve a [vercel.com](https://vercel.com)
   - Inicia sesión y selecciona tu proyecto

2. **Ve a Configuración**
   - Haz clic en "Settings" en el menú superior
   - Selecciona "Environment Variables" en el menú lateral

3. **Editar variable existente**
   - Busca `INSTAGRAM_ACCESS_TOKEN` en la lista
   - Haz clic en los tres puntos (⋯) a la derecha
   - Selecciona "Edit"
   - Pega el nuevo valor
   - Selecciona los entornos donde aplica (Production, Preview, Development)
   - Haz clic en "Save"

4. **Agregar nueva variable** (si no existe)
   - Haz clic en "Add New"
   - Nombre: `INSTAGRAM_ACCESS_TOKEN`
   - Valor: pega el nuevo token
   - Selecciona los entornos
   - Haz clic en "Save"

5. **⚠️ Importante: Redesplegar**
   - Después de cambiar variables de entorno, necesitas hacer un nuevo deploy
   - Vercel te mostrará un botón "Redeploy" o puedes hacer push a tu repo

---

### Opción 2: Vercel CLI (Desde Terminal)

1. **Instalar Vercel CLI** (si no lo tienes)
   ```bash
   npm i -g vercel
   ```

2. **Login en Vercel**
   ```bash
   vercel login
   ```

3. **Eliminar variable antigua** (si existe)
   ```bash
   vercel env rm INSTAGRAM_ACCESS_TOKEN
   ```
   - Selecciona el proyecto
   - Selecciona los entornos (Production, Preview, Development)

4. **Agregar nueva variable**
   ```bash
   vercel env add INSTAGRAM_ACCESS_TOKEN
   ```
   - Pega el nuevo valor cuando te lo pida
   - Selecciona los entornos donde aplica

5. **Redesplegar**
   ```bash
   vercel --prod
   ```

---

### Opción 3: API de Vercel (Programático) 🔧

Si quieres automatizar la actualización (avanzado):

1. **Obtener Vercel Token**
   - Ve a [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Crea un nuevo token
   - Guárdalo como `VERCEL_TOKEN` en tus variables de entorno

2. **Usar el endpoint de refresh de Instagram**
   - El endpoint `/api/instagram/refresh` retorna el nuevo token
   - Puedes crear un script que:
     1. Llame a `/api/instagram/refresh`
     2. Use la API de Vercel para actualizar la variable
     3. Redesplegue automáticamente

**Ejemplo de script (avanzado):**
```typescript
// scripts/update-vercel-token.ts
import { refreshInstagramToken } from '@/lib/instagram/token';

async function updateVercelEnv(token: string) {
  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
  const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // Opcional

  // Usar Vercel API v2
  const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env`;
  
  // Primero eliminar la variable antigua
  // Luego agregar la nueva
  // (Ver documentación de Vercel API)
}
```

**Nota:** Esta opción es más compleja y requiere manejar la API de Vercel. Para la mayoría de casos, las opciones 1 o 2 son suficientes.

---

## 🔄 Proceso Recomendado para Renovar Token de Instagram

### Paso 1: Obtener Nuevo Token

**Opción A: Usar endpoint de refresh** (si el token aún no expiró completamente)
```bash
curl https://comoelmusguito.cl/api/instagram/refresh
```
Copia el `token` de la respuesta.

**Opción B: Obtener token nuevo** (si expiró completamente)
```bash
npm run script:instagram-auth
```
Sigue el proceso de autorización y copia el token.

### Paso 2: Actualizar en Vercel

Usa la **Opción 1** (Dashboard) o **Opción 2** (CLI) de arriba.

### Paso 3: Redesplegar

- **Dashboard:** Haz clic en "Redeploy" en el último deploy
- **CLI:** `vercel --prod`
- **Git:** Haz un push (si tienes auto-deploy configurado)

---

## ⏰ ¿Cuándo Renovar el Token?

- **Cada 50-55 días** (antes de que expire a los 60 días)
- **Cuando veas error 401** en `/api/instagram/feed`
- **Preventivamente** usando `/api/instagram/refresh`

---

## 💡 Tips

1. **Configurar recordatorio** - Pon una alerta en tu calendario cada 50 días
2. **Monitorear logs** - Revisa periódicamente si hay errores de Instagram
3. **Usar endpoint de refresh** - Llama a `/api/instagram/refresh` periódicamente para verificar estado
4. **Guardar token en lugar seguro** - Usa un password manager para guardar el token

---

## 📚 Referencias

- [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables)
- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [Vercel API Docs](https://vercel.com/docs/rest-api)

