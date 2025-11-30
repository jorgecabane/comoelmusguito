import { MetadataRoute } from 'next';

/**
 * Genera sitemap.xml dinámico
 * Se actualiza automáticamente con el contenido del CMS
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comoelmusguito.com';
  
  // TODO: Descomentar cuando implementemos Sanity
  // const terrariums = await getTerrariums();
  // const courses = await getCourses();
  // const blogPosts = await getBlogPosts();
  
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
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sobre-el-musguito`,
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
  ];
  
  // TODO: Agregar páginas dinámicas cuando implementemos Sanity
  /*
  const terrariumPages = terrariums.map((terrarium) => ({
    url: `${baseUrl}/terrarios/${terrarium.slug}`,
    lastModified: new Date(terrarium.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  
  const coursePages = courses.map((course) => ({
    url: `${baseUrl}/cursos/${course.slug}`,
    lastModified: new Date(course.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));
  
  const blogPages = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  
  return [
    ...staticPages,
    ...terrariumPages,
    ...coursePages,
    ...blogPages,
  ];
  */
  
  return staticPages;
}

