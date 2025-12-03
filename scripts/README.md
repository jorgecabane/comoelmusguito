# Scripts de Utilidad

Este directorio contiene scripts de utilidad para tareas administrativas y de mantenimiento.

## Scripts Disponibles

### `associate-courses-to-users.ts`

Script para asociar cursos a usuarios que ya los compraron.

**¿Qué hace?**
- Busca todas las órdenes confirmadas (paymentStatus === 2) que contienen cursos
- Para cada orden:
  - Si tiene un `userId` asociado, crea los accesos a cursos si no existen
  - Si no tiene `userId` pero tiene `customerEmail`, busca el usuario por email y luego crea los accesos
  - Vincula automáticamente la orden al usuario si se encuentra por email
- Es idempotente: no crea accesos duplicados si ya existen

**Uso:**

```bash
# Opción 1: Usando npm script
npm run script:associate-courses

# Opción 2: Usando tsx directamente
npx tsx scripts/associate-courses-to-users.ts
```

**Requisitos:**
- Variables de entorno configuradas (`.env.local`):
  - `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - `NEXT_PUBLIC_SANITY_DATASET`
  - `SANITY_API_TOKEN`

**Salida:**
El script muestra:
- Progreso de cada orden procesada
- Accesos creados
- Accesos que ya existían (saltados)
- Errores encontrados
- Resumen final con estadísticas

**Ejemplo de salida:**
```
🚀 Iniciando script para asociar cursos a usuarios...

📦 Encontradas 5 órdenes confirmadas

📋 Procesando orden ORD-1234567890
   Email: usuario@example.com
   Cursos: 1
   ✅ Usuario ya asociado: abc123
   ✅ Acceso creado para curso "Curso de Terrarios Avanzado" (course-123)

📊 RESUMEN
============================================================
Órdenes procesadas: 5
Accesos creados: 3
Accesos ya existentes (saltados): 2
Errores: 0
============================================================

✅ Script completado
```

