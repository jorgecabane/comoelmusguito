/**
 * Script Helper: Obtener Token de Instagram
 * 
 * Uso: npm run script:instagram-auth
 */

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const INSTAGRAM_REDIRECT_URI = `${SITE_URL}/api/instagram/callback`;

if (!INSTAGRAM_APP_ID) {
  console.error('❌ Error: INSTAGRAM_APP_ID no está configurado en .env.local');
  console.log('\n📝 Agrega estas variables a tu .env.local:');
  console.log('   INSTAGRAM_APP_ID=tu_app_id');
  console.log('   INSTAGRAM_APP_SECRET=tu_app_secret');
  console.log('   NEXT_PUBLIC_SITE_URL=http://localhost:3000  (ya deberías tenerla)');
  process.exit(1);
}

console.log('\n🔗 URL de Autorización de Instagram:\n');
const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}&scope=user_profile,user_media&response_type=code`;
console.log(authUrl);
console.log('\n' + '─'.repeat(80));
console.log('\n📋 Pasos siguientes:');
console.log('   1. Copia la URL de arriba');
console.log('   2. Ábrela en tu navegador');
console.log('   3. Inicia sesión con tu cuenta de Instagram');
console.log('   4. Autoriza el acceso');
console.log('   5. Serás redirigido a /api/instagram/callback');
console.log('   6. El endpoint automáticamente:');
console.log('      - Intercambia el código por un token corto (1 hora)');
console.log('      - Intercambia el token corto por un long-lived token (60 días)');
console.log('   7. Copia el token de la respuesta JSON');
console.log('   8. Agrégalo a .env.local como INSTAGRAM_ACCESS_TOKEN');
console.log('\n💡 El token que recibirás ya es un long-lived token (60 días).');
console.log('   El intercambio se hace automáticamente, no necesitas hacer nada manual.\n');

