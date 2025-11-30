# Videos Hero

## Archivo Principal

**Nombre:** `hero-main.mp4`

**Especificaciones:**
- Resolución: 1920x1080
- Peso máximo: 5 MB (ideal 2-3 MB)
- Duración: 10-20 segundos
- FPS: 30
- Formato: MP4 (H.264)
- Sin audio

**Contenido sugerido:**
- Close-up de musgo con gotas de agua
- Macro de terrario con condensación
- Timelapse sutil de plantas

**Optimizar con:**
```bash
ffmpeg -i tu-video.mp4 \
  -c:v libx264 -crf 28 -preset slow \
  -vf "scale=1920:1080" -r 30 -an \
  -movflags +faststart \
  hero-main.mp4
```

