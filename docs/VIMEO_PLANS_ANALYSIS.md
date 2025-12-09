# Análisis de Planes de Vimeo para Cursos Online

## 📋 Requisitos del Proyecto

1. ✅ **Videos solo visibles para compradores** - Control de acceso
2. ✅ **No compartir links** - Privacidad y restricción de acceso
3. ✅ **No descargar videos** - Protección de contenido
4. ✅ **Solo ver en el sitio** - Embed restringido a tu dominio

---

## 🔍 Comparación de Planes Vimeo

### Plan Free ($0/mes)
- ❌ **NO SIRVE** - No tiene privacidad a nivel de dominio
- ❌ No permite restringir descargas
- ❌ No permite control de acceso avanzado

### Plan Starter ($12/mes) ⭐ **RECOMENDADO**
- ✅ **Privacidad a nivel de dominio de inserción** - Solo se puede ver en tu sitio
- ✅ **Configuración de la privacidad del video** - Control de acceso
- ✅ **Reproductor personalizable** - Sin branding de Vimeo
- ✅ **URL personalizada** - Links más limpios
- ✅ **2 TB de almacenamiento** - Suficiente para muchos cursos
- ✅ **2 TB de ancho de banda al mes** - Generoso para empezar
- ✅ **Desactivar descarga** - Protección de contenido
- ✅ **Restricción de embed** - Solo en dominios permitidos

**Limitaciones:**
- ❌ No tiene API avanzada para control de acceso por usuario
- ❌ No tiene "Private Links" con contraseña (solo dominio)

**Solución para control de acceso:**
- Usar **"Privacy: Only people with the private link"** + restringir embed a tu dominio
- O usar **"Privacy: Only people I choose"** + restringir embed
- El control de acceso real lo manejas en tu backend (verificar si el usuario compró el curso)

### Plan Standard ($20/mes)
- ✅ Todo lo de Starter +
- ✅ **Compatibilidad con reproductores de terceros** - Más flexibilidad
- ✅ **Marca del reproductor y del video** - Branding completo
- ✅ **4 TB de almacenamiento** - Más espacio

**¿Vale la pena?**
- Solo si necesitas más almacenamiento o branding avanzado
- Para control de acceso, Starter es suficiente

### Plan Advanced ($65/mes)
- ✅ Todo lo de Standard +
- ✅ **Venta de videos individuales On Demand** - Si quieres vender videos individuales
- ✅ **7 TB de almacenamiento** - Mucho espacio
- ✅ **Análisis avanzados** - Métricas detalladas

**¿Vale la pena?**
- Solo si planeas vender videos individuales además de cursos
- Para cursos online, es excesivo

---

## 🎯 Recomendación Final

### **Plan Starter ($12/mes)** es el ideal para tu caso

**Por qué:**
1. ✅ Tiene todas las funciones de privacidad que necesitas
2. ✅ Permite restringir descargas
3. ✅ Permite restringir embed a tu dominio
4. ✅ Precio razonable para empezar
5. ✅ 2 TB de almacenamiento es suficiente para muchos cursos

**Cómo implementar control de acceso:**

1. **Configuración en Vimeo:**
   - Sube el video
   - Configuración → Privacidad → "Only people with the private link"
   - O "Only people I choose" (más seguro)
   - Embed → Restringir a dominios específicos:
     - `localhost:3000` (desarrollo local)
     - `comoelmusguito.vercel.app` (preview de Vercel)
     - `comoelmusguito.cl` (producción)
   - Desactivar descarga: ✅
   
   **📖 Ver guía detallada**: [VIMEO_DOMAIN_RESTRICTION.md](./VIMEO_DOMAIN_RESTRICTION.md)

2. **En tu código:**
   - Verificar que el usuario tenga acceso al curso (ya lo tienes con `hasCourseAccess`)
   - Solo mostrar el video si tiene acceso
   - El embed de Vimeo solo funcionará en tu dominio (gracias a la restricción)

3. **URLs privadas:**
   - Cada video tendrá una URL privada única
   - Guarda esta URL en Sanity (campo `videoUrl` en la lección)
   - Solo usuarios con acceso verán el embed

---

## 🔐 Configuración Recomendada

### Para cada video de curso:

```
Privacidad: "Only people with the private link"
Embed: Permitido solo en comoelmusguito.cl
Descarga: Desactivada
Compartir: Desactivado
```

### Flujo de Acceso:

1. Usuario compra curso → Se crea `courseAccess` en Sanity
2. Usuario intenta ver lección → Backend verifica `hasCourseAccess(userId, courseId)`
3. Si tiene acceso → Se muestra el embed de Vimeo con la URL privada
4. Si no tiene acceso → Se muestra mensaje "Debes comprar el curso"
5. Vimeo valida que el embed esté en el dominio permitido

---

## 💰 Comparación de Costos

| Plan | Precio/mes | Almacenamiento | Ancho de Banda | Funciones Necesarias |
|------|------------|----------------|----------------|----------------------|
| Free | $0 | 1 GB | 2 TB | ❌ No tiene privacidad |
| **Starter** | **$12** | **2 TB** | **2 TB** | ✅ **Todas** |
| Standard | $20 | 4 TB | 2 TB | ✅ Todas + branding |
| Advanced | $65 | 7 TB | 2 TB | ✅ Todas + venta individual |

---

## 🚀 Próximos Pasos

1. **Crear cuenta en Vimeo Starter** ($12/mes)
2. **Configurar dominio permitido**: `comoelmusguito.cl`
3. **Subir videos de prueba** con configuración de privacidad
4. **Integrar URLs privadas** en Sanity
5. **Verificar que el control de acceso funcione** (ya lo tienes implementado)

---

## ⚠️ Consideraciones Adicionales

### Alternativa: Bunny.net Stream
Si el presupuesto es ajustado, Bunny.net Stream ($10-20/mes) también permite:
- Restricción de dominio
- Control de acceso con tokens
- Sin branding
- Más económico para grandes volúmenes

Pero Vimeo Starter es más fácil de configurar y tiene mejor UI.

---

## 📝 Conclusión

**Plan Recomendado: Vimeo Starter ($12/mes)**

Es el plan mínimo necesario que cumple todos tus requisitos:
- ✅ Control de acceso (manejado en tu backend + privacidad de Vimeo)
- ✅ No compartir links (URLs privadas)
- ✅ No descargar (configuración de Vimeo)
- ✅ Solo ver en tu sitio (restricción de embed por dominio)

