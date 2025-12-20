import { MetadataRoute } from 'next';
import { getAllTerrariums, getAllCourses, getAllWorkshops } from '@/lib/sanity/fetch';

/**
 * Genera sitemap.xml dinámico
 * Se actualiza automáticamente con el contenido del CMS
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comoelmusguito.cl';
  
  // Páginas estáticas principales
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/terrarios`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cursos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/talleres`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/sustentabilidad`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/envios`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
  
  // Páginas dinámicas de productos
  try {
    const terrariums = await getAllTerrariums();
    const courses = await getAllCourses();
    const workshops = await getAllWorkshops();
    
    const terrariumPages: MetadataRoute.Sitemap = terrariums.map((terrarium) => ({
      url: `${baseUrl}/terrarios/${terrarium.slug.current}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  
    const coursePages: MetadataRoute.Sitemap = courses.map((course) => ({
      url: `${baseUrl}/cursos/${course.slug.current}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    }));
  
    const workshopPages: MetadataRoute.Sitemap = workshops.map((workshop) => ({
      url: `${baseUrl}/talleres/${workshop.slug.current}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  
    return [
      ...staticPages,
      ...terrariumPages,
      ...coursePages,
      ...workshopPages,
    ];
  } catch (error) {
    console.error('Error generando sitemap:', error);
    // Si hay error, retornar solo páginas estáticas
    return staticPages;
  }
}

