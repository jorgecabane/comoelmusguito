# Logo - Como el musguito

Archivos en uso (versión crema, pensada para fondos oscuros):

- `logo-cream.png`: logo completo (caracol + "Como el musguito"), 1800 px de ancho. Lo usan el header, el footer, el hero y la imagen para compartir (OG).
- `snail-cream.png`: solo el caracol, para la señal "Descubre" del hero, la página 404 y como fuente de los íconos.

El caracol del diseño original es una imagen de pixeles (no vectorial), por eso se usan PNG y no SVG. Si el diseño entrega una versión vectorial o de mayor resolución, reemplaza estos archivos manteniendo el nombre y la proporción.

Los favicons (`public/favicon.ico`, `public/favicon.png`, `public/apple-touch-icon.png`) se generan desde `snail-cream.png` con:

```bash
npm run script:generate-favicons
```
