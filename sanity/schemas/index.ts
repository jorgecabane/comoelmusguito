/**
 * Schemas Index
 * Exporta todos los schemas de Sanity
 */

import terrarium from './terrarium';
import course from './course';
import workshop from './workshop';
import user from './user';
import order from './order';
import courseAccess from './courseAccess';
import newsletter from './newsletter';

export const schemaTypes = [
  // Contenido
  terrarium,
  course,
  workshop,
  // Gestión
  user,
  order,
  courseAccess,
  newsletter,
];

