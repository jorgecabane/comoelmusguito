# 📋 Revisión Completa de Links del Sitio

## ✅ Páginas Existentes y Funcionales

### Navegación Principal (Header)
- ✅ `/` - Inicio
- ✅ `/terrarios` - Catálogo de terrarios
- ✅ `/cursos` - Catálogo de cursos online
- ✅ `/talleres` - Catálogo de talleres
- ✅ `/sobre` - Sobre el Musguito

### Páginas de Productos
- ✅ `/terrarios/[slug]` - Detalle de terrario
- ✅ `/cursos/[slug]` - Detalle de curso
- ✅ `/cursos/[slug]/leccion/[[...lessonPath]]` - Lección de curso
- ✅ `/talleres/[slug]` - Detalle de taller

### Autenticación
- ✅ `/auth/login` - Iniciar sesión
- ✅ `/auth/register` - Registro
- ✅ `/auth/error` - Error de autenticación

### E-commerce
- ✅ `/carrito` - Carrito de compras
- ✅ `/checkout` - Proceso de pago
- ✅ `/checkout/callback` - Callback de pago

### Usuario
- ✅ `/mi-cuenta` - Panel de usuario (con tabs: pedidos, cursos, talleres)

### Utilidades
- ✅ `/studio` - Sanity Studio
- ✅ `/robots.txt` - Robots.txt
- ✅ `/sitemap.xml` - Sitemap

---

## ❌ Páginas Referenciadas pero NO Existentes (404)

### Legal (Footer - Sección "Legal")
- ❌ `/terminos` - Términos y Condiciones
- ❌ `/privacidad` - Política de Privacidad
- ❌ `/envios` - Envíos y Devoluciones
- ❌ `/faq` - Preguntas Frecuentes

### Contenido (Footer - Sección "Aprender")
- ❌ `/blog` - Blog
- ❌ `/recursos` - Guías Gratuitas

### Nosotros (Footer - Sección "Nosotros")
- ❌ `/sustentabilidad` - Sustentabilidad
- ❌ `/contacto` - Contacto
- ❌ `/sobre#historia` - Sección dentro de `/sobre` (NO existe el anchor `id="historia"`)

### Tienda (Footer - Sección "Tienda")
- ❌ `/terrarios?category=bosque` - Filtro NO implementado (la página no maneja query params)
- ❌ `/terrarios?category=desierto` - Filtro NO implementado
- ❌ `/terrarios?category=regalo` - Filtro NO implementado (además, "regalo" no es una categoría válida según el schema)

---

## 🔍 Links Externos Referenciados

### Redes Sociales
- ✅ `https://www.instagram.com/comoelmusguito` - Instagram
- ✅ `https://www.youtube.com/@comoelmusguito` - YouTube

### Email
- ✅ `mailto:hola@comoelmusguito.cl` - Email de contacto

### Legal (Google)
- ✅ `https://policies.google.com/privacy` - Política de privacidad de Google (usado en registro)
- ✅ `https://policies.google.com/terms` - Términos de Google (usado en registro)

---

## 📝 Páginas que DEBERÍAN Existir (No referenciadas pero necesarias)

### Legal Adicional
- ⚠️ `/politica-cookies` - Política de Cookies (requerida por GDPR/LGPD)
- ⚠️ `/aviso-legal` - Aviso Legal (opcional, pero recomendado)

### Soporte
- ⚠️ `/soporte` - Centro de ayuda (alternativa a FAQ)
- ⚠️ `/devoluciones` - Política de devoluciones (puede estar en `/envios`)

### Marketing/Contenido
- ⚠️ `/ofertas` - Página de ofertas especiales
- ⚠️ `/regalos` - Página dedicada de regalos (actualmente solo filtro)
- ⚠️ `/testimonios` - Testimonios de clientes
- ⚠️ `/galeria` - Galería de proyectos/terrarios

### Usuario
- ⚠️ `/mi-cuenta/configuracion` - Configuración de cuenta
- ⚠️ `/mi-cuenta/favoritos` - Lista de favoritos
- ⚠️ `/mi-cuenta/direcciones` - Direcciones de envío (si aplica)

### Proceso
- ⚠️ `/proceso` - Cómo hacemos los terrarios (puede estar en `/sobre`)

---

## 🎯 Prioridades de Implementación

### 🔴 ALTA PRIORIDAD (Legal - Requerido para operar)
1. **`/terminos`** - Términos y Condiciones
   - Requerido para e-commerce
   - Debe incluir: condiciones de compra, derechos del consumidor, responsabilidades
   
2. **`/privacidad`** - Política de Privacidad
   - Requerido por GDPR/LGPD
   - Debe incluir: qué datos se recopilan, cómo se usan, derechos del usuario
   
3. **`/envios`** - Envíos y Devoluciones
   - Requerido para e-commerce
   - Debe incluir: políticas de envío, tiempos, costos, política de devoluciones
   
4. **`/faq`** - Preguntas Frecuentes
   - Reduce carga de soporte
   - Mejora UX

### 🟡 MEDIA PRIORIDAD (Funcionalidad y UX)
5. **`/contacto`** - Página de contacto
   - Formulario de contacto
   - Información de contacto
   - Mapa/ubicación (si aplica)
   
6. **`/sustentabilidad`** - Sustentabilidad
   - Alineado con valores de marca
   - Ya referenciado en footer
   
7. **`/blog`** - Blog
   - SEO y contenido
   - Ya referenciado en footer
   
8. **`/recursos`** - Guías Gratuitas
   - Lead generation
   - Ya referenciado en footer

### 🟢 BAJA PRIORIDAD (Mejoras y expansión)
9. **`/politica-cookies`** - Política de Cookies
   - Requerido si usas cookies de tracking
   
10. **`/testimonios`** - Testimonios
    - Social proof
    - Marketing
    
11. **`/galeria`** - Galería
    - Showcase de productos
    - Marketing

---

## 📊 Resumen por Estado

| Estado | Cantidad | Páginas |
|--------|----------|---------|
| ✅ Existentes | 18 | Funcionales |
| ❌ Referenciadas pero faltantes | 12 | Críticas (4 legales + 8 otras) |
| ⚠️ Deberían existir | 12 | Mejoras y expansión |
| **TOTAL** | **42** | |

### Desglose de Links Faltantes
- **Legal (4)**: `/terminos`, `/privacidad`, `/envios`, `/faq`
- **Contenido (2)**: `/blog`, `/recursos`
- **Nosotros (3)**: `/sustentabilidad`, `/contacto`, `/sobre#historia`
- **Filtros (3)**: `/terrarios?category=*` (3 variantes no funcionales)

---

## 🔗 Links con Problemas Potenciales

### Filtros de Categorías
- `/terrarios?category=bosque` - Verificar si el filtro funciona
- `/terrarios?category=desierto` - Verificar si el filtro funciona
- `/terrarios?category=regalo` - Verificar si el filtro funciona

### Anchors
- `/sobre#historia` - Verificar si existe la sección con id="historia"

---

## 📌 Notas Importantes

1. **Legal**: Las 4 páginas legales son **obligatorias** para operar un e-commerce en Chile y cumplir con GDPR/LGPD.

2. **SEO**: Las páginas faltantes afectan el SEO, especialmente `/blog` y `/recursos` que pueden generar tráfico orgánico.

3. **UX**: Los usuarios esperan encontrar estas páginas. Si no existen, genera desconfianza.

4. **Footer**: Todos los links del footer deben funcionar. Actualmente 8 de 12 links en el footer llevan a 404.

---

## 🚀 Siguiente Paso

Recomendación: Implementar primero las 4 páginas legales (ALTA PRIORIDAD) antes de lanzar al público.

