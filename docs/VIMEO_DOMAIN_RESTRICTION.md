# 🔒 Configuración de Restricción de Dominios en Vimeo

Esta guía explica cómo configurar Vimeo para que los videos solo se puedan ver desde dominios específicos.

## 📋 Dominios Permitidos

- `localhost:3000` (desarrollo local)
- `comoelmusguito.vercel.app` (preview de Vercel)
- `comoelmusguito.cl` (producción)

---

## 🎯 Configuración en Vimeo

### Opción 1: Configuración Global (Recomendada)

Esta configuración aplica a todos los videos de tu cuenta:

1. **Accede a tu cuenta de Vimeo**
   - Ve a [vimeo.com](https://vimeo.com) e inicia sesión
   - Asegúrate de tener un plan **Starter** o superior (requerido para restricción de dominios)

2. **Ve a Configuración de la Cuenta**
   - Haz clic en tu avatar (esquina superior derecha)
   - Selecciona **Settings** (Configuración)
   - En el menú lateral, ve a **Privacy** (Privacidad)

3. **Configura Embed Settings**
   - Busca la sección **"Embed settings"** o **"Where can this be embedded?"**
   - Selecciona **"Only on specific domains"** o **"Only on sites I choose"**
   - Agrega los siguientes dominios:
     ```
     localhost:3000
     comoelmusguito.vercel.app
     comoelmusguito.cl
     ```
   - **Importante**: Para `localhost:3000`, Vimeo puede requerir que lo agregues como `localhost` o `127.0.0.1:3000`. Prueba ambas variantes si una no funciona.

4. **Guarda los cambios**

### Opción 2: Configuración por Video (Más Granular)

Si prefieres configurar cada video individualmente:

1. **Ve al video en Vimeo**
   - Abre el video que quieres configurar
   - Haz clic en el botón **Settings** (⚙️) o **Edit** (✏️)

2. **Configuración de Privacidad**
   - Ve a la pestaña **Privacy** (Privacidad)
   - En **"¿Quiénes pueden ver sus videos, eventos y presentaciones?"**, tienes estas opciones:
     
     **🎯 RECOMENDADO PARA CURSOS: "Sin listar"**
     - ✅ El video solo se puede ver con el link (no aparece en búsquedas de Vimeo)
     - ✅ Funciona perfectamente con restricción de dominio
     - ✅ Permite embedding en tus dominios configurados
     - ✅ No requiere contraseña adicional
     
     **🔒 ALTERNATIVA MÁS RESTRICTIVA: "Privado"**
     - ✅ Solo accesible con link privado único
     - ✅ Máxima seguridad
     - ✅ Funciona con restricción de dominio
     - ⚠️ Puede requerir configuración adicional
     
     **❌ NO RECOMENDADO:**
     - **"Público"**: Cualquiera puede verlo (no sirve para cursos)
     - **"Contraseña"**: Requiere que el usuario ingrese contraseña (mala UX)
     
     **💡 MEJOR OPCIÓN: "Sin listar" + "Ocultar de Vimeo"**
     - Selecciona **"Sin listar"**
     - Activa también **"Ocultar de Vimeo"** (si está disponible)
     - Esto asegura que el video no aparezca en ninguna búsqueda pública

3. **Configuración de Embed**
   - En la misma sección, busca **"Where can this be embedded?"**
   - Selecciona **"Only on specific domains"**
   - Agrega los dominios:
     ```
     localhost:3000
     comoelmusguito.vercel.app
     comoelmusguito.cl
     ```

4. **Configuración de Embed (Restricción de Dominios)**
   - Busca la sección **"¿Dónde se puede insertar este video?"** o **"Where can this be embedded?"**
   - Selecciona **"Solo en dominios específicos"** o **"Only on specific domains"**
   - Agrega los dominios permitidos (presiona Enter después de cada uno):
     ```
     localhost:3000
     comoelmusguito.vercel.app
     comoelmusguito.cl
     ```

5. **Otras Configuraciones Importantes**
   - ✅ **Desactivar descarga**: Busca "Permitir descarga" y desactívala
   - ✅ **Desactivar compartir**: Desactiva "Permitir compartir" si quieres más control
   - ✅ **Ocultar de Vimeo**: Si seleccionaste "Sin listar", también activa "Ocultar de Vimeo" para máxima privacidad

5. **Guarda los cambios**

---

## 🔍 Verificación de la Configuración

### 1. Verificar en Vimeo

Después de configurar, verifica que los dominios estén correctamente listados:

1. Ve a **Settings → Privacy**
2. Revisa la lista de dominios permitidos
3. Asegúrate de que los 3 dominios estén presentes

### 2. Probar en Localhost

1. Inicia tu servidor de desarrollo: `npm run dev`
2. Abre `http://localhost:3000` en tu navegador
3. Intenta reproducir un video de Vimeo
4. **Si funciona**: ✅ La configuración está correcta
5. **Si no funciona**: 
   - Verifica que el dominio esté exactamente como `localhost:3000` (con el puerto)
   - O prueba agregar solo `localhost` (sin puerto) y verifica que funcione

### 3. Probar en Vercel Preview

1. Haz un deploy a Vercel
2. Abre la URL de preview: `https://comoelmusguito.vercel.app`
3. Intenta reproducir un video
4. **Si funciona**: ✅ La configuración está correcta

### 4. Probar en Producción

1. Abre `https://comoelmusguito.cl`
2. Intenta reproducir un video
3. **Si funciona**: ✅ Todo está configurado correctamente

---

## ⚠️ Problemas Comunes y Soluciones

### Problema 1: "This video cannot be played on this domain"

**Causa**: El dominio no está en la lista de dominios permitidos.

**Solución**:
1. Verifica que el dominio esté exactamente como aparece en la URL del navegador
2. Para localhost, asegúrate de incluir el puerto: `localhost:3000`
3. Para Vercel, usa el dominio exacto: `comoelmusguito.vercel.app` (sin `www`)

### Problema 2: Funciona en producción pero no en localhost

**Causa**: Vimeo puede tener problemas con `localhost` en algunos casos.

**Solución**:
1. Prueba agregar `127.0.0.1:3000` además de `localhost:3000`
2. O usa un dominio local como `local.comoelmusguito.cl` (requiere configuración de hosts)

### Problema 3: Funciona en localhost pero no en Vercel

**Causa**: El dominio de Vercel puede variar (cada preview tiene un hash único).

**Solución**:
1. Agrega un dominio genérico: `*.vercel.app` (si Vimeo lo permite)
2. O agrega cada preview manualmente cuando lo necesites
3. Alternativa: Usa solo `comoelmusguito.vercel.app` para previews principales

### Problema 4: El video se ve pero muestra un mensaje de error

**Causa**: Puede ser un problema de privacidad del video, no de dominio.

**Solución**:
1. Verifica que el video tenga la privacidad configurada como "Only people with the private link"
2. Asegúrate de usar la URL privada del video (no la URL pública)

---

## 📝 Notas Importantes

### Sobre localhost

- Vimeo puede tener limitaciones con `localhost` en algunos navegadores
- Si tienes problemas, considera usar un dominio local con configuración de hosts:
  ```
  # En /etc/hosts (Mac/Linux) o C:\Windows\System32\drivers\etc\hosts (Windows)
  127.0.0.1 local.comoelmusguito.cl
  ```
- Luego agrega `local.comoelmusguito.cl` a la lista de dominios permitidos

### Sobre Vercel Previews

- Cada pull request en Vercel genera un preview único (ej: `comoelmusguito-git-branch-username.vercel.app`)
- Si necesitas probar en todos los previews, considera usar un dominio genérico `*.vercel.app` (si está disponible)
- O agrega solo el preview principal: `comoelmusguito.vercel.app`

### Sobre Producción

- Asegúrate de que `comoelmusguito.cl` esté en la lista
- Si usas `www.comoelmusguito.cl`, agrégalo también
- Vimeo distingue entre `comoelmusguito.cl` y `www.comoelmusguito.cl`

---

## 🔄 Actualizar Dominios Existentes

Si ya tienes videos configurados y quieres actualizar los dominios:

1. **Opción A: Actualizar configuración global**
   - Ve a Settings → Privacy
   - Actualiza la lista de dominios
   - Los cambios aplicarán a todos los videos (si usaste configuración global)

2. **Opción B: Actualizar videos individuales**
   - Abre cada video
   - Ve a Settings → Privacy
   - Actualiza los dominios permitidos
   - Guarda los cambios

---

## ✅ Checklist de Configuración

- [ ] Tienes un plan Vimeo Starter o superior
- [ ] Has agregado `localhost:3000` a los dominios permitidos
- [ ] Has agregado `comoelmusguito.vercel.app` a los dominios permitidos
- [ ] Has agregado `comoelmusguito.cl` a los dominios permitidos
- [ ] Has probado que funciona en localhost
- [ ] Has probado que funciona en Vercel preview
- [ ] Has probado que funciona en producción
- [ ] Has desactivado la descarga de videos
- [ ] Has configurado la privacidad como "Only people with the private link"

---

## 🆘 Soporte

Si después de seguir esta guía sigues teniendo problemas:

1. Verifica que tu plan de Vimeo incluya restricción de dominios (Starter+)
2. Revisa la consola del navegador para ver errores específicos
3. Contacta al soporte de Vimeo si el problema persiste

---

## 📚 Referencias

- [Formato de URL para Videos](./VIMEO_URL_FORMAT.md) - Qué URL usar al agregar videos en Sanity
- [Guía de Privacidad para Cursos](./VIMEO_PRIVACY_GUIDE.md) - Explica qué opción de privacidad elegir
- [Personalización del Reproductor Embebido](./VIMEO_EMBED_CUSTOMIZATION.md) - Cómo personalizar la apariencia del reproductor
- [Vimeo Privacy Settings](https://help.vimeo.com/hc/en-us/articles/12426260232977-Understanding-video-privacy-settings)
- [Vimeo Embed Restrictions](https://help.vimeo.com/hc/en-us/articles/224817847-Setting-up-privacy-settings-for-your-videos)

