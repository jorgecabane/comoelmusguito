# 🚀 Plan de Mejora de Rendimiento - PageSpeed Insights

## 📊 Estado Actual

Según Vercel Speed Insights:
- **RES Mobile**: 76 (Necesita Mejora)
- **FCP Mobile**: 3.03s (🔴 Malo)
- **LCP Mobile**: 4.18s (🔴 Malo)
- **INP Mobile**: 88ms (✅ Bueno)
- **CLS Mobile**: 0 (✅ Excelente)
- **TTFB Mobile**: 0.75s (✅ Bueno)

**Problemas principales**: FCP y LCP en mobile

---

## 🎯 Plan de Mejora - Mobile (Prioridad Alta)

### 1. Optimización de Imágenes Críticas ⚡

**Problema**: Imágenes hero y thumbnails no están optimizadas para mobile

**Acciones**:
- [ ] Agregar `priority` a imagen hero del home (fallback del video)
- [ ] Reducir calidad de imágenes en mobile (75-80 en lugar de 90)
- [ ] Usar `sizes` más agresivos para mobile
- [ ] Implementar `loading="eager"` solo para above-the-fold
- [ ] Preload imagen hero crítica

**Archivos a modificar**:
- `components/animations/VideoBackground.tsx`
- `components/sections/home/HeroImmersive.tsx`
- `app/cursos/[slug]/page.tsx` (thumbnail del curso)

---

### 2. Optimización de Fuentes 📝

**Estado actual**: ✅ Ya optimizado con `display: "swap"`

**Mejoras adicionales**:
- [ ] Agregar `preload` para fuentes críticas (Playfair Display)
- [ ] Usar `font-display: optional` para fuentes no críticas
- [ ] Considerar subsetting de fuentes (solo caracteres latinos)

**Archivos a modificar**:
- `app/layout.tsx`

---

### 3. Reducir JavaScript Inicial 📦

**Problema**: Muchos componentes se cargan aunque no sean visibles

**Acciones**:
- [ ] Lazy load de `framer-motion` (solo cuando se necesita)
- [ ] Lazy load de `react-player` (solo en páginas de cursos)
- [ ] Code splitting más agresivo para componentes pesados
- [ ] Mover Analytics y Speed Insights a carga diferida

**Archivos a modificar**:
- `app/layout.tsx` (Analytics/Speed Insights)
- `components/ui/VideoPlayer.tsx`
- `components/animations/*` (FadeIn, ParallaxSection, etc.)

---

### 4. Optimización de Video Hero 🎥

**Problema**: Video del hero puede bloquear FCP

**Acciones**:
- [ ] ✅ Ya implementado: `preload="none"` y Intersection Observer
- [ ] Considerar usar poster image más pequeña
- [ ] Comprimir video hero (reducir bitrate)
- [ ] Usar formato WebM para mejor compresión

**Archivos a revisar**:
- `components/animations/VideoBackground.tsx`

---

### 5. Preconnect a Dominios Externos 🔗

**Problema**: No hay preconnect a CDNs y servicios externos

**Acciones**:
- [ ] Agregar `preconnect` a `cdn.sanity.io`
- [ ] Agregar `preconnect` a `fonts.googleapis.com`
- [ ] Agregar `dns-prefetch` a servicios no críticos

**Archivos a modificar**:
- `app/layout.tsx` (en `<head>`)

---

### 6. Optimización de Third-Party Scripts 🎯

**Problema**: reCAPTCHA y Analytics cargan inmediatamente

**Acciones**:
- [ ] Cargar reCAPTCHA solo cuando se necesita (formularios)
- [ ] Diferir carga de Analytics (después de FCP)
- [ ] Usar `loading="lazy"` para scripts no críticos

**Archivos a modificar**:
- `components/auth/RecaptchaProvider.tsx`
- `app/layout.tsx`

---

### 7. Mejorar Critical CSS 🎨

**Problema**: CSS completo se carga antes de render

**Acciones**:
- [ ] Inline critical CSS para above-the-fold
- [ ] Diferir CSS no crítico
- [ ] Reducir tamaño de `globals.css` (eliminar CSS no usado)

**Archivos a modificar**:
- `app/globals.css`
- `app/layout.tsx`

---

### 8. Optimización de Sanity Queries 📡

**Problema**: Múltiples queries pueden bloquear render

**Acciones**:
- [ ] Combinar queries cuando sea posible
- [ ] Usar `revalidate` más agresivo (ISR)
- [ ] Cachear respuestas de Sanity en edge

**Archivos a revisar**:
- `app/page.tsx`
- `lib/sanity/fetch.ts`

---

## 🖥️ Plan de Mejora - Desktop (Prioridad Media)

### 1. Optimización de Imágenes para Desktop

**Acciones**:
- [ ] Usar `srcset` para diferentes resoluciones
- [ ] Implementar lazy loading para imágenes below-the-fold
- [ ] Optimizar formatos (AVIF > WebP > JPEG)

---

### 2. Code Splitting por Ruta

**Acciones**:
- [ ] Lazy load de páginas completas (talleres, terrarios)
- [ ] Prefetch de rutas probables (hover en links)

---

### 3. Service Worker (PWA)

**Acciones**:
- [ ] Implementar service worker para cache
- [ ] Cachear assets estáticos
- [ ] Offline fallback

---

## 📋 Checklist de Implementación

### Fase 1: Quick Wins ✅ COMPLETADO
- [x] Preconnect a CDNs
- [x] Preload imagen hero
- [x] Diferir Analytics/Speed Insights (ya optimizados por Vercel)
- [x] Optimizar calidad de imágenes mobile (75-80)

### Fase 2: Optimizaciones Medias ✅ COMPLETADO
- [x] Lazy load de reCAPTCHA (solo cuando se necesita)
- [x] Optimizar calidad de imágenes hero
- [x] Code splitting de componentes below the fold (home page)
- [x] Lazy load de VideoPlayer en páginas de curso

### Fase 3: Optimizaciones Avanzadas ⚠️ REQUIERE ANÁLISIS
**Ver documento detallado**: `docs/PHASE3_CACHING_ANALYSIS.md`

**Resumen**:
- ⚠️ **Service Worker**: NO recomendado ahora (riesgo de datos obsoletos)
- ✅ **Edge Caching**: Sí, con cuidado (TTLs cortos, excluir contenido crítico)
- ✅ **Subsetting de fuentes**: Ya optimizado por Next.js
- ⏸️ **Critical CSS**: Evaluar después de Fase 2

**⚠️ IMPORTANTE**: La Fase 3 requiere testing extensivo antes de implementar, especialmente el caching.

---

## 🎯 Métricas Objetivo

### Mobile
- **FCP**: < 1.8s (actual: 3.03s) → **Mejora: 40%**
- **LCP**: < 2.5s (actual: 4.18s) → **Mejora: 40%**
- **RES**: > 90 (actual: 76) → **Mejora: 18%**

### Desktop
- **FCP**: < 1.2s
- **LCP**: < 2.0s
- **RES**: > 95

---

## 📝 Notas

- Todas las optimizaciones deben probarse en producción
- Monitorear métricas después de cada cambio
- Usar Vercel Speed Insights para tracking continuo
- Considerar A/B testing para cambios grandes
