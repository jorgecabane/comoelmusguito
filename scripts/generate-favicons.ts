/**
 * Genera los íconos del sitio (favicon, apple-touch, PWA) desde el caracol de marca.
 * Fuente: public/logo/snail-cream.png (caracol crema con fondo transparente).
 * Ejecutar: npm run script:generate-favicons
 */

import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const SNAIL = join(ROOT, 'public/logo/snail-cream.png');

/** Verde bosque de la marca (--bosque en app/globals.css) */
const BOSQUE = { r: 35, g: 53, b: 41, alpha: 1 };

/** Caracol centrado sobre fondo bosque; `radius` redondea las esquinas (0 = cuadrado). */
async function icon(size: number, radius = 0): Promise<Buffer> {
  const snail = await sharp(SNAIL)
    .resize(Math.round(size * 0.74), Math.round(size * 0.74), { fit: 'inside' })
    .toBuffer();

  const layers: sharp.OverlayOptions[] = [{ input: snail, gravity: 'center' }];
  const base = sharp({ create: { width: size, height: size, channels: 4, background: BOSQUE } }).composite(layers);

  if (radius === 0) return base.png().toBuffer();

  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></svg>`
  );
  return sharp(await base.png().toBuffer())
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/** Arma un .ico real con imágenes PNG incrustadas (16, 32 y 48 px). */
function buildIco(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

async function generateFavicons() {
  console.log('🎨 Generando íconos desde snail-cream.png...\n');

  const ico = buildIco(
    await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await icon(size, Math.round(size * 0.2)) })))
  );
  const png192 = await icon(192, 38);
  const png512 = await icon(512, 102);
  const apple180 = await icon(180); // iOS aplica sus propias esquinas

  const files: Record<string, Buffer> = {
    'public/favicon.ico': ico,
    'app/favicon.ico': ico,
    'public/favicon.png': png192,
    'public/icon-512.png': png512,
    'app/icon.png': png512,
    'public/apple-touch-icon.png': apple180,
    'app/apple-icon.png': apple180,
  };

  for (const [path, data] of Object.entries(files)) {
    writeFileSync(join(ROOT, path), data);
    console.log(`✅ ${path}`);
  }
  console.log('\n✨ Listo.');
}

generateFavicons().catch((error) => {
  console.error('❌ Error generando íconos:', error);
  process.exit(1);
});
