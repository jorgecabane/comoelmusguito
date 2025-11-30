/**
 * Sanity Fetch Helpers
 * Funciones para obtener datos de Sanity con tipos
 */

import { client } from '@/sanity/lib/client';
import {
  terrariumsQuery,
  featuredTerrariumsQuery,
  terrariumBySlugQuery,
  coursesQuery,
  featuredCoursesQuery,
  courseBySlugQuery,
  workshopsQuery,
  featuredWorkshopsQuery,
  workshopBySlugQuery,
  allFeaturedQuery,
} from '@/sanity/lib/queries';
import type { Terrarium, Course, Workshop } from '@/types/sanity';

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
    return await client.fetch(featuredTerrariumsQuery);
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

