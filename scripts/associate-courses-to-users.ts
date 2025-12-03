/**
 * Script para asociar cursos a usuarios que ya los compraron
 * 
 * Este script busca todas las órdenes confirmadas que contienen cursos
 * y crea los accesos correspondientes si no existen.
 * 
 * Uso:
 *   npx tsx scripts/associate-courses-to-users.ts
 *   o
 *   npm run script:associate-courses
 */

// IMPORTANTE: Cargar variables de entorno ANTES de cualquier import
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@sanity/client';

// Cargar .env.local si existe (Next.js usa .env.local por defecto)
const envPath = resolve(process.cwd(), '.env.local');
const result = config({ path: envPath });

// Verificar que las variables necesarias estén cargadas
if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  console.error('❌ Error: NEXT_PUBLIC_SANITY_PROJECT_ID no está definido');
  console.error('   Asegúrate de tener un archivo .env.local con las variables de Sanity');
  console.error(`   Ruta buscada: ${envPath}`);
  if (result.error) {
    console.error(`   Error cargando .env.local: ${result.error.message}`);
  }
  process.exit(1);
}

if (!process.env.SANITY_API_TOKEN) {
  console.error('❌ Error: SANITY_API_TOKEN no está definido');
  console.error('   Asegúrate de tener un archivo .env.local con las variables de Sanity');
  console.error(`   Ruta buscada: ${envPath}`);
  if (result.error) {
    console.error(`   Error cargando .env.local: ${result.error.message}`);
  }
  process.exit(1);
}

// Crear cliente de Sanity directamente (sin usar módulos con 'server-only')
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

interface Order {
  _id: string;
  orderId: string;
  customerEmail: string;
  customerName?: string;
  userId?: {
    _type: 'reference';
    _ref: string;
  } | null;
  items: Array<{
    id: string;
    type: 'terrarium' | 'course' | 'workshop';
    name: string;
    slug: string;
  }>;
  paymentStatus: number;
  createdAt: string;
}

interface CourseAccess {
  _id: string;
  user: {
    _ref: string;
  };
  course: {
    _ref: string;
  };
}

interface SanityUser {
  _id: string;
  email: string;
  name?: string;
}

// Función auxiliar para obtener usuario por email
async function getUserByEmail(email: string): Promise<SanityUser | null> {
  try {
    const query = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch<SanityUser | null>(query, { email: email.toLowerCase() });
    return user;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
}

async function associateCoursesToUsers() {
  console.log('🚀 Iniciando script para asociar cursos a usuarios...\n');

  try {
    // 1. Buscar todas las órdenes confirmadas que tienen cursos
    const ordersQuery = `*[_type == "order" && paymentStatus == 2] {
      _id,
      orderId,
      customerEmail,
      customerName,
      userId,
      items[] {
        id,
        type,
        name,
        slug
      },
      paymentStatus,
      createdAt
    } | order(createdAt desc)`;

    const orders: Order[] = await client.fetch(ordersQuery);
    console.log(`📦 Encontradas ${orders.length} órdenes confirmadas\n`);

    if (orders.length === 0) {
      console.log('✅ No hay órdenes confirmadas para procesar');
      return;
    }

    let totalProcessed = 0;
    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // 2. Procesar cada orden
    for (const order of orders) {
      const courseItems = order.items.filter((item) => item.type === 'course');

      if (courseItems.length === 0) {
        continue; // Saltar órdenes sin cursos
      }

      console.log(`\n📋 Procesando orden ${order.orderId}`);
      console.log(`   Email: ${order.customerEmail}`);
      console.log(`   Cursos: ${courseItems.length}`);

      // Determinar userId
      let userId: string | null = null;

      if (order.userId?._ref) {
        // La orden ya tiene un usuario asociado
        userId = order.userId._ref;
        console.log(`   ✅ Usuario ya asociado: ${userId}`);
      } else {
        // Buscar usuario por email
        try {
          const user = await getUserByEmail(order.customerEmail);
          if (user) {
            userId = user._id;
            console.log(`   ✅ Usuario encontrado por email: ${userId}`);
            
            // Opcional: actualizar la orden para vincular el usuario
            try {
              await client
                .patch(order._id)
                .set({
                  userId: {
                    _type: 'reference',
                    _ref: userId,
                  },
                  updatedAt: new Date().toISOString(),
                })
                .commit();
              console.log(`   🔗 Orden vinculada al usuario`);
            } catch (error) {
              console.warn(`   ⚠️  No se pudo vincular la orden al usuario:`, error);
            }
          } else {
            console.log(`   ⚠️  Usuario no encontrado para email: ${order.customerEmail}`);
            totalSkipped += courseItems.length;
            continue;
          }
        } catch (error) {
          console.error(`   ❌ Error buscando usuario por email:`, error);
          totalErrors += courseItems.length;
          continue;
        }
      }

      // 3. Para cada curso en la orden, crear acceso si no existe
      for (const courseItem of courseItems) {
        try {
          // Verificar si ya existe el acceso
          const existingAccess = await client.fetch<CourseAccess | null>(
            `*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0]`,
            {
              userId,
              courseId: courseItem.id,
            }
          );

          if (existingAccess) {
            console.log(`   ⏭️  Acceso ya existe para curso "${courseItem.name}" (${courseItem.id})`);
            totalSkipped++;
            continue;
          }

          // Crear el acceso
          const now = new Date().toISOString();
          const accessDoc = {
            _type: 'courseAccess',
            user: {
              _type: 'reference',
              _ref: userId,
            },
            course: {
              _type: 'reference',
              _ref: courseItem.id,
            },
            order: {
              _type: 'reference',
              _ref: order._id,
            },
            accessGrantedAt: now,
            progress: {
              completedLessons: [],
              totalWatchTime: 0,
            },
          };

          await client.create(accessDoc);
          console.log(`   ✅ Acceso creado para curso "${courseItem.name}" (${courseItem.id})`);
          totalCreated++;
        } catch (error) {
          console.error(
            `   ❌ Error creando acceso para curso "${courseItem.name}" (${courseItem.id}):`,
            error
          );
          totalErrors++;
        }
      }

      totalProcessed++;
    }

    // 4. Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`Órdenes procesadas: ${totalProcessed}`);
    console.log(`Accesos creados: ${totalCreated}`);
    console.log(`Accesos ya existentes (saltados): ${totalSkipped}`);
    console.log(`Errores: ${totalErrors}`);
    console.log('='.repeat(60));
    console.log('\n✅ Script completado');
  } catch (error) {
    console.error('\n❌ Error ejecutando script:', error);
    process.exit(1);
  }
}

// Ejecutar el script
associateCoursesToUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
