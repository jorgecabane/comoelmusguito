/**
 * Home Page - Experiencia Narrativa Inmersiva
 * "Un Viaje Hacia la Vida"
 */

import { HeroImmersive } from '@/components/sections/home/HeroImmersive';
import { ScrollProgress } from '@/components/animations';
import { getFeaturedTerrariums, getFeaturedCourses, getFeaturedWorkshops, getFeaturedSupplies } from '@/lib/sanity/fetch';
import { getUserCurrency } from '@/lib/utils/geolocation';
import nextDynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load componentes below the fold para mejorar FCP y LCP
const ArtistSection = nextDynamic(() => import('@/components/sections/home/ArtistSection').then(mod => ({ default: mod.ArtistSection })), {
  loading: () => null, // No mostrar loading, renderizar cuando esté listo
});

const ProcessSection = nextDynamic(() => import('@/components/sections/home/ProcessSection').then(mod => ({ default: mod.ProcessSection })), {
  loading: () => null,
});

const ExploreSection = nextDynamic(() => import('@/components/sections/home/ExploreSection').then(mod => ({ default: mod.ExploreSection })), {
  loading: () => null,
});

const LearnSection = nextDynamic(() => import('@/components/sections/home/LearnSection').then(mod => ({ default: mod.LearnSection })), {
  loading: () => null,
});

const WorkshopsSection = nextDynamic(() => import('@/components/sections/home/WorkshopsSection').then(mod => ({ default: mod.WorkshopsSection })), {
  loading: () => null,
});

const SuppliesSection = nextDynamic(() => import('@/components/sections/home/SuppliesSection').then(mod => ({ default: mod.SuppliesSection })), {
  loading: () => null,
});

const FinalCTA = nextDynamic(() => import('@/components/sections/home/FinalCTA').then(mod => ({ default: mod.FinalCTA })), {
  loading: () => null,
});

// Revalidar cada 60 segundos
export const revalidate = 60;
// Forzar renderizado dinámico porque usamos geolocalización
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch datos destacados de Sanity y detectar moneda del usuario
  const [terrarios, cursos, talleres, insumos, userCurrency] = await Promise.all([
    getFeaturedTerrariums(),
    getFeaturedCourses(),
    getFeaturedWorkshops(),
    getFeaturedSupplies(),
    getUserCurrency(),
  ]);

  return (
    <>
      <ScrollProgress />
      
      {/* CAPÍTULO 1: EL DESPERTAR - Above the fold, carga inmediata */}
      <HeroImmersive />

      {/* CAPÍTULO 2: EL ARTISTA - Below the fold, lazy load */}
      <Suspense fallback={null}>
        <ArtistSection />
      </Suspense>

      {/* CAPÍTULO 3: EL PROCESO - Below the fold, lazy load */}
      <Suspense fallback={null}>
        <ProcessSection />
      </Suspense>

      {/* CAPÍTULO 4: EXPLORA - Below the fold, lazy load */}
      <Suspense fallback={null}>
        <ExploreSection terrarios={terrarios} />
      </Suspense>

      {/* CAPÍTULO 5: APRENDE - Below the fold, lazy load */}
      <Suspense fallback={null}>
        <LearnSection courses={cursos} userCurrency={userCurrency} />
      </Suspense>

      {/* CAPÍTULO 5.5: TALLERES PRESENCIALES - Below the fold, lazy load */}
      <Suspense fallback={null}>
        <WorkshopsSection workshops={talleres} />
      </Suspense>

      {/* CAPÍTULO 5.6: INSUMOS - Below the fold, lazy load */}
      <Suspense fallback={null}>
        <SuppliesSection insumos={insumos} />
      </Suspense>

      {/* CAPÍTULO 6: LA COMUNIDAD */}
      {/* <CommunitySection /> */}

      {/* CAPÍTULO 7: TU TURNO - Below the fold, lazy load */}
      <Suspense fallback={null}>
        <FinalCTA />
      </Suspense>
    </>
  );
}
