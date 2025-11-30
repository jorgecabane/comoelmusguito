# 📦 Guía de Assets - comoelmusguito

Esta guía te ayuda a organizar y optimizar todas las imágenes y videos del proyecto.

---

## 📁 Estructura de Carpetas

```
public/
├── images/
│   ├── hero/              # Backgrounds del hero principal
│   ├── terrarios/         # Fotos de terrarios productos
│   ├── cursos/            # Thumbnails de cursos
│   ├── talleres/          # Fotos de talleres presenciales
│   ├── process/           # 4 fotos del proceso artesanal
│   ├── community/         # Comunidad, testimonios, estudiantes
│   ├── about/             # Fotos de Tomás y su taller
│   └── og/                # Open Graph para redes sociales
│
├── videos/
│   ├── hero/              # Video del hero principal
│   ├── process/           # Videos del proceso (opcional)
│   └── products/          # Videos de terrarios (hover states)
│
└── fonts/                 # Fuentes custom (si es necesario)
```

---

## 🎥 VIDEOS

### 📹 Hero Principal (`/videos/hero/`)

**Archivo necesario:**
```
hero-main.mp4
```

**Especificaciones:**
- ✅ Resolución: 1920x1080 (Full HD)
- ✅ Peso: **2-5 MB máximo**
- ✅ Duración: 10-20 segundos (loop perfecto)
- ✅ Formato: MP4 (H.264)
- ✅ FPS: 24-30
- ✅ Bitrate: 2-3 Mbps
- ✅ Audio: Ninguno (muted)

**Optimización con FFmpeg:**
```bash
ffmpeg -i tu-video.mp4 \
  -c:v libx264 \
  -crf 28 \
  -preset slow \
  -vf "scale=1920:1080" \
  -r 30 \
  -an \
  -movflags +faststart \
  public/videos/hero/hero-main.mp4
```

**Alternativa: HandBrake (GUI)**
- Web Optimized: ✅
- Resolution: 1920x1080
- Quality: RF 28
- Framerate: 30 fps constant
- Audio: None

---

### 📹 Videos Proceso (Opcional - Futuro)

**Archivos:**
```
process/recoleccion.mp4
process/cultivo.mp4
process/diseño.mp4
process/vida.mp4
```

**Specs:**
- Peso: <3 MB cada uno
- Duración: 5-10 segundos
- Mismo formato que hero

---

### 📹 Videos Productos (Hover - Futuro)

**Archivos:**
```
products/terrario-bosque-loop.mp4
products/terrario-desierto-loop.mp4
...etc
```

**Specs:**
- Peso: <2 MB cada uno
- Duración: 5-8 segundos loop
- Formato: Cuadrado 1:1 (1080x1080)

---

## 📸 IMÁGENES

### 🖼️ Hero (`/images/hero/`)

**Archivos necesarios:**

1. **Fallback para mobile**
```
hero-fallback.jpg
- Tamaño: 1080x1920 (vertical)
- Peso: <200KB
- Uso: Cuando video no se puede cargar
```

---

### 🌿 Terrarios (`/images/terrarios/`)

**Naming convention:**
```
terrario-{nombre-descriptivo}-{número}.jpg

Ejemplos:
✅ terrario-bosque-nublado-01.jpg
✅ terrario-bosque-nublado-02.jpg
✅ terrario-desertico-01.jpg
✅ terrario-tropical-01.jpg
```

**Especificaciones:**
- Tamaño: 2000x2000 (cuadrado)
- Peso: <300KB
- Formato: JPG o WebP
- Ratio: 1:1 (cuadrado para producto)

**Mínimo por terrario:**
- 2-3 fotos desde diferentes ángulos
- 1 foto close-up de detalle

---

### 🎓 Cursos (`/images/cursos/`)

**Naming:**
```
curso-{nombre}-thumbnail.jpg
curso-{nombre}-preview.jpg

Ejemplos:
✅ curso-terrarios-desde-cero-thumbnail.jpg
✅ curso-avanzado-thumbnail.jpg
```

**Specs:**
- Tamaño: 1920x1080 (16:9)
- Peso: <250KB
- Uso: Thumbnail del curso

---

### 🔨 Proceso (`/images/process/`)

**Archivos necesarios (4 imágenes):**
```
proceso-01-recoleccion.jpg
proceso-02-cultivo.jpg
proceso-03-diseño.jpg
proceso-04-vida.jpg
```

**Specs:**
- Tamaño: 1600x1200 (4:3)
- Peso: <300KB cada una
- Alta calidad (estas son importantes!)

---

### 👨‍🎨 Sobre Tomás (`/images/about/`)

**Archivos necesarios:**

1. **Portrait principal**
```
tomas-portrait.jpg
- Tamaño: 1200x1600 (3:4 vertical)
- Peso: <300KB
- Uso: Sección "Hola, soy Tomás"
```

2. **En el taller**
```
tomas-trabajando.jpg
- Tamaño: 1600x1200 (4:3)
- Peso: <250KB
```

3. **En la naturaleza** (opcional)
```
tomas-recolectando.jpg
- Tamaño: 1600x1200
- Peso: <250KB
```

---

### 🤝 Comunidad (`/images/community/`)

**Archivos:**
```
estudiante-01.jpg
estudiante-02.jpg
testimonio-01.jpg
```

**Specs:**
- Tamaño: 1080x1080 (cuadrado)
- Peso: <200KB
- Uso: Social proof, testimonios

---

### 🔗 Open Graph (`/images/og/`)

**Para SEO y redes sociales**

**Archivos necesarios:**
```
home.jpg           # Para la home
default.jpg        # Fallback general
terrarios.jpg      # Para /terrarios
cursos.jpg         # Para /cursos
```

**Specs CRÍTICAS:**
- Tamaño: **1200x630 exacto** (ratio 1.91:1)
- Peso: <200KB
- Formato: JPG
- Texto legible incluso pequeño
- Safe zone: evitar info importante en bordes

**Ejemplo de contenido:**
```
┌─────────────────────────────┐
│ comoelmusguito 🌿           │
│                             │
│ [Imagen de terrario]        │
│                             │
│ Crea Vida en Cualquier      │
│ Lugar                       │
└─────────────────────────────┘
```

---

## 📋 Checklist de Optimización

### Antes de Subir Cualquier Asset

**Imágenes:**
- [ ] Redimensionada al tamaño correcto
- [ ] Comprimida con TinyPNG o Squoosh
- [ ] Nombre descriptivo con guiones
- [ ] <300KB de peso
- [ ] Formato WebP + JPG

**Videos:**
- [ ] Codec H.264 (MP4)
- [ ] Peso <5MB
- [ ] Sin audio
- [ ] Loop perfecto (primer y último frame similares)
- [ ] Optimizado con HandBrake o FFmpeg

---

## 🛠️ Herramientas Recomendadas

### Optimización de Imágenes
1. **TinyPNG** (web): https://tinypng.com
2. **Squoosh** (web): https://squoosh.app
3. **ImageOptim** (Mac app): https://imageoptim.com

### Optimización de Videos
1. **HandBrake** (gratis): https://handbrake.fr
   - Preset: "Web" → "Gmail Medium 5 Minutes 720p30"
   - Cambiar resolution a 1920x1080
   
2. **CloudConvert** (web): https://cloudconvert.com
   - Seleccionar MP4 → MP4
   - Custom settings: H.264, 30fps, 2Mbps

3. **FFmpeg** (comando):
   ```bash
   # Instalar: brew install ffmpeg
   # Optimizar:
   ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset slow -an output.mp4
   ```

### Conversión a WebP
```bash
# Para convertir JPG → WebP
ffmpeg -i imagen.jpg -quality 85 imagen.webp

# Batch (todas las imágenes)
for file in *.jpg; do
  ffmpeg -i "$file" -quality 85 "${file%.jpg}.webp"
done
```

---

## 📝 Mapeo de Assets a Componentes

### Hero Section
```typescript
// components/sections/home/HeroImmersive.tsx
videoSrc="/videos/hero/hero-main.mp4"
fallbackImage="/images/hero/hero-fallback.jpg"
```

### Artist Section (Tomás)
```typescript
// components/sections/home/ArtistSection.tsx
src="/images/about/tomas-portrait.jpg"
```

### Process Section
```typescript
// components/sections/home/ProcessSection.tsx
images: [
  "/images/process/proceso-01-recoleccion.jpg",
  "/images/process/proceso-02-cultivo.jpg",
  "/images/process/proceso-03-diseño.jpg",
  "/images/process/proceso-04-vida.jpg",
]
```

### Terrarios (Mock Data)
```typescript
// lib/mock/data.ts
images: [
  "/images/terrarios/bosque-nublado-01.jpg",
  "/images/terrarios/bosque-nublado-02.jpg",
]
```

### Cursos
```typescript
// lib/mock/data.ts
thumbnail: "/images/cursos/terrarios-desde-cero-thumbnail.jpg"
```

---

## 🎯 Lista de Prioridades

### ALTA (Para que funcione el MVP)

**Videos:**
- [ ] `videos/hero/hero-main.mp4` - Video hero principal

**Imágenes:**
- [ ] `images/hero/hero-fallback.jpg` - Fallback mobile
- [ ] `images/about/tomas-portrait.jpg` - Foto de Tomás
- [ ] `images/process/proceso-01-recoleccion.jpg`
- [ ] `images/process/proceso-02-cultivo.jpg`
- [ ] `images/process/proceso-03-diseño.jpg`
- [ ] `images/process/proceso-04-vida.jpg`
- [ ] `images/terrarios/` - 6 terrarios (2-3 fotos cada uno)

### MEDIA (Para experiencia completa)

- [ ] `images/cursos/` - Thumbnails de cursos (3 mínimo)
- [ ] `images/og/home.jpg` - Open Graph para SEO
- [ ] `images/community/` - Fotos de comunidad/testimonios

### BAJA (Para polish final)

- [ ] `videos/products/` - Videos hover de terrarios
- [ ] `videos/process/` - Videos del proceso
- [ ] `images/og/` - Resto de OG images
- [ ] `images/talleres/` - Fotos de talleres

---

## 📏 Guía Rápida de Tamaños

| Uso | Tamaño | Ratio | Peso |
|-----|--------|-------|------|
| **Hero video** | 1920x1080 | 16:9 | 2-5 MB |
| **Hero fallback** | 1080x1920 | 9:16 | <200KB |
| **Terrario producto** | 2000x2000 | 1:1 | <300KB |
| **Curso thumbnail** | 1920x1080 | 16:9 | <250KB |
| **Proceso steps** | 1600x1200 | 4:3 | <300KB |
| **Portrait Tomás** | 1200x1600 | 3:4 | <300KB |
| **Open Graph** | 1200x630 | 1.91:1 | <200KB |
| **Community** | 1080x1080 | 1:1 | <200KB |

---

## 🔄 Workflow Recomendado

### 1. Recibir Asset Original
```
Foto de terrario (5MB, 4000x4000)
```

### 2. Editar/Recortar
```
- Corregir color/exposición
- Crop a ratio correcto
- Guardar en alta calidad
```

### 3. Redimensionar
```
- Redimensionar a tamaño objetivo (2000x2000)
```

### 4. Optimizar
```
- Pasar por TinyPNG o Squoosh
- Target: <300KB
- Mantener calidad visual
```

### 5. Nombrar Correctamente
```
terrario-bosque-nublado-01.jpg
```

### 6. Subir a Carpeta Correcta
```
public/images/terrarios/terrario-bosque-nublado-01.jpg
```

### 7. Actualizar Código
```typescript
// lib/mock/data.ts
images: ['/images/terrarios/terrario-bosque-nublado-01.jpg']
```

---

## 💾 Naming Convention

### Reglas

✅ **Minúsculas** - todo en lowercase
✅ **Guiones** - separar palabras con `-`
✅ **Descriptivo** - que se entienda qué es
✅ **Número** - si hay múltiples versiones

❌ **Espacios** - nunca usar espacios
❌ **Caracteres especiales** - evitar `á`, `é`, `ñ`, etc.
❌ **Mayúsculas** - no usar
❌ **Genérico** - evitar `photo1.jpg`

### Ejemplos

```
✅ terrario-bosque-nublado-01.jpg
✅ tomas-portrait-taller.jpg
✅ proceso-recoleccion-musgo.jpg
✅ curso-desde-cero-thumbnail.jpg
✅ og-home-main.jpg

❌ IMG_1234.jpg
❌ Terrario Bosque.jpg
❌ foto tomas.jpg
❌ musguitoTerrarium.jpg
❌ photo (1).jpg
```

---

## 🎨 Tips de Fotografía de Productos

### Terrarios

**Lighting:**
- Luz natural indirecta (cerca de ventana)
- Evitar luz directa del sol
- Hora dorada (mañana temprano o tarde)

**Composición:**
- Ángulo: 45° o frontal
- Fondo: blanco, crema o madera natural
- Dejar espacio alrededor (no crop apretado)

**Múltiples ángulos:**
1. Frontal completo
2. 45° mostrando profundidad
3. Close-up de detalle (musgo, plantas)
4. Top-down (vista desde arriba)

---

## 📐 Quick Reference

```bash
# Ubicación del proyecto
/Users/cabane/Documents/dev/personal/comoelmusguito/public/

# Carpetas creadas:
public/
├── images/hero/
├── images/terrarios/
├── images/cursos/
├── images/talleres/
├── images/process/
├── images/community/
├── images/about/
├── images/og/
├── videos/hero/
├── videos/process/
└── videos/products/
```

---

## ✅ Checklist - Assets para MVP

### Antes de Lanzar

**Videos (1):**
- [ ] Video hero principal (<5MB)

**Imágenes Críticas (11):**
- [ ] Hero fallback mobile
- [ ] Foto Tomás portrait
- [ ] 4 fotos del proceso
- [ ] 6 fotos de terrarios (mínimo)

**Imágenes Secundarias (5):**
- [ ] 3 thumbnails de cursos
- [ ] 2 fotos de comunidad

**SEO (2):**
- [ ] OG image home
- [ ] OG image default

**TOTAL: 19 assets para MVP funcional**

---

## 🚀 Cuando Tengas los Assets

Avísame y te ayudaré a:
1. Optimizarlos (si no están ya)
2. Actualizar los paths en el código
3. Reemplazar placeholders de Unsplash
4. Verificar que todo se vea perfecto

---

**Última actualización:** Noviembre 2025

