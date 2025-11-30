/**
 * Datos Mock para desarrollo UI
 * TODO: Reemplazar con datos reales de Sanity CMS
 */

export interface Terrarium {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: 'CLP' | 'USD';
  images: string[];
  category: string;
  inStock: boolean;
  stock: number;
  plants: string[];
  size: string;
  featured?: boolean;
}

export interface Course {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  currency: 'CLP' | 'USD';
  thumbnail: string;
  duration: number; // horas
  lessonCount: number;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  topics: string[];
  featured?: boolean;
}

export interface Workshop {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  date: string;
  location: string;
  spots: number;
  spotsAvailable: number;
  duration: number; // horas
  image: string;
}

// Mock Terrarios
export const mockTerrariums: Terrarium[] = [
  {
    id: '1',
    slug: 'terrario-bosque-nublado',
    name: 'Terrario Bosque Nublado',
    description: 'Un hermoso ecosistema autosustentable que recrea un bosque nublado en miniatura. Con musgo nativo chileno recolectado de forma sustentable, helechos miniatura y piedras volcánicas que crean capas de drenaje perfectas.',
    price: 45000,
    currency: 'CLP',
    images: [
      'https://images.unsplash.com/photo-1459156212016-c812468e2115?w=800&q=80',
      'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&q=80',
    ],
    category: 'Bosque',
    inStock: true,
    stock: 5,
    plants: ['Musgo Dendroligotrichum', 'Helecho miniatura', 'Fitonia'],
    size: 'Mediano (20cm altura)',
    featured: true,
  },
  {
    id: '2',
    slug: 'terrario-desertico',
    name: 'Terrario Desértico',
    description: 'Suculentas y cactus en un diseño minimalista. Perfecto para espacios modernos que buscan un toque natural sin mantenimiento.',
    price: 38000,
    currency: 'CLP',
    images: [
      'https://images.unsplash.com/photo-1585314062604-1a357de8b000?w=800&q=80',
    ],
    category: 'Desierto',
    inStock: true,
    stock: 3,
    plants: ['Echeveria', 'Haworthia', 'Cactus miniatura'],
    size: 'Pequeño (15cm altura)',
    featured: true,
  },
  {
    id: '3',
    slug: 'terrario-tropical',
    name: 'Terrario Tropical',
    description: 'Un ecosistema de selva tropical en miniatura con alta humedad. Plantas exuberantes que crecen en un ambiente cerrado.',
    price: 52000,
    currency: 'CLP',
    images: [
      'https://images.unsplash.com/photo-1493079531284-6e08367cb007?w=800&q=80',
    ],
    category: 'Tropical',
    inStock: true,
    stock: 4,
    plants: ['Ficus pumila', 'Philodendron', 'Selaginella'],
    size: 'Grande (30cm altura)',
    featured: false,
  },
  {
    id: '4',
    slug: 'terrario-mini-musgo',
    name: 'Terrario Mini Musgo',
    description: 'Pequeño terrario perfecto para regalar. Solo musgo y piedras, belleza en la simplicidad.',
    price: 22000,
    currency: 'CLP',
    images: [
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80',
    ],
    category: 'Mini',
    inStock: true,
    stock: 10,
    plants: ['Musgo chileno'],
    size: 'Mini (10cm altura)',
    featured: false,
  },
  {
    id: '5',
    slug: 'terrario-colgante',
    name: 'Terrario Colgante',
    description: 'Terrario en esfera de vidrio para colgar. Perfecto para decorar ventanas o espacios verticales.',
    price: 35000,
    currency: 'CLP',
    images: [
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
    ],
    category: 'Especial',
    inStock: false,
    stock: 0,
    plants: ['Tillandsia', 'Musgo', 'Arena decorativa'],
    size: 'Mediano (18cm diámetro)',
    featured: false,
  },
  {
    id: '6',
    slug: 'terrario-paisaje-montaña',
    name: 'Terrario Paisaje Montaña',
    description: 'Un paisaje montañoso en miniatura con rocas volcánicas, musgo y pequeños helechos creando profundidad.',
    price: 65000,
    currency: 'CLP',
    images: [
      'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=800&q=80',
    ],
    category: 'Paisaje',
    inStock: true,
    stock: 2,
    plants: ['Musgo', 'Helecho miniatura', 'Selaginella'],
    size: 'Grande (35cm ancho)',
    featured: true,
  },
];

// Mock Cursos
export const mockCourses: Course[] = [
  {
    id: '1',
    slug: 'terrarios-desde-cero',
    name: 'Terrarios desde Cero',
    description: 'Aprende a crear tus propios terrarios autosustentables desde cero. Este curso te llevará paso a paso desde la selección de materiales hasta el mantenimiento a largo plazo. Incluye teoría sobre ecosistemas cerrados, tipos de plantas, y técnicas profesionales.',
    shortDescription: 'Curso completo para principiantes. Aprende todo lo necesario para crear y mantener terrarios.',
    price: 29990,
    currency: 'CLP',
    thumbnail: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&q=80',
    duration: 8,
    lessonCount: 24,
    level: 'Principiante',
    topics: ['Ecosistemas cerrados', 'Selección de plantas', 'Capas del terrario', 'Mantenimiento'],
    featured: true,
  },
  {
    id: '2',
    slug: 'terrarios-avanzado',
    name: 'Terrarios Avanzado: Paisajes y Diseño',
    description: 'Lleva tus terrarios al siguiente nivel. Aprende técnicas avanzadas de diseño, creación de paisajes miniatura, y composiciones artísticas.',
    shortDescription: 'Técnicas avanzadas de diseño y composición para crear terrarios profesionales.',
    price: 45990,
    currency: 'CLP',
    thumbnail: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=800&q=80',
    duration: 12,
    lessonCount: 32,
    level: 'Avanzado',
    topics: ['Diseño de paisajes', 'Composición artística', 'Hardscape avanzado', 'Especies raras'],
    featured: true,
  },
  {
    id: '3',
    slug: 'cultivo-musgo',
    name: 'Cultivo de Musgo Nativo',
    description: 'Especialízate en el cultivo y cuidado de musgo chileno. Aprende a propagar, mantener y usar diferentes especies.',
    shortDescription: 'Especialización en musgo nativo chileno para terrarios.',
    price: 19990,
    currency: 'CLP',
    thumbnail: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&q=80',
    duration: 5,
    lessonCount: 15,
    level: 'Intermedio',
    topics: ['Especies de musgo', 'Propagación', 'Recolección sustentable', 'Cuidados especiales'],
    featured: false,
  },
];

// Mock Talleres
export const mockWorkshops: Workshop[] = [
  {
    id: '1',
    slug: 'taller-terrario-bosque-diciembre',
    name: 'Taller: Crea tu Terrario de Bosque',
    description: 'Taller presencial de 3 horas donde crearás tu propio terrario de bosque. Incluye todos los materiales, herramientas y te llevas tu terrario a casa.',
    price: 45000,
    date: '2025-12-15T15:00:00',
    location: 'Providencia, Santiago',
    spots: 12,
    spotsAvailable: 5,
    duration: 3,
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80',
  },
  {
    id: '2',
    slug: 'taller-terrario-desertico-enero',
    name: 'Taller: Terrario Desértico con Suculentas',
    description: 'Aprende a crear terrarios abiertos con suculentas y cactus. Perfecto para principiantes.',
    price: 35000,
    date: '2025-01-20T10:00:00',
    location: 'Ñuñoa, Santiago',
    spots: 10,
    spotsAvailable: 10,
    duration: 2.5,
    image: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=800&q=80',
  },
];

// Utilidades
export function getTerrariumBySlug(slug: string): Terrarium | undefined {
  return mockTerrariums.find((t) => t.slug === slug);
}

export function getCourseBySlug(slug: string): Course | undefined {
  return mockCourses.find((c) => c.slug === slug);
}

export function getFeaturedTerrariums(): Terrarium[] {
  return mockTerrariums.filter((t) => t.featured);
}

export function getFeaturedCourses(): Course[] {
  return mockCourses.filter((c) => c.featured);
}

