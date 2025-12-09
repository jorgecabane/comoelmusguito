# 🎨 Guía de Personalización del Reproductor Embebido de Vimeo

Esta guía explica cómo configurar la apariencia y comportamiento del reproductor de Vimeo cuando se inserta en tu sitio web.

Según la [documentación oficial de Vimeo](https://help.vimeo.com/hc/en-us/articles/12426259745937-How-do-I-customize-the-embedded-player), puedes personalizar el reproductor embebido para que coincida con tu marca y mejore la experiencia del usuario.

---

## 🎯 ¿Es Necesario Configurarlo?

### ✅ **SÍ, es recomendable configurarlo** porque:

1. **Branding consistente**
   - Oculta el branding de Vimeo
   - Personaliza colores para que coincidan con tu marca
   - Crea una experiencia más profesional

2. **Mejor experiencia de usuario**
   - Controla qué opciones se muestran
   - Personaliza controles y botones
   - Mejora la usabilidad en tus cursos

3. **Ahorra tiempo**
   - Crea un preset que se aplica a todos los videos
   - No necesitas configurar cada video individualmente

---

## 📋 Configuración Recomendada para Cursos

### Opción 1: Configuración Predeterminada Global (Recomendada)

Esta configuración se aplica a todos los videos de tu cuenta:

1. **Accede a la configuración de embed**
   - Ve a tu cuenta de Vimeo
   - Settings (Configuración) → **Embed defaults** (Configuración predeterminada de inserción)
   - O ve directamente a: [Configuración de Embed](https://vimeo.com/settings/embed)

2. **Configura las siguientes opciones:**

#### **Branding (Marca)**
- ✅ **Ocultar logo de Vimeo**: Desactivado (si tienes plan Starter+)
- ✅ **Logo personalizado**: Sube tu logo (opcional)
- ✅ **Color del reproductor**: Usa los colores de tu marca
  - Color principal: `#2D5016` (forest - tu color principal)
  - Color secundario: `#6B8E23` (musgo - tu color secundario)

#### **Engagement (Interacción)**
- ❌ **Mostrar botón de compartir**: Desactivado (no quieres que compartan)
- ❌ **Mostrar botón de like**: Desactivado (opcional, para cursos no es necesario)
- ❌ **Mostrar botón de suscribirse**: Desactivado
- ✅ **End screen personalizado**: Opcional (puedes agregar un CTA al final)

#### **Details (Detalles)**
- ❌ **Mostrar título del video**: Desactivado (ya lo muestras en tu UI)
- ❌ **Mostrar descripción**: Desactivado (ya la muestras en tu UI)
- ❌ **Mostrar autor**: Desactivado
- ❌ **Mostrar fecha de publicación**: Desactivado

#### **Controls (Controles)**
- ✅ **Mostrar controles**: Activado
- ✅ **Mostrar barra de progreso**: Activado
- ✅ **Mostrar botón de pantalla completa**: Activado
- ✅ **Mostrar controles de volumen**: Activado
- ✅ **Mostrar velocidad de reproducción**: Activado (útil para cursos)
- ✅ **Mostrar subtítulos/CC**: Activado (si tienes subtítulos)

3. **Guarda como preset**
   - Haz clic en **"+ Save new preset"** o **"Guardar como preset"**
   - Nómbralo: "Cursos comoelmusguito" o similar
   - Este preset se aplicará automáticamente a nuevos videos

---

## 🎨 Personalización Específica para tu Marca

### Colores Recomendados

Basándote en tu paleta de colores (`forest`, `musgo`, `vida`, `cream`):

```
Color principal del reproductor: #2D5016 (forest)
Color de acento: #6B8E23 (musgo)
Color de hover: #8FBC8F (vida)
```

### Configuración Mínima Recomendada

Para empezar, configura al menos esto:

```
✅ Ocultar branding de Vimeo (si tu plan lo permite)
✅ Personalizar colores del reproductor
❌ Desactivar compartir
❌ Desactivar like/suscribirse
❌ Ocultar detalles del video (título, descripción, autor)
✅ Mantener todos los controles de reproducción
```

---

## 🔧 Configuración por Video Individual

Si prefieres configurar cada video individualmente:

1. **Abre el video en Vimeo**
2. **Ve a Settings → Appearance → Embed tab**
3. **Aplica las mismas configuraciones** mencionadas arriba
4. **Guarda los cambios**

**Nota**: Cualquier cambio en la configuración de embed se aplica automáticamente a todos los sitios donde el video ya está embebido.

---

## 📝 Presets (Configuraciones Predefinidas)

### Crear un Preset

1. Configura un video con las opciones deseadas
2. Haz clic en **"+ Save new preset"**
3. Dale un nombre descriptivo: "Cursos Premium"
4. Este preset estará disponible para aplicar a otros videos

### Aplicar un Preset

1. Abre cualquier video
2. Ve a Settings → Appearance → Embed tab
3. Selecciona el preset de la lista desplegable
4. Los cambios se aplican inmediatamente

---

## 🎯 Configuración Específica para Cursos Online

### Lo que DEBES configurar:

```
✅ Branding:
   - Ocultar logo de Vimeo (si Starter+)
   - Color personalizado del reproductor

❌ Engagement:
   - Desactivar compartir
   - Desactivar like
   - Desactivar suscribirse

❌ Details:
   - Ocultar título (ya lo muestras en tu UI)
   - Ocultar descripción
   - Ocultar autor
   - Ocultar fecha

✅ Controls:
   - Mantener todos los controles activos
   - Velocidad de reproducción (útil para estudiantes)
   - Subtítulos (si los tienes)
```

### Lo que NO necesitas:

```
❌ End screens personalizados (a menos que quieras CTAs)
❌ Cards interactivas (no aplica para cursos)
❌ Registration forms (ya manejas el acceso en tu backend)
```

---

## 🔍 Verificación

Después de configurar:

1. **Abre un video en tu sitio** (`localhost:3000` o producción)
2. **Verifica que:**
   - ✅ No aparece el logo de Vimeo (si lo ocultaste)
   - ✅ Los colores coinciden con tu marca
   - ✅ No hay botones de compartir/like
   - ✅ Los controles funcionan correctamente
   - ✅ La experiencia se siente integrada con tu sitio

---

## ⚠️ Limitaciones por Plan

### Plan Starter ($12/mes)
- ✅ Personalización básica de colores
- ✅ Ocultar algunos elementos
- ⚠️ Logo de Vimeo puede seguir apareciendo (depende de la configuración)

### Plan Standard ($20/mes)
- ✅ Todo lo de Starter +
- ✅ Branding completo (logo personalizado)
- ✅ Más opciones de personalización

### Plan Advanced ($65/mes)
- ✅ Todo lo de Standard +
- ✅ Personalización avanzada
- ✅ Analytics detallados

**Para tu caso**: Plan Starter es suficiente para la mayoría de personalizaciones básicas.

---

## 🎨 Integración con tu Código

Tu componente `VideoPlayer` ya maneja el iframe correctamente. La personalización del reproductor se hace en Vimeo, no en el código.

Sin embargo, puedes agregar parámetros adicionales a la URL del embed si es necesario:

```typescript
// En VideoPlayer.tsx, para Vimeo:
iframeSrc = `https://player.vimeo.com/video/${vimeoId}?`;
if (autoplay) iframeSrc += 'autoplay=1&';
if (!controls) iframeSrc += 'controls=0&';
iframeSrc += 'dnt=1&'; // Do Not Track
// Puedes agregar más parámetros aquí si es necesario
```

**Nota**: La mayoría de personalizaciones se hacen desde el panel de Vimeo, no desde parámetros de URL.

---

## ✅ Checklist de Configuración

- [ ] Acceder a configuración de embed predeterminada
- [ ] Ocultar branding de Vimeo (si es posible)
- [ ] Personalizar colores del reproductor
- [ ] Desactivar compartir
- [ ] Desactivar like/suscribirse
- [ ] Ocultar detalles del video (título, descripción, autor)
- [ ] Mantener controles de reproducción activos
- [ ] Crear preset "Cursos comoelmusguito"
- [ ] Aplicar preset a videos existentes (opcional)
- [ ] Verificar en localhost
- [ ] Verificar en producción

---

## 📚 Referencias

- [Cómo personalizar el reproductor embebido - Vimeo Help](https://help.vimeo.com/hc/en-us/articles/12426259745937-How-do-I-customize-the-embedded-player)
- [Crear y aplicar presets de apariencia](https://help.vimeo.com/hc/en-us/articles/12426259745937-How-do-I-customize-the-embedded-player#create-preset)
- [Opciones de personalización del reproductor](https://help.vimeo.com/hc/en-us/articles/12426259745937-How-do-I-customize-the-embedded-player#customization-options)

---

## 💡 Tips Adicionales

1. **Prueba en diferentes dispositivos**
   - El reproductor se adapta automáticamente en móviles
   - Algunos elementos pueden ocultarse en pantallas pequeñas (<375px)

2. **Mantén consistencia**
   - Usa el mismo preset para todos los videos de cursos
   - Esto crea una experiencia uniforme

3. **No exageres**
   - Mantén los controles esenciales visibles
   - No ocultes funciones que los estudiantes necesitan (velocidad, subtítulos)

4. **Actualiza cuando cambies de marca**
   - Si cambias colores de marca, actualiza el preset
   - Los cambios se aplican automáticamente a todos los videos

