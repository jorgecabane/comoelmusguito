/**
 * Script para generar favicons desde logo.svg
 * Ejecutar: npm run script:generate-favicons
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const LOGO_SVG = join(process.cwd(), 'public/logo/logo.svg');
const OUTPUT_DIR = join(process.cwd(), 'public');

async function generateFavicons() {
  try {
    console.log('🎨 Generando favicons desde logo.svg...\n');

    // Leer el SVG
    const svgBuffer = readFileSync(LOGO_SVG);
    
    // 1. favicon.ico (múltiples tamaños: 16x16, 32x32, 48x48)
    console.log('📦 Generando favicon.ico...');
    const favicon16 = await sharp(svgBuffer)
      .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
    
    const favicon32 = await sharp(svgBuffer)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
    
    const favicon48 = await sharp(svgBuffer)
      .resize(48, 48, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();

    // Combinar en un ICO (formato simple)
    // Nota: Para un ICO real necesitarías una librería especializada
    // Por ahora generamos PNGs y el navegador los aceptará
    writeFileSync(join(OUTPUT_DIR, 'favicon.ico'), favicon32);
    console.log('✅ favicon.ico generado (32x32)');

    // 2. favicon.png (192x192 para Android)
    console.log('📱 Generando favicon.png (192x192)...');
    const favicon192 = await sharp(svgBuffer)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
    writeFileSync(join(OUTPUT_DIR, 'favicon.png'), favicon192);
    console.log('✅ favicon.png generado (192x192)');

    // 3. apple-touch-icon.png (180x180 para iOS)
    console.log('🍎 Generando apple-touch-icon.png (180x180)...');
    const appleIcon = await sharp(svgBuffer)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();
    writeFileSync(join(OUTPUT_DIR, 'apple-touch-icon.png'), appleIcon);
    console.log('✅ apple-touch-icon.png generado (180x180)');

    // 4. icon-512.png (512x512 para PWA)
    console.log('📲 Generando icon-512.png (512x512)...');
    const icon512 = await sharp(svgBuffer)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
    writeFileSync(join(OUTPUT_DIR, 'icon-512.png'), icon512);
    console.log('✅ icon-512.png generado (512x512)');

    console.log('\n✨ ¡Todos los favicons generados exitosamente!');
    console.log('\n📝 Archivos creados:');
    console.log('   - public/favicon.ico (32x32)');
    console.log('   - public/favicon.png (192x192)');
    console.log('   - public/apple-touch-icon.png (180x180)');
    console.log('   - public/icon-512.png (512x512)');
    
  } catch (error) {
    console.error('❌ Error generando favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
