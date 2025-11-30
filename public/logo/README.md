# 🌿 Logo - comoelmusguito

## Archivos Necesarios

### 1. Logo Principal (SVG)
**Nombre:** `logo.svg`
- **Formato:** SVG (vectorial)
- **Uso:** Header, Footer, navegación
- **Tamaño:** Flexible (SVG se adapta)
- **Recomendación:** Incluir texto "comoelmusguito" o solo símbolo

### 2. Logo Solo Símbolo (Opcional)
**Nombre:** `logo-icon.svg`
- **Uso:** Favicon, apps móviles, espacios pequeños
- **Contenido:** Solo el ícono sin texto

### 3. Logo Horizontal (Opcional)
**Nombre:** `logo-horizontal.svg`
- **Uso:** Footer amplio, banners
- **Layout:** Logo + texto en horizontal

### 4. Logo Vertical (Opcional)
**Nombre:** `logo-vertical.svg`
- **Uso:** Espacios estrechos
- **Layout:** Logo arriba, texto abajo

---

## Especificaciones Técnicas

### SVG Optimizado
```xml
<!-- Asegúrate de que tenga viewBox -->
<svg viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
  <!-- Tu logo aquí -->
</svg>
```

### Colores del Logo
Usa las variables del sistema de diseño:
- Verde principal: `#4A7C59` (musgo)
- Verde secundario: `#86A789` (vida)
- Café tierra: `#8B7355` (tierra)
- Crema: `#F5F1E8` (cream)

### Optimización
Antes de subir, optimiza con:
- **SVGOMG:** https://jakearchibald.github.io/svgomg/
- Quita metadatos innecesarios
- Simplifica paths
- Target: <10KB

---

## Cómo Usar

### En Componentes
```typescript
import Image from 'next/image';

<Image 
  src="/logo/logo.svg" 
  alt="comoelmusguito"
  width={150}
  height={40}
/>
```

### Como Background
```tsx
<div 
  style={{ backgroundImage: 'url(/logo/logo.svg)' }}
  className="w-40 h-10"
/>
```

---

## Favicon

Para generar favicon desde el logo:
1. Usa: https://realfavicongenerator.net/
2. Sube tu `logo-icon.svg`
3. Descarga el pack completo
4. Coloca en `/public/` (raíz)

Archivos que generará:
- `favicon.ico`
- `apple-touch-icon.png`
- `favicon-32x32.png`
- `favicon-16x16.png`

---

## Checklist

- [ ] `logo.svg` - Logo principal
- [ ] `logo-icon.svg` - Solo ícono (opcional)
- [ ] Optimizado con SVGOMG
- [ ] viewBox definido
- [ ] Colores correctos
- [ ] Tamaño <10KB

Cuando lo tengas, avísame para actualizar Header y Footer! 🌿

