/**
 * Home Page - Experiencia Narrativa Inmersiva
 * "Un Viaje Hacia la Vida"
 */

import { HeroImmersive } from '@/components/sections/home/HeroImmersive';
import { ArtistSection } from '@/components/sections/home/ArtistSection';
import { ProcessSection } from '@/components/sections/home/ProcessSection';
import { ExploreSection } from '@/components/sections/home/ExploreSection';
import { LearnSection } from '@/components/sections/home/LearnSection';
import { CommunitySection } from '@/components/sections/home/CommunitySection';
import { FinalCTA } from '@/components/sections/home/FinalCTA';
import { ScrollProgress } from '@/components/animations';
import { getFeaturedTerrariums, getFeaturedCourses } from '@/lib/sanity/fetch';
import { getUserCurrency } from '@/lib/utils/geolocation';

// Revalidar cada 60 segundos
export const revalidate = 60;
// Forzar renderizado dinámico porque usamos geolocalización
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch datos destacados de Sanity y detectar moneda del usuario
  const [terrarios, cursos, userCurrency] = await Promise.all([
    getFeaturedTerrariums(),
    getFeaturedCourses(),
    getUserCurrency(),
  ]);

  return (
    <>
      <ScrollProgress />
      
      {/* CAPÍTULO 1: EL DESPERTAR */}
      <HeroImmersive />

      {/* CAPÍTULO 2: EL ARTISTA */}
      <ArtistSection />

      {/* CAPÍTULO 3: EL PROCESO */}
      <ProcessSection />

      {/* CAPÍTULO 4: EXPLORA */}
      <ExploreSection terrarios={terrarios} />

      {/* CAPÍTULO 5: APRENDE */}
      <LearnSection courses={cursos} userCurrency={userCurrency} />

      {/* CAPÍTULO 6: LA COMUNIDAD */}
      <CommunitySection />

      {/* CAPÍTULO 7: TU TURNO */}
      <FinalCTA />
    </>
  );
}
