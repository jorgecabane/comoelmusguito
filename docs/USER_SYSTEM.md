# 👤 Sistema de Usuarios y Órdenes

## 🎯 Objetivo

Crear un sistema que permita:
1. ✅ Comprar sin cuenta (guest checkout)
2. ✅ Crear cuenta durante checkout (opcional)
3. ✅ Vincular órdenes pasadas al registrarse (por email)
4. ✅ Dashboard de usuario con pedidos, cursos y talleres
5. ✅ Acceso a cursos online comprados

---

## 📋 Arquitectura Propuesta

### 1. **Autenticación: NextAuth.js**

**Por qué NextAuth.js:**
- ✅ Soporte nativo para Next.js
- ✅ Múltiples proveedores (Email/Password, Google, GitHub)
- ✅ Sesiones seguras
- ✅ Fácil de integrar

**Proveedores:**
- **Email/Password**: Para usuarios que quieren cuenta propia
- **Google OAuth**: Login rápido (ya tienen cuenta Google)
- **GitHub OAuth**: Opcional (para desarrolladores/tech-savvy)

### 2. **Almacenamiento: Sanity CMS**

**Schemas necesarios:**
- `user`: Perfil de usuario
- `order`: Órdenes de compra
- `courseAccess`: Acceso a cursos (vincula usuario + curso)

**Ventajas:**
- Ya tenemos Sanity configurado
- Tomás puede ver órdenes desde el Studio
- Fácil de consultar y filtrar
- No necesitamos DB adicional

### 3. **Flujo de Checkout Mejorado**

```
Usuario en /checkout
    ↓
Formulario:
  - Email (requerido)
  - Nombre (opcional)
  - [ ] Crear cuenta (checkbox)
    ↓
Si marca "Crear cuenta":
  - Mostrar campo de contraseña
  - Opción "Continuar con Google"
    ↓
Procesar pago
    ↓
Si creó cuenta:
  - Crear usuario en Sanity
  - Vincular orden al usuario
Si no creó cuenta:
  - Guardar orden con email
  - Mostrar mensaje: "¿Quieres crear cuenta para ver tus pedidos?"
```

---

## 🔄 Flujo de Vinculación de Órdenes

### Escenario 1: Cliente compra sin cuenta → Se registra después

1. Cliente compra con email: `juan@email.com`
2. Orden se guarda en Sanity con `customerEmail: "juan@email.com"` y `userId: null`
3. Cliente se registra después con `juan@email.com`
4. Sistema busca órdenes con ese email y `userId: null`
5. Vincula automáticamente todas las órdenes al nuevo usuario

### Escenario 2: Cliente crea cuenta durante checkout

1. Cliente marca "Crear cuenta" en checkout
2. Completa email + contraseña (o Google)
3. Se crea usuario en Sanity
4. Orden se guarda con `userId` desde el inicio
5. No necesita vinculación posterior

---

## 📊 Schemas de Sanity

### Schema: `user`

```typescript
{
  _id: string;
  _type: 'user';
  email: string; // Único, usado para vincular órdenes
  name?: string;
  image?: string; // De OAuth providers
  createdAt: datetime;
  updatedAt: datetime;
  
  // Relaciones
  orders: reference[]; // Órdenes del usuario
  courseAccess: reference[]; // Cursos a los que tiene acceso
}
```

### Schema: `order`

```typescript
{
  _id: string;
  _type: 'order';
  orderId: string; // ORD-1234567890-abc
  flowOrder?: string;
  
  // Cliente
  customerEmail: string; // Para vincular si se registra después
  customerName?: string;
  userId?: reference; // null si es guest, referencia a user si tiene cuenta
  
  // Productos
  items: array; // [{ type, name, price, quantity, ... }]
  total: number;
  currency: string;
  
  // Estado
  paymentStatus: number; // 1=Pendiente, 2=Pagado, 3=Rechazado, 4=Anulado
  paymentDate?: datetime;
  
  // Metadata
  createdAt: datetime;
  updatedAt: datetime;
}
```

### Schema: `courseAccess`

```typescript
{
  _id: string;
  _type: 'courseAccess';
  user: reference; // Usuario
  course: reference; // Curso
  order: reference; // Orden que dio acceso
  accessGrantedAt: datetime;
  progress?: object; // { completedLessons: [], lastWatched: ... }
}
```

---

## 🎨 UI/UX del Checkout Mejorado

### Opción A: Checkbox Simple (Recomendado)

```
┌─────────────────────────────────────┐
│  Tus Datos                          │
│                                     │
│  Email *                            │
│  [tu@email.com            ]          │
│                                     │
│  Nombre (Opcional)                  │
│  [Juan Pérez            ]           │
│                                     │
│  ☐ Crear cuenta para ver mis       │
│    pedidos y acceder a cursos       │
│                                     │
│  [Si marca checkbox]                │
│  Contraseña *                       │
│  [••••••••            ]              │
│                                     │
│  ──── o ────                        │
│                                     │
│  [Continuar con Google]             │
│                                     │
│  [Pagar $60.000 CLP]               │
└─────────────────────────────────────┘
```

### Opción B: Tabs (Más claro)

```
┌─────────────────────────────────────┐
│  [Como Invitado] [Crear Cuenta]    │
│                                     │
│  Email *                            │
│  [tu@email.com            ]         │
│                                     │
│  Nombre (Opcional)                  │
│  [Juan Pérez            ]           │
│                                     │
│  [Pagar $60.000 CLP]               │
└─────────────────────────────────────┘
```

**Recomendación: Opción A** - Más simple, menos fricción

---

## 🏠 Dashboard de Usuario (`/mi-cuenta`)

### Estructura

```
┌─────────────────────────────────────┐
│  Hola, Juan 👋                      │
│                                     │
│  [Mis Pedidos] [Mis Cursos]         │
│  [Mis Talleres] [Configuración]     │
│                                     │
│  ────────────────────────────────   │
│                                     │
│  📦 Mis Pedidos                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Orden ORD-1234567890        │   │
│  │ 15 de enero, 2024          │   │
│  │                             │   │
│  │ • Terrario Epífito          │   │
│  │   $60.000 CLP               │   │
│  │                             │   │
│  │ Estado: ✅ Confirmado       │   │
│  │ [Ver Detalles]              │   │
│  └─────────────────────────────┘   │
│                                     │
│  🎓 Mis Cursos                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Curso: Terrarios desde Cero │   │
│  │ Progreso: 3/12 lecciones    │   │
│  │ [Continuar Aprendiendo →]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  🤝 Mis Talleres                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Taller Individual           │   │
│  │ 20 de enero, 2024 - 10:00  │   │
│  │ [Ver Detalles]              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 🔐 Sistema de Acceso a Cursos

### Flujo

1. Usuario compra curso → Se crea `courseAccess` en Sanity
2. Usuario intenta acceder a `/cursos/[slug]`
3. Verificar si tiene `courseAccess` para ese curso
4. Si tiene acceso:
   - Mostrar player de video
   - Guardar progreso
5. Si no tiene acceso:
   - Mostrar preview
   - Botón "Comprar Curso"

### Protección de Rutas

```typescript
// app/cursos/[slug]/page.tsx
export default async function CoursePage({ params }) {
  const course = await getCourseBySlug(slug);
  const session = await getServerSession();
  
  if (!session) {
    // Mostrar preview + CTA para comprar
    return <CoursePreview course={course} />;
  }
  
  const hasAccess = await checkCourseAccess(session.user.email, course._id);
  
  if (!hasAccess) {
    return <CoursePreview course={course} />;
  }
  
  // Mostrar curso completo
  return <CoursePlayer course={course} />;
}
```

---

## 🚀 Plan de Implementación

### Fase 1: Base (1-2 semanas)
1. ✅ Instalar y configurar NextAuth.js
2. ✅ Crear schemas en Sanity (user, order, courseAccess)
3. ✅ Migrar almacenamiento de órdenes a Sanity
4. ✅ Función para vincular órdenes por email

### Fase 2: Checkout Mejorado (1 semana)
1. ✅ Agregar checkbox "Crear cuenta" en checkout
2. ✅ Formulario de registro durante checkout
3. ✅ Integración con Google OAuth
4. ✅ Crear usuario al completar checkout

### Fase 3: Dashboard (1-2 semanas)
1. ✅ Página `/mi-cuenta` con tabs
2. ✅ Lista de pedidos
3. ✅ Lista de cursos con progreso
4. ✅ Lista de talleres

### Fase 4: Acceso a Cursos (1 semana)
1. ✅ Verificar acceso en páginas de curso
2. ✅ Player de video protegido
3. ✅ Guardar progreso de lecciones
4. ✅ Sistema de "Continuar viendo"

---

## 💡 Mejores Prácticas

### Seguridad
- ✅ Validar email único en Sanity
- ✅ Hash de contraseñas (NextAuth lo hace automáticamente)
- ✅ Verificar acceso en cada request (no confiar solo en frontend)
- ✅ Rate limiting en registro/login

### UX
- ✅ No forzar registro (guest checkout siempre disponible)
- ✅ Mensaje claro: "¿Quieres crear cuenta para ver tus pedidos?"
- ✅ Vincular órdenes automáticamente (sin acción del usuario)
- ✅ Email de bienvenida cuando se vincula cuenta

### Performance
- ✅ Cache de sesiones
- ✅ Lazy loading en dashboard
- ✅ Paginación de órdenes si hay muchas

---

## 📝 Preguntas a Resolver

1. **¿Permitir múltiples emails por usuario?**
   - Por ahora: No, un email = un usuario
   - Futuro: Permitir emails secundarios

2. **¿Qué pasa si cambia el email?**
   - Actualizar todas las órdenes vinculadas
   - O mantener email original en órdenes (histórico)

3. **¿Borrar órdenes de guest después de X tiempo?**
   - Recomendación: No borrar, mantener histórico
   - Si usuario nunca se registra, órdenes quedan huérfanas (OK)

4. **¿Permitir transferir órdenes entre cuentas?**
   - Por ahora: No
   - Futuro: Soporte puede hacerlo manualmente

---

## 🎯 Beneficios

### Para el Cliente
- ✅ Ve todos sus pedidos en un lugar
- ✅ Acceso fácil a cursos comprados
- ✅ Historial completo
- ✅ No necesita recordar números de orden

### Para Tomás
- ✅ Ve quién compró qué
- ✅ Puede contactar clientes fácilmente
- ✅ Analytics de clientes recurrentes
- ✅ Gestión desde Sanity Studio

### Para el Negocio
- ✅ Mayor retención (clientes con cuenta compran más)
- ✅ Email marketing más efectivo
- ✅ Mejor experiencia = más recomendaciones

---

## 🔗 Referencias

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Sanity Authentication](https://www.sanity.io/docs/authentication)
- [OAuth Providers](https://next-auth.js.org/providers/)

