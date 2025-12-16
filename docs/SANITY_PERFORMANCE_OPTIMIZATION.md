# 🚀 Optimización de Rendimiento de Sanity Studio

## Problema Común

En dispositivos con menos recursos (Macs antiguos, poca RAM, procesadores lentos), Sanity Studio puede experimentar:
- **Lag al escribir**: Se queda pegado cada vez que se presiona una tecla
- **Carga lenta**: Tarda mucho en cargar productos/documentos
- **Autoguardado muy frecuente**: Guarda en cada tecla, causando bloqueos

## ✅ Soluciones Disponibles

### 1. Actualizar Sanity Studio a la Última Versión

**Problema**: Sanity Studio v4.19 no tiene configuración directa para el debounce del autoguardado, pero las versiones más recientes incluyen mejoras de rendimiento.

**Solución**: Actualizar a la última versión:

```bash
npm install sanity@latest
npm install next-sanity@latest
```

**Efecto**: 
- ✅ Mejoras de rendimiento incluidas en versiones recientes
- ✅ Optimizaciones del autoguardado
- ✅ Mejor manejo de recursos

**Nota**: Después de actualizar, reiniciar el servidor de desarrollo.

---

## 🔧 Optimizaciones Adicionales Recomendadas

### 2. Optimizar el Navegador

**Para el cliente con Mac antiguo:**

1. **Usar Chrome o Firefox** (evitar Safari si es muy antiguo)
2. **Cerrar otras pestañas** mientras usa Sanity Studio
3. **Deshabilitar extensiones** del navegador que consuman recursos
4. **Limpiar caché** del navegador regularmente

### 3. Optimizar la Red

**Problemas de red pueden causar lentitud:**

- ✅ Usar conexión estable (WiFi o cable)
- ✅ Evitar usar VPN si no es necesario
- ✅ Cerrar otras aplicaciones que usen ancho de banda

### 4. Reducir Cantidad de Documentos Visibles

**Si hay muchos productos/documentos:**

- Usar **filtros** en las listas para ver solo lo necesario
- **Paginación**: No cargar todos los documentos a la vez
- **Búsqueda**: Usar la búsqueda en lugar de scroll infinito

### 5. Optimizar Campos Pesados

**Campos que pueden causar lentitud:**

- **Imágenes grandes**: Comprimir antes de subir
- **Arrays muy largos**: Dividir en secciones más pequeñas
- **Rich text muy extenso**: Considerar dividir en secciones

---

## 🎯 Soluciones Alternativas para Autoguardado

### Opción 1: Usar Modo Borrador

**Estrategia**: Trabajar en modo borrador y publicar solo cuando esté listo.

- ✅ Escribir sin preocuparse del autoguardado constante
- ✅ Publicar manualmente cuando termine
- ✅ Menos presión sobre el sistema

### Opción 2: Deshabilitar Validación en Tiempo Real

**Para campos no críticos**, considerar deshabilitar validación inmediata:

```typescript
// En los schemas, para campos opcionales:
validation: (Rule) => Rule.optional(), // Sin validación estricta
```

### Opción 3: Trabajar en Bloques Pequeños

**Estrategia**: 
- ✅ Completar un campo a la vez
- ✅ Esperar a que guarde antes de continuar
- ✅ Usar "Publish" manualmente cada cierto tiempo

---

## 📊 Monitoreo de Rendimiento

### Verificar si el Problema es del Dispositivo

**Síntomas de dispositivo lento:**
- ✅ Studio funciona bien en otros dispositivos
- ✅ Otras aplicaciones también van lentas
- ✅ El navegador consume mucha RAM/CPU

**Síntomas de red lenta:**
- ✅ Studio carga pero tarda en guardar
- ✅ Las imágenes tardan en subir
- ✅ Funciona mejor en otras redes

**Síntomas de configuración:**
- ✅ Solo pasa al escribir
- ✅ No pasa al navegar
- ✅ Mejora con el debounce aumentado

---

## 🔄 Alternativas de Carga de Datos

### Si la Carga de Productos es Muy Lenta

**Opción 1: Usar API Directa (Solo Lectura)**

Para solo ver/editar productos sin cargar todo el Studio:

```typescript
// Crear una página simple de administración
// que use la API de Sanity directamente
```

**Opción 2: Dividir en Múltiples Datasets**

- `production`: Datos en producción
- `draft`: Borradores y trabajo en progreso

**Opción 3: Usar Sanity CLI para Edición Masiva**

Para cambios masivos, usar scripts en lugar del Studio:

```bash
# Ejemplo: Actualizar precios masivamente
npm run script:update-prices
```

---

## 📝 Checklist para el Cliente

**Antes de usar Sanity Studio:**

- [ ] Cerrar otras aplicaciones pesadas
- [ ] Cerrar pestañas innecesarias del navegador
- [ ] Verificar conexión a internet estable
- [ ] Usar Chrome o Firefox (no Safari antiguo)
- [ ] Limpiar caché del navegador si va muy lento

**Durante el uso:**

- [ ] Esperar 3 segundos después de escribir antes de cambiar de campo
- [ ] Usar filtros para ver solo los documentos necesarios
- [ ] Subir imágenes comprimidas (no muy grandes)
- [ ] Guardar manualmente si es necesario (botón "Publish")

---

## 🆘 Si el Problema Persiste

### Opciones Adicionales:

1. **Actualizar Sanity Studio**:
   ```bash
   npm install sanity@latest
   ```

2. **Verificar versión de Node.js**:
   ```bash
   node --version  # Debe ser 20 o superior
   ```

3. **Limpiar y reinstalar dependencias**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Usar modo de desarrollo optimizado**:
   - Deshabilitar React DevTools
   - Usar modo producción del Studio si es posible

---

## 📚 Referencias

- [Sanity Studio Performance](https://www.sanity.io/docs/studio-performance)
- [Sanity Config API](https://www.sanity.io/docs/studio/config-api-reference)
- [Optimizing Sanity Studio](https://www.sanity.io/docs/studio/optimization)

---

**Última actualización**: Configuración de debounce a 3 segundos implementada.

