# Videos Hero

## Archivo Principal

**Nombre:** `hero-main.mp4`

**Especificaciones:**
- Resolución: 1280x720 (se ve fullscreen vía `object-cover`; queda cubierto por overlay oscuro, no necesita 1080p)
- Peso máximo: ~3 MB
- Duración: 10-20 segundos
- FPS: original (no forzar fps bajo, se nota en footage con movimiento)
- Formato: MP4 (H.264)
- Sin audio

**Contenido sugerido:**
- Close-up de musgo con gotas de agua
- Macro de terrario con condensación
- Timelapse sutil de plantas

**Optimizar con:**
```bash
ffmpeg -i tu-video.mp4 \
  -vf "hqdn3d=4:3:6:4,scale=1280:-2" -c:v libx264 -crf 30 -preset slow \
  -profile:v high -pix_fmt yuv420p -an \
  -movflags +faststart \
  hero-main.mp4
```

El filtro `hqdn3d` (denoise) es clave: el footage macro suele traer bastante grano de sensor, que es carísimo de codificar y no aporta nada visualmente. Quitarlo antes de comprimir permite mantener más resolución/nitidez real por el mismo peso. Sin denoise, para llegar a un tamaño razonable hay que sacrificar mucha más resolución (probado: 720p sin denoise a CRF28 pesaba 3.4MB y se veía peor que 720p con denoise a CRF30 pesando 2.7MB).

> Nota (jul 2026): el video se bajó de 1920x1080/4.6MB a 1280x720/2.7MB (con denoise) para reducir el consumo de Fast Data Transfer de Vercel — era el 99.9% del tráfico saliente del proyecto. Se probó también bajar a 960x540 (1.5-1.8MB) y AV1 (peor resultado que H.264 para este footage grano-so con presets rápidos), pero 720p+denoise dio el mejor balance nitidez/peso. Ver también los headers de cache en `next.config.ts` para `/videos` y `/images`.

