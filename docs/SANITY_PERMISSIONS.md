# 🔐 Permisos de Sanity - Configuración

## ❌ Error: "Insufficient permissions; permission 'create' required"

Este error ocurre cuando el token de API de Sanity no tiene permisos de escritura.

## 🔧 Solución

### 1. Verificar el Token Actual

El token que estás usando está en `.env.local`:
```env
SANITY_API_TOKEN=tu_token_actual
```

### 2. Crear un Nuevo Token con Permisos de Editor

**✅ RECOMENDACIÓN: Usar un solo token con permisos de Editor**

1. **Ir a Sanity Manage:**
   - https://www.sanity.io/manage

2. **Seleccionar tu proyecto** (comoelmusguito)

3. **Ir a "API" → "Tokens"**

4. **Crear un nuevo token:**
   - Click en "Add API token"
   - **Nombre:** `Editor Token - comoelmusguito`
   - **Permisos:** Seleccionar **Editor**
     - ✅ Read and write access to all datasets
     - ✅ Limited access to project settings
     - ✅ Tokens: read+write
   - **Dataset:** `production` (o el dataset que uses)

5. **Copiar el token** (solo se muestra una vez)

6. **Actualizar `.env.local`:**
   ```env
   SANITY_API_TOKEN=el_nuevo_token_con_permisos_de_editor
   ```

### 3. ¿Por qué Editor y no otro permiso?

| Permiso | Lectura | Escritura | Uso |
|---------|---------|-----------|-----|
| **Viewer** | ✅ | ❌ | Solo lectura (no sirve) |
| **Contributor** | ✅ | ⚠️ Solo drafts | No escribe en producción |
| **Editor** | ✅ | ✅ | ✅ **RECOMENDADO** |
| **Developer** | ✅ | ✅ | ✅ Funciona, pero acceso excesivo |

**Editor es perfecto porque:**
- ✅ Permite leer y escribir en todos los datasets
- ✅ Acceso limitado a configuración (más seguro)
- ✅ Suficiente para crear usuarios, órdenes, accesos
- ✅ Suficiente para actualizar órdenes y progreso

### 4. ¿Un token o dos?

**✅ RECOMENDACIÓN: Un solo token con permisos de Editor**

**Ventajas:**
- ✅ Más simple de gestionar
- ✅ Un solo token que actualizar
- ✅ Menos confusión
- ✅ Todo pasa por el servidor (más seguro)

**Cómo funciona:**
- El mismo token se usa para lectura y escritura
- Todo pasa por el servidor (Next.js API routes)
- El frontend nunca accede directamente a Sanity
- Más seguro y simple

### 5. Verificar que el Token Funciona

El token debe tener estos permisos:
- ✅ **Read** (para consultar datos)
- ✅ **Create** (para crear usuarios, órdenes, accesos)
- ✅ **Update** (para actualizar órdenes, progreso)
- ✅ **Delete** (opcional, para eliminar si es necesario)

## 🔍 Verificación

Después de actualizar el token, reinicia el servidor:
```bash
npm run dev
```

Y prueba crear un usuario en el checkout. Debería funcionar sin errores.

## 🛡️ Seguridad

- **Nunca compartas el token** públicamente
- **No lo subas a Git** (ya está en `.gitignore`)
- **Usa diferentes tokens** para desarrollo y producción
- **Rota los tokens** periódicamente
- **Todo pasa por el servidor** (el token nunca se expone al frontend)

