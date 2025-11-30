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
          .title('Contenido')
          .items([
            // Terrarios
            S.listItem()
              .title('Terrarios')
              .icon(() => '🌿')
              .child(
                S.documentTypeList('terrarium')
                  .title('Terrarios')
                  .filter('_type == "terrarium"')
              ),

            // Cursos Online
            S.listItem()
              .title('Cursos Online')
              .icon(() => '🎓')
              .child(
                S.documentTypeList('course')
                  .title('Cursos Online')
                  .filter('_type == "course"')
              ),

            // Talleres Presenciales
            S.listItem()
              .title('Talleres Presenciales')
              .icon(() => '🤝')
              .child(
                S.documentTypeList('workshop')
                  .title('Talleres Presenciales')
                  .filter('_type == "workshop"')
              ),

            // Separador
            S.divider(),

            // Resto de documentos
            ...S.documentTypeListItems().filter(
              (listItem) =>
                !['terrarium', 'course', 'workshop'].includes(
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

