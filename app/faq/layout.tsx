import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes',
  description: 'Encuentra respuestas a las preguntas más comunes sobre nuestros terrarios, cursos, talleres y más.',
  openGraph: {
    title: 'Preguntas Frecuentes | comoelmusguito',
    description: 'Encuentra respuestas a las preguntas más comunes sobre nuestros terrarios, cursos, talleres y más.',
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

