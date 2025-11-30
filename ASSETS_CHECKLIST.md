# ✅ Checklist de Assets - comoelmusguito

## 🎯 PRIORIDAD ALTA (Para que funcione MVP)

### Videos (1 archivo)
- [ ] **`public/videos/hero/hero-main.mp4`**
  - Peso: 2-5 MB máximo
  - Resolución: 1920x1080
  - Duración: 10-20 segundos
  - Sin audio
  - **Contenido:** Macro de musgo con gotas de agua, terrario con condensación

---

### Imágenes Críticas (11 archivos)

#### Hero Fallback (1)
- [ ] **`public/images/hero/hero-fallback.jpg`**
  - Tamaño: 1080x1920 (vertical)
  - Peso: <200KB
  - **Contenido:** Misma temática que video hero

#### Tomás (1)
- [ ] **`public/images/about/tomas-portrait.jpg`**
  - Tamaño: 1200x1600 (3:4)
  - Peso: <300KB
  - **Contenido:** Foto de Tomás en su taller o con terrarios

#### Proceso (4)
- [ ] **`public/images/process/proceso-01-recoleccion.jpg`**
  - Tamaño: 1600x1200 (4:3)
  - **Contenido:** Recolectando musgo en bosque
  
- [ ] **`public/images/process/proceso-02-cultivo.jpg`**
  - Tamaño: 1600x1200 (4:3)
  - **Contenido:** Musgo creciendo en taller
  
- [ ] **`public/images/process/proceso-03-diseño.jpg`**
  - Tamaño: 1600x1200 (4:3)
  - **Contenido:** Manos construyendo terrario
  
- [ ] **`public/images/process/proceso-04-vida.jpg`**
  - Tamaño: 1600x1200 (4:3)
  - **Contenido:** Terrario terminado con vida

#### Terrarios (5+ archivos mínimo)
Mínimo 2 fotos por terrario, 3 terrarios diferentes:

- [ ] **`public/images/terrarios/terrario-01-01.jpg`**
- [ ] **`public/images/terrarios/terrario-01-02.jpg`**
- [ ] **`public/images/terrarios/terrario-02-01.jpg`**
- [ ] **`public/images/terrarios/terrario-02-02.jpg`**
- [ ] **`public/images/terrarios/terrario-03-01.jpg`**

Especificaciones:
  - Tamaño: 2000x2000 (cuadrado)
  - Peso: <300KB cada una
  - **Nombres sugeridos:** 
    - `terrario-bosque-nublado-01.jpg`
    - `terrario-desertico-01.jpg`
    - `terrario-tropical-01.jpg`

---

## 🎯 PRIORIDAD MEDIA (Para experiencia completa)

### Cursos (3 archivos)
- [ ] **`public/images/cursos/terrarios-desde-cero-thumbnail.jpg`**
- [ ] **`public/images/cursos/curso-avanzado-thumbnail.jpg`**
- [ ] **`public/images/cursos/curso-mantenimiento-thumbnail.jpg`**

Especificaciones:
  - Tamaño: 1920x1080 (16:9)
  - Peso: <250KB
  - **Contenido:** Thumbnail del curso con texto visible

### SEO - Open Graph (2 archivos)
- [ ] **`public/images/og/home.jpg`**
  - Tamaño: **1200x630 EXACTO**
  - Peso: <200KB
  - **Contenido:** Logo + terrario + tagline

- [ ] **`public/images/og/default.jpg`**
  - Igual que home.jpg (puede ser el mismo archivo)

---

## 🎯 PRIORIDAD BAJA (Para pulir)

### Comunidad (2-3 archivos)
- [ ] `public/images/community/estudiante-01.jpg`
- [ ] `public/images/community/estudiante-02.jpg`
- [ ] `public/images/community/taller-01.jpg`

Especificaciones:
  - Tamaño: 1080x1080 (cuadrado)
  - Peso: <200KB

---

## 📊 Resumen Total

```
✅ ALTA:      12 archivos (1 video + 11 imágenes)
🔸 MEDIA:      5 archivos (3 cursos + 2 OG)
🔹 BAJA:       3 archivos (comunidad)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TOTAL:     20 archivos para MVP completo
```

---

## 🛠️ Pasos Siguientes

### 1. Prepara los Assets
Usa las especificaciones de cada archivo

### 2. Optimiza
- **Imágenes:** TinyPNG o Squoosh
- **Video:** HandBrake o FFmpeg

### 3. Renombra
Usa nombres descriptivos con guiones

### 4. Coloca en Carpetas
```bash
public/
├── videos/hero/hero-main.mp4
├── images/
│   ├── hero/hero-fallback.jpg
│   ├── about/tomas-portrait.png
│   ├── process/proceso-01-recoleccion.jpg
│   ├── process/proceso-02-cultivo.jpg
│   ├── process/proceso-03-diseño.jpg
│   ├── process/proceso-04-vida.jpg
│   └── terrarios/...
```

### 5. Avísame
Te ayudaré a actualizar los componentes para usar tus assets reales

---

## 📐 Guía Rápida de Tamaños

| Asset | Tamaño | Peso |
|-------|--------|------|
| Video hero | 1920x1080 | 2-5 MB |
| Hero fallback | 1080x1920 | <200KB |
| Tomás portrait | 1200x1600 | <300KB |
| Proceso (4) | 1600x1200 | <300KB |
| Terrarios | 2000x2000 | <300KB |
| Cursos | 1920x1080 | <250KB |
| Open Graph | 1200x630 | <200KB |

---

## 🎥 Optimización de Video Hero

### Opción 1: HandBrake (Recomendado - GUI)
1. Abrir tu video
2. Preset: "Web" → "Gmail Medium 5 Minutes 720p30"
3. Cambiar resolution a: 1920x1080
4. Format: MP4
5. Framerate: 30 fps constant
6. Audio: Remove
7. Save as: `hero-main.mp4`

### Opción 2: FFmpeg (Terminal)
```bash
ffmpeg -i tu-video-original.mp4 \
  -c:v libx264 \
  -crf 28 \
  -preset slow \
  -vf "scale=1920:1080" \
  -r 30 \
  -an \
  -movflags +faststart \
  public/videos/hero/hero-main.mp4
```

### Opción 3: CloudConvert (Online)
1. https://cloudconvert.com/mp4-to-mp4
2. Upload tu video
3. Settings:
   - Video Codec: H.264
   - Resolution: 1920x1080
   - Bitrate: 2000 kbps
   - FPS: 30
   - Remove Audio
4. Convert y descargar

---

## ✅ Cuando Tengas Todo

**Avísame con:**
1. ¿Qué archivos ya tienes listos?
2. ¿En qué carpeta los guardaste?
3. ¿Cómo los nombraste?

Y te ayudaré a:
- ✅ Actualizar los componentes
- ✅ Verificar que se vean perfectos
- ✅ Optimizar si es necesario
- ✅ Hacer ajustes finales

---

📖 **Guía completa:** `/docs/ASSETS_GUIDE.md`
