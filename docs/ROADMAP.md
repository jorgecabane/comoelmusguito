# 🗺️ ROADMAP - comoelmusguito

## 📊 Estado Actual

✅ **Completado:**
- Diseño e implementación UI/UX inmersiva
- Integración completa con Sanity CMS
- Páginas de catálogo (Terrarios, Cursos, Talleres)
- Páginas de detalle de productos
- SEO optimizado
- Responsive design
- Sistema de tipos TypeScript
- Documentación completa

---

## 🎯 FASE 1: E-COMMERCE FUNCIONAL (Crítico)

### 1.1 Sistema de Carrito de Compras

**Prioridad:** 🔴 ALTA

#### Funcionalidades:
- [ ] Estado global del carrito (Zustand o Context)
- [ ] Botón "Agregar al carrito" funcional
- [ ] Modal de confirmación al agregar producto
  - Opción: "Seguir comprando" o "Ir al carrito"
  - Animación de planta creciendo al agregar
- [ ] Badge animado en ícono 🌱 con cantidad de items
- [ ] Página `/carrito` con:
  - Lista de productos
  - Cantidades editables
  - Subtotales
  - Total general
  - Botón "Proceder al pago"
- [ ] Persistencia en `localStorage`
- [ ] Validación de stock al agregar
- [ ] Eliminación de items del carrito

**Tiempo estimado:** 5-7 días

---

### 1.2 Sistema de Wishlist / Favoritos ❤️

**Prioridad:** 🟡 MEDIA

#### Funcionalidades:
- [ ] Estado global de favoritos
- [ ] Icono de corazón funcional
- [ ] Animación al agregar/quitar favoritos
- [ ] Página `/favoritos` con lista de productos guardados
- [ ] Persistencia en `localStorage` (sin login)
- [ ] Badge en header si hay favoritos

**Tiempo estimado:** 2-3 días

---

### 1.3 Sistema de Pagos con Stripe

**Prioridad:** 🔴 ALTA

#### Funcionalidades:
- [ ] Integración con Stripe Checkout
- [ ] Página `/checkout` con:
  - Resumen del pedido
  - Formulario de datos del cliente
  - Selector de método de envío (terrarios)
  - Selector de fecha (talleres)
  - Términos y condiciones
- [ ] Manejo de pagos en CLP y USD
- [ ] Webhooks de Stripe para confirmar pagos
- [ ] Página de confirmación `/pedido/confirmado`
- [ ] Página de error `/pedido/error`
- [ ] Emails de confirmación

**Tiempo estimado:** 7-10 días

---

### 1.4 Sistema de Emails con Resend

**Prioridad:** 🔴 ALTA

#### Emails a implementar:
- [ ] **Confirmación de compra** (terrarios)
  - Detalle del pedido
  - Información de retiro/envío
  - Datos de contacto
- [ ] **Confirmación de inscripción** (cursos online)
  - Acceso al curso
  - Credenciales de login
  - Instrucciones
- [ ] **Confirmación de reserva** (talleres)
  - Fecha y hora
  - Ubicación con mapa
  - Qué llevar
  - Política de cancelación
- [ ] **Newsletter** (suscripción desde footer)
- [ ] **Recuperación de contraseña**
- [ ] **Recordatorio de taller** (48h antes)

**Tiempo estimado:** 4-5 días

---

## 🎓 FASE 2: PLATAFORMA DE CURSOS ONLINE

### 2.1 Sistema de Autenticación

**Prioridad:** 🔴 ALTA

#### Funcionalidades:
- [ ] NextAuth.js configurado
- [ ] Login con email/contraseña
- [ ] Login con Google
- [ ] Registro de usuarios
- [ ] Verificación de email
- [ ] Recuperación de contraseña
- [ ] Página `/login`
- [ ] Página `/registro`
- [ ] Protección de rutas privadas

**Tiempo estimado:** 5-6 días

---

### 2.2 Dashboard de Usuario

**Prioridad:** 🟢 ALTA (después de auth)

#### Páginas:
- [ ] `/mi-cuenta` - Vista general
  - Perfil
  - Mis cursos
  - Mis compras
  - Configuración
- [ ] `/mi-cuenta/cursos` - Cursos comprados
  - Cards de cursos con progreso
  - Acceso directo al player
- [ ] `/mi-cuenta/pedidos` - Historial de pedidos
  - Estado de envíos
  - Facturas descargables
- [ ] `/mi-cuenta/talleres` - Talleres reservados
  - Próximos talleres
  - Historial
- [ ] `/mi-cuenta/perfil` - Editar perfil
  - Datos personales
  - Cambiar contraseña
  - Preferencias

**Tiempo estimado:** 6-8 días

---

### 2.3 Player de Cursos

**Prioridad:** 🔴 ALTA

#### Funcionalidades:
- [ ] Página `/curso/[slug]/ver`
- [ ] Sidebar con módulos y lecciones
- [ ] Player de video integrado (Vimeo/Bunny)
- [ ] Control de acceso (solo usuarios que compraron)
- [ ] Tracking de progreso por lección
- [ ] Marcar lección como completada
- [ ] Barra de progreso del curso
- [ ] Siguiente lección automática
- [ ] Descarga de materiales
- [ ] Notas por lección
- [ ] Certificado al completar (si aplica)

**Tiempo estimado:** 10-12 días

---

### 2.4 Mejoras UX Página de Curso

**Prioridad:** 🟡 MEDIA

#### Mejoras Desktop:
- [ ] Contenido del curso centrado y mejor espaciado
- [ ] Tabs para organizar información:
  - Overview
  - Contenido (módulos)
  - Instructor
  - Reviews
- [ ] Sticky sidebar con CTA de compra
- [ ] Preview de lecciones gratuitas (modal con player)
- [ ] Sección de "Cursos similares"
- [ ] FAQ del curso

**Tiempo estimado:** 3-4 días

---

## 🖼️ FASE 3: MEJORAS VISUALES E INTERACTIVIDAD

### 3.1 Galería Interactiva de Productos

**Prioridad:** 🟡 MEDIA

#### Terrarios:
- [ ] Lightbox/modal al hacer click en imagen
- [ ] Navegación entre imágenes (anterior/siguiente)
- [ ] Zoom en imágenes
- [ ] Thumbnails clickeables
- [ ] Slider de imágenes en mobile
- [ ] Soporte para videos en galería

**Tiempo estimado:** 3-4 días

#### Cursos:
- [ ] Modal con video promocional
- [ ] Preview de contenido (primeras lecciones)
- [ ] Galería de resultados de estudiantes

**Tiempo estimado:** 2-3 días

---

### 3.2 Selector de Fecha para Talleres

**Prioridad:** 🔴 ALTA

#### Funcionalidades:
- [ ] Calendario visual con fechas disponibles
- [ ] Indicador de cupos por fecha:
  - Verde: Disponible (>50%)
  - Amarillo: Últimos cupos (<50%)
  - Rojo: Agotado
- [ ] Modal de confirmación al seleccionar fecha
- [ ] Validación de fecha seleccionada en checkout
- [ ] Actualización en tiempo real de cupos

**Tiempo estimado:** 4-5 días

---

### 3.3 Badges con Paleta de Colores

**Prioridad:** 🟢 BAJA

#### Actualizar:
- [ ] Badges de stock → colores tierra
- [ ] Badges de nivel → gradiente musgo/vida
- [ ] Badges de categoría → paleta natural
- [ ] Estados de taller → semáforo natural

**Tiempo estimado:** 1 día

---

## 🔍 FASE 4: BÚSQUEDA Y FILTROS

### 4.1 Sistema de Filtros Funcional

**Prioridad:** 🟡 MEDIA

#### Terrarios:
- [ ] Filtro por categoría (Bosque, Tropical, Desértico, etc.)
- [ ] Filtro por tamaño (Mini, Pequeño, Mediano, Grande)
- [ ] Filtro por precio (rangos)
- [ ] Filtro por disponibilidad (solo en stock)
- [ ] Ordenamiento (precio, nombre, más nuevo)

#### Cursos:
- [ ] Filtro por nivel (Principiante, Intermedio, Avanzado)
- [ ] Filtro por duración
- [ ] Filtro por precio
- [ ] Ordenamiento (popularidad, precio, valoración)

#### Talleres:
- [ ] Filtro por fecha (próximos 7 días, 30 días, etc.)
- [ ] Filtro por ubicación
- [ ] Filtro por nivel
- [ ] Filtro por disponibilidad (con cupos)

**Tiempo estimado:** 5-6 días

---

### 4.2 Búsqueda Global

**Prioridad:** 🟡 MEDIA

#### Funcionalidades:
- [ ] Barra de búsqueda en header
- [ ] Búsqueda por nombre de producto
- [ ] Búsqueda por descripción
- [ ] Sugerencias en tiempo real (autocomplete)
- [ ] Página `/buscar?q=[query]` con resultados
- [ ] Filtros aplicables en resultados
- [ ] "No se encontraron resultados" con sugerencias

**Tiempo estimado:** 4-5 días

---

## 💰 FASE 5: SISTEMA DE PROMOCIONES

### 5.1 Cupones y Descuentos

**Prioridad:** 🟡 MEDIA

#### Funcionalidades:
- [ ] Schema en Sanity para cupones
- [ ] Campo "Código de descuento" en checkout
- [ ] Validación de cupones:
  - Fecha de vigencia
  - Usos máximos
  - Productos aplicables
  - Monto mínimo de compra
- [ ] Tipos de descuento:
  - Porcentaje (10% OFF)
  - Monto fijo ($5.000 OFF)
  - Envío gratis
- [ ] Aplicación automática de ofertas

**Tiempo estimado:** 4-5 días

---

## 📦 FASE 6: SISTEMA DE ENVÍO Y LOGÍSTICA

### 6.1 Opciones de Entrega (Terrarios)

**Prioridad:** 🟡 MEDIA

#### Funcionalidades:
- [ ] Retiro en persona (gratis)
  - Dirección del taller
  - Horarios disponibles
- [ ] Envío a domicilio
  - Integración con Starken/Chilexpress
  - Cálculo de costo según región
  - Tracking de pedido
- [ ] Restricciones por región (si aplica)
- [ ] Confirmación de dirección con Google Maps

**Tiempo estimado:** 6-8 días

---

### 6.2 Tracking de Pedidos

**Prioridad:** 🟡 MEDIA

#### Funcionalidades:
- [ ] Estados de pedido:
  - Pendiente de pago
  - Pagado
  - En preparación
  - Listo para retiro / Enviado
  - Entregado
  - Cancelado
- [ ] Notificaciones por email al cambiar estado
- [ ] Página de tracking público
- [ ] Panel admin para actualizar estados

**Tiempo estimado:** 5-6 días

---

## ⭐ FASE 7: SISTEMA DE REVIEWS Y TESTIMONIOS

### 7.1 Reviews de Productos

**Prioridad:** 🟢 BAJA

#### Funcionalidades:
- [ ] Solo usuarios que compraron pueden dejar review
- [ ] Calificación de 1-5 estrellas
- [ ] Comentario escrito
- [ ] Opción de subir foto
- [ ] Moderación de reviews (Sanity Studio)
- [ ] Promedio de calificaciones en card de producto
- [ ] Sección de reviews en página de detalle
- [ ] Filtros: más útiles, más recientes, por estrellas

**Tiempo estimado:** 5-6 días

---

### 7.2 Testimonios en Home

**Prioridad:** 🟢 BAJA

#### Funcionalidades:
- [ ] Schema en Sanity para testimonios
- [ ] Sección en Home con slider
- [ ] Fotos de clientes con sus terrarios
- [ ] Integración con Instagram (hashtag #comoelmusguito)

**Tiempo estimado:** 2-3 días

---

## 📱 FASE 8: INTEGRACIONES SOCIALES

### 8.1 Instagram Feed

**Prioridad:** 🟢 BAJA

#### Funcionalidades:
- [ ] Instagram API integrado
- [ ] Sección "Síguenos en Instagram" en Home
- [ ] Grid con últimas 6 publicaciones
- [ ] Links a posts originales
- [ ] Actualización automática

**Tiempo estimado:** 3-4 días

---

### 8.2 Share Social

**Prioridad:** 🟢 BAJA

#### Funcionalidades:
- [ ] Botones de compartir en productos:
  - WhatsApp
  - Facebook
  - Instagram (copiar link)
  - Twitter
- [ ] Open Graph optimizado para cada red
- [ ] Preview cards atractivos

**Tiempo estimado:** 2 días

---

## 📧 FASE 9: MARKETING Y NEWSLETTER

### 9.1 Newsletter Funcional

**Prioridad:** 🟡 MEDIA

#### Funcionalidades:
- [ ] Integración con Resend o Mailchimp
- [ ] Formulario en footer funcional
- [ ] Página de confirmación de suscripción
- [ ] Email de bienvenida
- [ ] Segmentación de audiencia:
  - Interesados en terrarios
  - Interesados en cursos
  - Interesados en talleres
- [ ] Templates de emails:
  - Nuevos productos
  - Próximos talleres
  - Ofertas especiales
  - Tips de cuidado

**Tiempo estimado:** 5-6 días

---

### 9.2 Blog de Contenido (Opcional)

**Prioridad:** 🟢 MUY BAJA

#### Funcionalidades:
- [ ] Schema en Sanity para posts
- [ ] Página `/blog` con listado
- [ ] Página `/blog/[slug]` para posts
- [ ] Categorías
- [ ] SEO optimizado
- [ ] Compartir en redes
- [ ] Comentarios (Disqus o similar)

**Contenido:**
- Guías de cuidado
- Especies de plantas
- Behind the scenes
- Historia de terrarios
- Proyectos de estudiantes

**Tiempo estimado:** 6-8 días

---

## 📊 FASE 10: ANALYTICS Y OPTIMIZACIÓN

### 10.1 Analytics

**Prioridad:** 🟡 MEDIA

#### Implementar:
- [ ] Google Analytics 4 o Plausible
- [ ] Tracking de eventos:
  - Ver producto
  - Agregar al carrito
  - Iniciar checkout
  - Completar compra
  - Ver curso
  - Completar lección
- [ ] Conversion funnels
- [ ] Heatmaps (Hotjar)

**Tiempo estimado:** 3-4 días

---

### 10.2 Performance Optimization

**Prioridad:** 🟡 MEDIA

#### Mejoras:
- [ ] Lazy loading de imágenes optimizado
- [ ] Code splitting avanzado
- [ ] Prefetch de páginas críticas
- [ ] Optimización de bundle size
- [ ] Caché estratégica
- [ ] Web Vitals monitoreados
- [ ] Lighthouse score >90

**Tiempo estimado:** 4-5 días

---

## 🔐 FASE 11: SEGURIDAD Y LEGAL

### 11.1 Páginas Legales

**Prioridad:** 🟡 MEDIA

#### Páginas:
- [ ] `/terminos-y-condiciones`
- [ ] `/politica-de-privacidad`
- [ ] `/politica-de-cookies`
- [ ] `/politica-de-devolucion`
- [ ] `/politica-de-envios`
- [ ] Footer links actualizados

**Tiempo estimado:** 2-3 días (+ redacción legal)

---

### 11.2 Seguridad

**Prioridad:** 🔴 ALTA

#### Implementar:
- [ ] Rate limiting en APIs
- [ ] Validación de inputs
- [ ] Sanitización de datos
- [ ] CSRF protection
- [ ] Headers de seguridad
- [ ] HTTPS obligatorio
- [ ] Cookies seguras

**Tiempo estimado:** 3-4 días

---

## 👨‍💼 FASE 12: PANEL DE ADMINISTRACIÓN

### 12.1 Dashboard Admin

**Prioridad:** 🟡 MEDIA

#### Funcionalidades:
- [ ] Página `/admin` (solo para admin)
- [ ] Vista general:
  - Ventas del mes
  - Pedidos pendientes
  - Cursos más vendidos
  - Talleres próximos
- [ ] Gestión de pedidos:
  - Cambiar estados
  - Ver detalles
  - Imprimir facturas
  - Exportar a Excel
- [ ] Gestión de usuarios:
  - Ver lista
  - Buscar
  - Ver historial de compras
  - Acceso a cursos
- [ ] Estadísticas:
  - Gráficos de ventas
  - Productos más vendidos
  - Ingresos por categoría

**Tiempo estimado:** 8-10 días

---

## 📞 FASE 13: SOPORTE Y CONTACTO

### 13.1 Página de Contacto

**Prioridad:** 🟡 MEDIA

#### Funcionalidades:
- [ ] Página `/contacto`
- [ ] Formulario de contacto
- [ ] Mapa con ubicación del taller
- [ ] Información de contacto:
  - Email
  - Teléfono
  - Instagram
  - Horarios de atención
- [ ] FAQ expandible
- [ ] Email automático de confirmación

**Tiempo estimado:** 2-3 días

---

### 13.2 Chat de Soporte (Opcional)

**Prioridad:** 🟢 MUY BAJA

#### Opciones:
- [ ] WhatsApp Business integrado
- [ ] Chatbot básico
- [ ] Intercom o Crisp

**Tiempo estimado:** 2-3 días

---

## 🧪 FASE 14: TESTING Y QA

### 14.1 Tests Automatizados

**Prioridad:** 🟡 MEDIA

#### Implementar:
- [ ] Jest para unit tests
- [ ] React Testing Library para components
- [ ] Playwright para E2E tests
- [ ] Tests críticos:
  - Agregar al carrito
  - Checkout flow
  - Login/registro
  - Compra de curso
  - Reserva de taller

**Tiempo estimado:** 6-8 días

---

### 14.2 Testing Manual

**Prioridad:** 🔴 ALTA (antes de producción)

#### Checklist:
- [ ] Todos los flujos de compra
- [ ] Responsive en todos los dispositivos
- [ ] Navegadores (Chrome, Firefox, Safari, Edge)
- [ ] Formularios y validaciones
- [ ] Emails recibidos correctamente
- [ ] Webhooks de Stripe funcionando
- [ ] Links rotos (404)
- [ ] SEO checks
- [ ] Accesibilidad (a11y)

**Tiempo estimado:** 3-4 días

---

## 🚀 FASE 15: DEPLOYMENT Y PRODUCCIÓN

### 15.1 Configuración de Producción

**Prioridad:** 🔴 ALTA

#### Tareas:
- [ ] Deploy en Vercel
- [ ] Variables de entorno configuradas
- [ ] Dominio personalizado configurado
- [ ] SSL activo
- [ ] Sanity en modo producción
- [ ] Stripe en modo live
- [ ] Analytics configurado
- [ ] Error tracking (Sentry)
- [ ] Logs configurados

**Tiempo estimado:** 2-3 días

---

### 15.2 Monitoreo Post-Launch

**Prioridad:** 🔴 ALTA

#### Configurar:
- [ ] Uptime monitoring
- [ ] Error alerts
- [ ] Performance monitoring
- [ ] Backup automático de base de datos
- [ ] Plan de rollback

**Tiempo estimado:** 2 días

---

## 📋 RESUMEN DE PRIORIDADES

### 🔴 CRÍTICO (Para MVP Funcional)
1. Sistema de carrito + checkout
2. Integración con Stripe
3. Sistema de emails (Resend)
4. Autenticación (para cursos)
5. Player de cursos
6. Selector de fecha para talleres
7. Testing manual completo
8. Deploy a producción

**Tiempo estimado:** 8-10 semanas

---

### 🟡 IMPORTANTE (Post-MVP)
1. Wishlist
2. Dashboard de usuario
3. Sistema de envíos
4. Filtros y búsqueda
5. Sistema de cupones
6. Newsletter funcional
7. Analytics
8. Panel admin
9. Páginas legales

**Tiempo estimado:** 6-8 semanas

---

### 🟢 NICE TO HAVE (Futuro)
1. Reviews y testimonios
2. Instagram integration
3. Blog
4. Chat de soporte
5. Sistema de afiliados
6. App móvil

**Tiempo estimado:** 8-12 semanas

---

## 📅 ESTIMACIÓN TOTAL

**MVP Funcional (E-commerce básico):** 2-3 meses  
**Plataforma completa (con cursos):** 4-6 meses  
**Todas las funcionalidades:** 8-12 meses

---

## 💡 SUGERENCIAS ADICIONALES

### Ideas Extra:
- [ ] **Sistema de afiliados** - Usuarios recomiendan y ganan comisión
- [ ] **Talleres privados** - Reserva para grupos cerrados
- [ ] **Gift cards** - Regalar cursos o terrarios
- [ ] **Subscripción mensual** - "Terrario del mes"
- [ ] **Programa de lealtad** - Puntos por compras
- [ ] **App móvil** - PWA o React Native
- [ ] **AR/VR** - Vista 360° de terrarios
- [ ] **Live streaming** - Clases en vivo
- [ ] **Comunidad** - Foro o grupo privado
- [ ] **Marketplace** - Otros artistas venden también

---

## 📝 NOTAS

- **Priorizar siempre:** Funcionalidad > Estética
- **MVP primero:** Sistema de compra funcionando es crítico
- **Iterar rápido:** Lanzar y mejorar basado en feedback
- **Medir todo:** Analytics desde el día 1
- **Seguridad:** No comprometer nunca

---

**Última actualización:** 30 Nov 2024  
**Versión:** 1.0

