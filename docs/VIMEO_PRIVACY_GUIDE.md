# 🔒 Guía de Configuración de Privacidad en Vimeo para Cursos

Esta guía explica qué opción de privacidad elegir en Vimeo para tus videos de cursos online.

## 📋 Opciones Disponibles en Vimeo

Cuando configuras la privacidad de un video en Vimeo, verás estas opciones:

1. **Sin listar** (Unlisted) ⭐ **RECOMENDADO**
2. **Contraseña** (Password)
3. **Privado** (Private)
4. **Público** (Public)
5. **Ocultar de Vimeo** (Hide from Vimeo)

---

## 🎯 Recomendación para Cursos Online

### **Opción Recomendada: "Sin listar" + Restricción de Dominio**

**¿Por qué "Sin listar"?**

✅ **Ventajas:**
- El video solo se puede ver con el link directo
- No aparece en búsquedas públicas de Vimeo
- No requiere contraseña (mejor experiencia de usuario)
- Funciona perfectamente con restricción de dominio
- Permite embedding en tus dominios configurados
- Los usuarios no necesitan cuenta de Vimeo para verlo

✅ **Cómo funciona:**
1. El video tiene una URL privada única
2. Solo quien tiene el link puede acceder
3. Combinado con restricción de dominio, solo funciona en tu sitio
4. Tu backend controla quién ve el link (usuarios que compraron el curso)

**Configuración recomendada:**
```
Privacidad: "Sin listar"
Restricción de dominio: ✅ Activada (localhost:3000, comoelmusguito.vercel.app, comoelmusguito.cl)
Ocultar de Vimeo: ✅ Activado (opcional, para máxima privacidad)
Permitir descarga: ❌ Desactivado
Permitir compartir: ❌ Desactivado
```

---

## 🔒 Alternativa: "Privado"

**Cuándo usar "Privado":**
- Si quieres máxima seguridad
- Si el contenido es muy sensible
- Si necesitas control adicional

**Ventajas:**
- ✅ Máxima privacidad
- ✅ Solo accesible con link privado único
- ✅ Funciona con restricción de dominio

**Desventajas:**
- ⚠️ Puede requerir configuración adicional
- ⚠️ Algunas funciones pueden estar limitadas

**Nota:** Para cursos online, "Sin listar" suele ser suficiente y más fácil de configurar.

---

## ❌ Opciones NO Recomendadas

### "Público"
- ❌ Cualquiera puede ver el video
- ❌ Aparece en búsquedas de Vimeo
- ❌ No sirve para contenido premium de cursos

### "Contraseña"
- ❌ Requiere que el usuario ingrese contraseña
- ❌ Mala experiencia de usuario
- ❌ No es necesario si ya controlas el acceso en tu backend

---

## 🔐 Configuración Completa Recomendada

Para cada video de curso, configura:

### 1. Privacidad
- **Selecciona:** "Sin listar"
- **Activa:** "Ocultar de Vimeo" (si está disponible)

### 2. Restricción de Dominio
- **Activa:** "Solo en dominios específicos"
- **Agrega:**
  - `localhost:3000`
  - `comoelmusguito.vercel.app`
  - `comoelmusguito.cl`

### 3. Seguridad Adicional
- **Permitir descarga:** ❌ Desactivado
- **Permitir compartir:** ❌ Desactivado
- **Permitir comentarios:** ❌ Desactivado (opcional)

### 4. Control de Acceso
- El control real de quién ve el video lo manejas en tu backend
- Solo usuarios que compraron el curso ven el link del video
- Vimeo valida que el embed esté en el dominio permitido

---

## 🔄 Flujo de Acceso Completo

```
1. Usuario compra curso
   ↓
2. Backend crea courseAccess en Sanity
   ↓
3. Usuario intenta ver lección
   ↓
4. Backend verifica: ¿Usuario compró el curso?
   ├─ NO → Muestra mensaje "Debes comprar el curso"
   └─ SÍ → Muestra el embed de Vimeo
            ↓
5. Vimeo valida: ¿El embed está en dominio permitido?
   ├─ NO → Muestra error "Video no disponible en este dominio"
   └─ SÍ → Reproduce el video
            ↓
6. Usuario ve el video (solo con el link privado)
```

---

## 📝 Comparación Rápida

| Opción | Aparece en búsquedas | Requiere link | Requiere contraseña | Funciona con dominio | Recomendado |
|--------|---------------------|---------------|-------------------|---------------------|-------------|
| **Sin listar** | ❌ No | ✅ Sí | ❌ No | ✅ Sí | ⭐⭐⭐ Sí |
| **Privado** | ❌ No | ✅ Sí | ❌ No | ✅ Sí | ⭐⭐ Tal vez |
| **Contraseña** | ❌ No | ✅ Sí | ✅ Sí | ✅ Sí | ⭐ No |
| **Público** | ✅ Sí | ❌ No | ❌ No | ✅ Sí | ❌ No |
| **Ocultar de Vimeo** | ❌ No | ✅ Sí | ❌ No | ✅ Sí | ⭐⭐ Complemento |

---

## ✅ Checklist de Configuración

Para cada video de curso:

- [ ] Privacidad configurada como **"Sin listar"**
- [ ] **"Ocultar de Vimeo"** activado (opcional pero recomendado)
- [ ] Restricción de dominio configurada con los 3 dominios
- [ ] Descarga desactivada
- [ ] Compartir desactivado
- [ ] URL privada guardada en Sanity (campo `videoUrl`)
- [ ] Probado en localhost
- [ ] Probado en Vercel preview
- [ ] Probado en producción

---

## 🆘 Preguntas Frecuentes

### ¿"Sin listar" es seguro para cursos premium?

**Sí**, porque:
- El video solo se puede ver con el link privado
- La restricción de dominio asegura que solo funcione en tu sitio
- Tu backend controla quién recibe el link
- No aparece en búsquedas públicas

### ¿Debo usar "Privado" en lugar de "Sin listar"?

Para la mayoría de casos, **"Sin listar" es suficiente**. Usa "Privado" solo si:
- El contenido es extremadamente sensible
- Necesitas funciones adicionales de privacidad
- Tu plan de Vimeo lo requiere

### ¿Qué pasa si alguien comparte el link del video?

Si alguien comparte el link:
- El video solo se reproducirá si está en uno de tus dominios permitidos
- Si intentan abrirlo en otro sitio, Vimeo mostrará un error
- El link privado por sí solo no es suficiente sin el dominio correcto

### ¿Puedo cambiar la privacidad después?

**Sí**, puedes cambiar la configuración de privacidad en cualquier momento desde la configuración del video en Vimeo.

---

## 📚 Referencias

- [Guía de Licencias para Cursos](./VIMEO_LICENSE_GUIDE.md) - Explica qué licencia usar (o no usar)
- [Configuración de Privacidad de Vimeo](https://help.vimeo.com/hc/es/articles/12426260232977-Configuraci%C3%B3n-de-privacidad-de-video)
- [Restricción de Dominio en Vimeo](./VIMEO_DOMAIN_RESTRICTION.md)

