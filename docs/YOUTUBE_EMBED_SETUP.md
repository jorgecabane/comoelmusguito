# 📺 Configuración de YouTube para Embedding

## 🔒 Configuraciones de Privacidad de YouTube

### ✅ **Público** (Recomendado)
- ✅ Se puede embeber en cualquier sitio
- ✅ Aparece en búsquedas de YouTube
- ✅ Cualquiera puede verlo

### ✅ **No listado (Unlisted)** (Recomendado para cursos)
- ✅ Se puede embeber en cualquier sitio
- ❌ NO aparece en búsquedas de YouTube
- ✅ Solo personas con el link pueden verlo
- ✅ **PERFECTO para cursos online** (no aparece en búsquedas pero se puede embeber)

### ❌ **Privado**
- ❌ **NO se puede embeber**
- ❌ Solo tú puedes verlo
- ❌ No funciona para embedding

---

## ⚙️ Cómo Habilitar Embedding en YouTube

### Paso 1: Editar el Video
1. Ve a [YouTube Studio](https://studio.youtube.com/)
2. Selecciona el video que quieres embeber
3. Haz clic en **"Editar"** o **"Detalles"**

### Paso 2: Configurar Privacidad
1. En la sección **"Visibilidad"**, selecciona:
   - ✅ **"Público"** O
   - ✅ **"No listado"** (recomendado para cursos)

### Paso 3: Habilitar Embedding
1. Ve a la sección **"Mostrar más"** o **"Configuración avanzada"**
2. Busca la opción **"Permitir embedding"** o **"Allow embedding"**
3. ✅ **Actívala** (debe estar marcada)

### Paso 4: Verificar Restricciones
1. En **"Configuración avanzada"**, verifica:
   - ✅ **"Permitir embedding"** = Activado
   - ✅ **"Restricción de edad"** = No restringido (a menos que sea necesario)
   - ✅ **"Restricción geográfica"** = Sin restricciones (a menos que sea necesario)

---

## 🧪 Cómo Verificar que Funciona

### Método 1: Probar el Embed Directo
1. Copia el ID del video (ej: `J-Rff6stdDw`)
2. Abre esta URL en el navegador:
   ```
   https://www.youtube.com/embed/J-Rff6stdDw
   ```
3. Si ves el video, el embedding está habilitado ✅
4. Si ves un error, el embedding está deshabilitado ❌

### Método 2: Verificar en YouTube Studio
1. Ve al video en YouTube Studio
2. En **"Configuración avanzada"**
3. Verifica que **"Permitir embedding"** esté activado

---

## 🎯 Configuración Recomendada para Cursos Online

```
✅ Visibilidad: "No listado" (Unlisted)
✅ Permitir embedding: ACTIVADO
✅ Restricción de edad: Sin restricción
✅ Restricción geográfica: Sin restricciones
✅ Comentarios: Desactivados (opcional, para evitar spam)
```

**¿Por qué "No listado"?**
- ✅ El video NO aparece en búsquedas públicas de YouTube
- ✅ Solo personas con el link pueden encontrarlo
- ✅ PERO se puede embeber perfectamente en tu sitio
- ✅ Perfecto para contenido de pago/cursos

---

## 🐛 Problemas Comunes

### ❌ Error: "Este video no está disponible"
**Causa:** El video es "Privado" o el embedding está deshabilitado
**Solución:** Cambiar a "Público" o "No listado" y habilitar embedding

### ❌ Error: "El propietario del video ha deshabilitado la reproducción en otros sitios web"
**Causa:** Embedding explícitamente deshabilitado
**Solución:** Habilitar "Permitir embedding" en configuración avanzada

### ❌ Error: "Este video contiene contenido de [artista], que ha bloqueado su visualización en tu país"
**Causa:** Restricción geográfica o de derechos de autor
**Solución:** Verificar restricciones geográficas en configuración avanzada

---

## 📝 Checklist para Cada Video

Antes de usar un video en el sitio, verifica:

- [ ] Visibilidad: "Público" o "No listado"
- [ ] "Permitir embedding" está ACTIVADO
- [ ] Sin restricciones geográficas (a menos que sea necesario)
- [ ] El video se puede ver con el link directo
- [ ] El embed funciona en: `https://www.youtube.com/embed/[VIDEO_ID]`

---

## 🔗 URLs Soportadas

El componente `VideoPlayer` acepta estas URLs de YouTube:

✅ `https://www.youtube.com/watch?v=J-Rff6stdDw`
✅ `https://youtu.be/J-Rff6stdDw`
✅ `https://www.youtube.com/embed/J-Rff6stdDw`

Todas se normalizan automáticamente a `youtube.com/watch?v=...`

