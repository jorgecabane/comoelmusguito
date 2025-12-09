# 📎 Formato de URL para Videos de Vimeo en Cursos

Esta guía explica qué formato de URL usar cuando agregas videos de Vimeo a tus cursos en Sanity.

---

## 🎯 Respuesta Rápida

### ✅ **Usa el LINK PARA COMPARTIR (URL simple)**

**NO uses el código de embed completo.** Solo necesitas la URL del video.

---

## 📋 Formatos de URL Aceptados

Tu componente `VideoPlayer` acepta estos formatos de URL de Vimeo:

### ✅ Formatos Válidos:

1. **Link directo (Recomendado)**
   ```
   https://vimeo.com/1144342696
   ```

2. **Link con /video/**
   ```
   https://vimeo.com/video/1144342696
   ```

3. **Link privado con hash en la ruta (Recomendado para videos privados)**
   ```
   https://vimeo.com/1144342696/f88bb2c0a2
   ```

4. **Link privado con hash como parámetro**
   ```
   https://vimeo.com/1144342696?h=f88bb2c0a2
   ```

5. **Link privado completo (con parámetros adicionales)**
   ```
   https://vimeo.com/1144342696/f88bb2c0a2?share=copy&fl=sv&fe=ci
   ```
   **Nota**: El componente extraerá automáticamente el ID y el hash, ignorando los parámetros adicionales.

### ❌ NO uses:

- ❌ Código de embed completo (HTML)
- ❌ URL del iframe (`player.vimeo.com`)
- ❌ Código JavaScript

---

## 🔍 Cómo Obtener la URL Correcta

### Opción 1: Desde la Página del Video en Vimeo

1. Abre el video en Vimeo
2. Haz clic en el botón **"Share"** (Compartir)
3. Copia el **"Link"** (no el código de embed)
4. Debería verse así: `https://vimeo.com/1144342696`

### Opción 2: Desde la Barra de Direcciones

1. Abre el video en Vimeo
2. Copia la URL de la barra de direcciones
3. Debería verse así: `https://vimeo.com/1144342696`

---

## 💻 Cómo Funciona en tu Código

Tu componente `VideoPlayer` extrae automáticamente el ID del video desde la URL:

```typescript
function getVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}
```

Luego construye el iframe correctamente:

```typescript
iframeSrc = `https://player.vimeo.com/video/${vimeoId}?`;
// Agrega parámetros adicionales...
```

**Esto significa que:**
- ✅ Solo necesitas la URL simple del video
- ✅ El componente se encarga del resto
- ✅ No necesitas copiar el código de embed completo

---

## 📝 Ejemplo en Sanity

Cuando agregas un video a una lección en Sanity:

### ✅ Correcto:

```
Campo: videoUrl
Valor: https://vimeo.com/1144342696

Campo: videoProvider
Valor: vimeo
```

### ❌ Incorrecto:

```
Campo: videoUrl
Valor: <div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1144342696?h=f88bb2c0a2..."...

❌ Esto NO funcionará - el componente no puede extraer el ID desde HTML
```

---

## 🔗 URLs Privadas de Vimeo

Si estás usando videos privados, Vimeo genera links con un hash privado. El componente soporta múltiples formatos:

### ✅ Formatos que Funcionan:

1. **Hash en la ruta** (formato más común al copiar link):
   ```
   https://vimeo.com/1144342696/f88bb2c0a2
   ```

2. **Hash como parámetro query**:
   ```
   https://vimeo.com/1144342696?h=f88bb2c0a2
   ```

3. **Link completo con parámetros adicionales**:
   ```
   https://vimeo.com/1144342696/f88bb2c0a2?share=copy&fl=sv&fe=ci
   ```

**El componente extraerá automáticamente:**
- ✅ El ID del video (`1144342696`)
- ✅ El hash privado (`f88bb2c0a2`) si está presente
- ✅ Ignorará parámetros adicionales como `share=copy`, `fl=sv`, etc.

**Importante**: Para videos privados, el hash es **necesario** para que el video se reproduzca. Sin el hash, obtendrás un error 403 (Forbidden).

---

## 🎨 Comparación: Link vs Código de Embed

### Link para Compartir (✅ Usa esto)

```
https://vimeo.com/1144342696
```

**Ventajas:**
- ✅ Simple y fácil de copiar
- ✅ Funciona directamente con tu componente
- ✅ Fácil de actualizar si cambias la configuración en Vimeo
- ✅ El componente construye el iframe con tus configuraciones

### Código de Embed (❌ NO uses esto)

```html
<div style="padding:56.25% 0 0 0;position:relative;">
  <iframe src="https://player.vimeo.com/video/1144342696?h=f88bb2c0a2&badge=0&autopause=0&player_id=0&app_id=58479" 
    frameborder="0" 
    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
    referrerpolicy="strict-origin-when-cross-origin" 
    style="position:absolute;top:0;left:0;width:100%;height:100%;" 
    title="Oficios Extraordinarios - Terrarios">
  </iframe>
</div>
<script src="https://player.vimeo.com/api/player.js"></script>
```

**Desventajas:**
- ❌ Demasiado complejo
- ❌ No funciona con tu componente actual
- ❌ Incluye configuraciones que ya manejas en Vimeo
- ❌ Más difícil de mantener

---

## ✅ Checklist para Agregar Videos

Cuando agregues un video a una lección en Sanity:

- [ ] Copia el **link para compartir** (no el código de embed)
- [ ] Formato: `https://vimeo.com/1144342696` o `https://vimeo.com/video/1144342696`
- [ ] Pega la URL en el campo `videoUrl`
- [ ] Selecciona `vimeo` en el campo `videoProvider`
- [ ] Guarda la lección
- [ ] Verifica que el video se reproduce correctamente en tu sitio

---

## 🔍 Verificación

Después de agregar el video:

1. **Abre la lección en tu sitio**
2. **Verifica que:**
   - ✅ El video se carga correctamente
   - ✅ Los controles funcionan
   - ✅ El reproductor tiene el estilo correcto (según tu configuración de embed)
   - ✅ No hay errores en la consola

---

## 🆘 Problemas Comunes

### Problema: "Video no disponible"

**Causa**: La URL no tiene el formato correcto o el video no permite embedding.

**Solución**:
1. Verifica que la URL sea `https://vimeo.com/1144342696` (formato simple)
2. Verifica que el video tenga la configuración de privacidad correcta
3. Verifica que el dominio esté en la lista de dominios permitidos en Vimeo

### Problema: El video no se reproduce

**Causa**: Puede ser un problema de restricción de dominio.

**Solución**:
1. Verifica que `localhost:3000`, `comoelmusguito.vercel.app` y `comoelmusguito.cl` estén en la lista de dominios permitidos
2. Verifica la configuración de privacidad del video en Vimeo

---

## 📚 Referencias

- [Guía de Restricción de Dominios](./VIMEO_DOMAIN_RESTRICTION.md)
- [Guía de Privacidad](./VIMEO_PRIVACY_GUIDE.md)
- [Personalización del Reproductor](./VIMEO_EMBED_CUSTOMIZATION.md)

