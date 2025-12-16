# 📋 Organización del Sanity Studio

## 🎯 ¿Qué verá Tomás en `/studio`?

Tomás verá **TODAS las entidades** organizadas en el menú lateral:

### Estructura Actual (Solo Contenido)

```
┌─────────────────────────────┐
│  comoelmusguito             │
│                             │
│  🌿 Terrarios                │
│  🎓 Cursos Online            │
│  🤝 Talleres Presenciales   │
│  ────────────────────────   │
│  (otros documentos)          │
└─────────────────────────────┘
```

### Estructura Propuesta (Con Gestión)

```
┌─────────────────────────────┐
│  comoelmusguito             │
│                             │
│  📦 CONTENIDO                │
│  ├─ 🌿 Terrarios            │
│  ├─ 🎓 Cursos Online        │
│  └─ 🤝 Talleres Presenciales│
│                             │
│  ────────────────────────   │
│                             │
│  👥 GESTIÓN                  │
│  ├─ 👤 Usuarios             │
│  ├─ 📋 Órdenes              │
│  └─ 🎓 Accesos a Cursos     │
└─────────────────────────────┘
```

---

## 🎨 Opciones de Organización

### Opción A: Estructura Simple (Recomendada)

**Ventajas:**
- ✅ Todo visible de un vistazo
- ✅ Fácil de navegar
- ✅ Separación clara entre contenido y gestión

**Estructura:**
```
📦 CONTENIDO
  🌿 Terrarios
  🎓 Cursos Online
  🤝 Talleres Presenciales

👥 GESTIÓN
  👤 Usuarios
  📋 Órdenes
  🎓 Accesos a Cursos
```

### Opción B: Estructura con Submenús

**Ventajas:**
- ✅ Más organizado si hay muchas entidades
- ✅ Menos desorden visual

**Estructura:**
```
📦 CONTENIDO
  ├─ 🌿 Terrarios
  ├─ 🎓 Cursos Online
  └─ 🤝 Talleres Presenciales

👥 GESTIÓN
  ├─ 👤 Usuarios
  ├─ 📋 Órdenes
  │   ├─ Todas las órdenes
  │   ├─ Pendientes
  │   └─ Completadas
  └─ 🎓 Accesos a Cursos
```

### Opción C: Todo en una Lista (Actual)

**Ventajas:**
- ✅ Simple
- ✅ Sin configuración extra

**Desventajas:**
- ❌ Puede ser confuso con muchas entidades
- ❌ No hay separación visual clara

---

## 🎯 Recomendación: Opción A

**¿Por qué?**
- Tomás necesita ver contenido (lo que vende) y gestión (quién compró)
- Separación clara pero simple
- Fácil de entender para alguien no técnico

---

## 🔧 Implementación

### Configuración del Studio

```typescript
// sanity/sanity.config.ts
structureTool({
  structure: (S) =>
    S.list()
      .title('comoelmusguito')
      .items([
        // Sección: CONTENIDO
        S.listItem()
          .title('📦 CONTENIDO')
          .child(
            S.list()
              .title('Contenido')
              .items([
                S.listItem()
                  .title('🌿 Terrarios')
                  .child(S.documentTypeList('terrarium')),
                S.listItem()
                  .title('🎓 Cursos Online')
                  .child(S.documentTypeList('course')),
                S.listItem()
                  .title('🤝 Talleres Presenciales')
                  .child(S.documentTypeList('workshop')),
              ])
          ),

        S.divider(),

        // Sección: GESTIÓN
        S.listItem()
          .title('👥 GESTIÓN')
          .child(
            S.list()
              .title('Gestión')
              .items([
                S.listItem()
                  .title('👤 Usuarios')
                  .child(S.documentTypeList('user')),
                S.listItem()
                  .title('📋 Órdenes')
                  .child(S.documentTypeList('order')),
                S.listItem()
                  .title('🎓 Accesos a Cursos')
                  .child(S.documentTypeList('courseAccess')),
              ])
          ),
      ]),
}),
```

---

## 📊 Vista de Cada Entidad

### 👤 Usuarios
- Lista de todos los usuarios registrados
- Ver: email, nombre, fecha de registro
- Filtrar por: email, fecha
- Acciones: Ver perfil, ver órdenes

### 📋 Órdenes
- Lista de todas las órdenes
- Ver: número de orden, cliente, monto, estado, fecha
- Filtrar por: estado (pendiente/pagado), fecha, cliente
- Acciones: Ver detalles, ver productos

### 🎓 Accesos a Cursos
- Lista de accesos otorgados
- Ver: usuario, curso, fecha de acceso
- Filtrar por: curso, usuario
- Acciones: Ver progreso, revocar acceso

---

## 🔒 Permisos (Futuro)

Si quieres que Tomás solo vea ciertas cosas:

```typescript
// Ejemplo: Solo mostrar órdenes y usuarios, no accesos
S.listItem()
  .title('👥 GESTIÓN')
  .child(
    S.list()
      .title('Gestión')
      .items([
        S.listItem()
          .title('👤 Usuarios')
          .child(S.documentTypeList('user')),
        S.listItem()
          .title('📋 Órdenes')
          .child(S.documentTypeList('order')),
        // courseAccess solo visible para admins
      ])
  ),
```

---

## 💡 Tips para Tomás

### Búsqueda Rápida
- Usar la barra de búsqueda (Cmd/Ctrl + K)
- Buscar por email, nombre, número de orden

### Filtros Útiles
- **Órdenes**: Filtrar por "Estado = Pagado" para ver ventas confirmadas
- **Usuarios**: Filtrar por fecha para ver nuevos registros
- **Cursos**: Ver cuántos accesos tiene cada curso

### Vistas Personalizadas (Futuro)
- Crear vistas guardadas para consultas frecuentes
- Ejemplo: "Órdenes de esta semana", "Usuarios nuevos"

---

## 🎯 Resumen

**Tomás verá:**
1. ✅ **Contenido** (lo que ya tiene): Terrarios, Cursos, Talleres
2. ✅ **Gestión** (nuevo): Usuarios, Órdenes, Accesos a Cursos

**Organización:**
- Separación clara con secciones
- Íconos para identificación rápida
- Fácil de navegar

**Beneficios:**
- Ve quién compró qué
- Puede contactar clientes
- Gestiona accesos a cursos
- Todo desde un solo lugar




