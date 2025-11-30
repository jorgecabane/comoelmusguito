/**
 * Sanity Studio Page
 * Acceso al CMS en /studio
 */

'use client';

import { NextStudio } from 'next-sanity/studio';
import config from '@/sanity/sanity.config';

export default function StudioPage() {
  return (
    <div className="pt-20">
      <NextStudio config={config} />
    </div>
  );
}

