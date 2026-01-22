/**
 * Sanity Fetch Helpers
 * Funciones para obtener datos de Sanity con tipos
 */

import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';
import {
  terrariumsQuery,
  featuredTerrariumsQuery,
  terrariumBySlugQuery,
  terrariumByIdQuery,
  coursesQuery,
  featuredCoursesQuery,
  courseBySlugQuery,
  courseByIdQuery,
  workshopsQuery,
  featuredWorkshopsQuery,
  workshopBySlugQuery,
  workshopByIdQuery,
  suppliesQuery,
  featuredSuppliesQuery,
  supplyBySlugQuery,
  supplyByIdQuery,
  suppliesByCategoryQuery,
  allFeaturedQuery,
} from '@/sanity/lib/queries';
import type { Terrarium, Course, Workshop, Supply, SupplyCategory } from '@/types/sanity';

// ============ TERRARIOS ============

export async function getAllTerrariums(): Promise<Terrarium[]> {
  try {
    return await client.fetch(terrariumsQuery);
  } catch (error) {
    console.error('Error fetching terrariums:', error);
    return [];
  }
}

export async function getFeaturedTerrariums(): Promise<Terrarium[]> {
  try {
    // Primero intentar obtener terrarios destacados
    const featuredResult = await client.fetch(featuredTerrariumsQuery);
    
    // Si hay terrarios destacados, retornarlos
    if (featuredResult && featuredResult.length > 0) {
      return featuredResult;
    }
    
    // Si no hay destacados, obtener terrarios disponibles (fallback)
    const fallbackQuery = groq`
      *[_type == "terrarium" && inStock == true] | order(order asc, _createdAt desc) [0...6] {
        _id,
        name,
        slug,
        description,
        images,
        price,
        currency,
        inStock,
        stock,
        size,
        category,
        plants
      }
    `;
    const fallbackResult = await client.fetch(fallbackQuery);
    return fallbackResult || [];
  } catch (error) {
    console.error('Error fetching featured terrariums:', error);
    return [];
  }
}

export async function getTerrariumBySlug(slug: string): Promise<Terrarium | null> {
  try {
    if (!slug) {
      console.error('Slug is required');
      return null;
    }
    console.log('Fetching terrarium with slug:', slug);
    const result = await client.fetch<Terrarium | null>(terrariumBySlugQuery, { slug });
    console.log('Terrarium result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching terrarium by slug:', error);
    return null;
  }
}

export async function getTerrariumById(id: string): Promise<Terrarium | null> {
  try {
    if (!id) {
      return null;
    }
    return await client.fetch<Terrarium | null>(terrariumByIdQuery, { id });
  } catch (error) {
    console.error('Error fetching terrarium by id:', error);
    return null;
  }
}

// ============ CURSOS ============

export async function getAllCourses(): Promise<Course[]> {
  try {
    return await client.fetch(coursesQuery);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

export async function getFeaturedCourses(): Promise<Course[]> {
  try {
    return await client.fetch(featuredCoursesQuery);
  } catch (error) {
    console.error('Error fetching featured courses:', error);
    return [];
  }
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  try {
    if (!slug) {
      console.error('Slug is required');
      return null;
    }
    console.log('Fetching course with slug:', slug);
    const result = await client.fetch<Course | null>(courseBySlugQuery, { slug });
    console.log('Course result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching course by slug:', error);
    return null;
  }
}

export async function getCourseById(id: string): Promise<Course | null> {
  try {
    if (!id) {
      return null;
    }
    return await client.fetch<Course | null>(courseByIdQuery, { id });
  } catch (error) {
    console.error('Error fetching course by id:', error);
    return null;
  }
}

// ============ TALLERES ============

export async function getAllWorkshops(): Promise<Workshop[]> {
  try {
    return await client.fetch(workshopsQuery);
  } catch (error) {
    console.error('Error fetching workshops:', error);
    return [];
  }
}

export async function getFeaturedWorkshops(): Promise<Workshop[]> {
  try {
    return await client.fetch(featuredWorkshopsQuery);
  } catch (error) {
    console.error('Error fetching featured workshops:', error);
    return [];
  }
}

export async function getWorkshopBySlug(slug: string): Promise<Workshop | null> {
  try {
    if (!slug) {
      console.error('Slug is required');
      return null;
    }
    console.log('Fetching workshop with slug:', slug);
    const result = await client.fetch<Workshop | null>(workshopBySlugQuery, { slug });
    console.log('Workshop result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching workshop by slug:', error);
    return null;
  }
}

export async function getWorkshopById(id: string): Promise<Workshop | null> {
  try {
    if (!id) {
      return null;
    }
    return await client.fetch<Workshop | null>(workshopByIdQuery, { id });
  } catch (error) {
    console.error('Error fetching workshop by id:', error);
    return null;
  }
}

// ============ INSUMOS ============

export async function getAllSupplies(): Promise<Supply[]> {
  try {
    return await client.fetch(suppliesQuery);
  } catch (error) {
    console.error('Error fetching supplies:', error);
    return [];
  }
}

export async function getFeaturedSupplies(): Promise<Supply[]> {
  try {
    // Primero intentar obtener insumos destacados
    const featuredResult = await client.fetch(featuredSuppliesQuery);
    
    // Si hay insumos destacados, retornarlos
    if (featuredResult && featuredResult.length > 0) {
      return featuredResult;
    }
    
    // Si no hay destacados, obtener insumos disponibles (fallback)
    const fallbackQuery = groq`
      *[_type == "supply" && inStock == true] | order(order asc, _createdAt desc) [0...6] {
        _id,
        name,
        slug,
        description,
        images,
        price,
        currency,
        inStock,
        stock,
        category,
        brand
      }
    `;
    const fallbackResult = await client.fetch(fallbackQuery);
    return fallbackResult || [];
  } catch (error) {
    console.error('Error fetching featured supplies:', error);
    return [];
  }
}

export async function getSupplyBySlug(slug: string): Promise<Supply | null> {
  try {
    if (!slug) {
      console.error('Slug is required');
      return null;
    }
    console.log('Fetching supply with slug:', slug);
    const result = await client.fetch<Supply | null>(supplyBySlugQuery, { slug });
    console.log('Supply result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching supply by slug:', error);
    return null;
  }
}

export async function getSupplyById(id: string): Promise<Supply | null> {
  try {
    if (!id) {
      return null;
    }
    return await client.fetch<Supply | null>(supplyByIdQuery, { id });
  } catch (error) {
    console.error('Error fetching supply by id:', error);
    return null;
  }
}

export async function getSuppliesByCategory(category: SupplyCategory): Promise<Supply[]> {
  try {
    return await client.fetch(suppliesByCategoryQuery, { category });
  } catch (error) {
    console.error(`Error fetching supplies by category ${category}:`, error);
    return [];
  }
}

// ============ GENERAL ============

export async function getAllFeaturedContent() {
  try {
    return await client.fetch(allFeaturedQuery);
  } catch (error) {
    console.error('Error fetching all featured content:', error);
    return { terrarios: [], cursos: [] };
  }
}

// ============ REVALIDATION ============

// Para ISR (Incremental Static Regeneration)
export const revalidate = 60; // Revalidar cada 60 segundos

