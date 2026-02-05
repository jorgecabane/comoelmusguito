/**
 * Schemas Index
 * Exporta todos los schemas de Sanity
 */

import terrarium from './terrarium';
import course from './course';
import workshop from './workshop';
import supply from './supply';
import blogPost from './blogPost';
import user from './user';
import order from './order';
import courseAccess from './courseAccess';
import newsletter from './newsletter';

export const schemaTypes = [
  // Contenido
  terrarium,
  course,
  workshop,
  supply,
  blogPost,
  // Gestión
  user,
  order,
  courseAccess,
  newsletter,
];

