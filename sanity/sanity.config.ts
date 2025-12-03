/**
 * Sanity Studio Configuration
 * Configuración del CMS
 */

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';

export default defineConfig({
  name: 'default',
  title: 'comoelmusguito',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',

  basePath: '/studio',

  plugins: [
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
                    // Terrarios
                    S.listItem()
                      .title('🌿 Terrarios')
                      .icon(() => '🌿')
                      .child(
                        S.documentTypeList('terrarium')
                          .title('Terrarios')
                          .filter('_type == "terrarium"')
                      ),

                    // Cursos Online
                    S.listItem()
                      .title('🎓 Cursos Online')
                      .icon(() => '🎓')
                      .child(
                        S.documentTypeList('course')
                          .title('Cursos Online')
                          .filter('_type == "course"')
                      ),

                    // Talleres Presenciales
                    S.listItem()
                      .title('🤝 Talleres Presenciales')
                      .icon(() => '🤝')
                      .child(
                        S.documentTypeList('workshop')
                          .title('Talleres Presenciales')
                          .filter('_type == "workshop"')
                      ),
                  ])
              ),

            // Separador
            S.divider(),

            // Sección: GESTIÓN
            S.listItem()
              .title('👥 GESTIÓN')
              .child(
                S.list()
                  .title('Gestión')
                  .items([
                    // Usuarios
                    S.listItem()
                      .title('👤 Usuarios')
                      .icon(() => '👤')
                      .child(
                        S.documentTypeList('user')
                          .title('Usuarios')
                          .filter('_type == "user"')
                      ),

                    // Órdenes
                    S.listItem()
                      .title('📋 Órdenes')
                      .icon(() => '📋')
                      .child(
                        S.documentTypeList('order')
                          .title('Órdenes')
                          .filter('_type == "order"')
                      ),

                    // Accesos a Cursos
                    S.listItem()
                      .title('🎓 Accesos a Cursos')
                      .icon(() => '🎓')
                      .child(
                        S.documentTypeList('courseAccess')
                          .title('Accesos a Cursos')
                          .filter('_type == "courseAccess"')
                      ),
                  ])
              ),

            // Separador
            S.divider(),

            // Resto de documentos (si hay otros schemas no categorizados)
            ...S.documentTypeListItems().filter(
              (listItem) =>
                !['terrarium', 'course', 'workshop', 'user', 'order', 'courseAccess'].includes(
                  listItem.getId() || ''
                )
            ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
});

