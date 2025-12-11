import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parámetros opcionales para personalizar la imagen
    const customTitle = searchParams.get('title');
    const customSubtitle = searchParams.get('subtitle');
    const type = searchParams.get('type') || 'home';

    // Obtener la URL base del sitio
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'comoelmusguito.cl';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    // Configuración por tipo de página
    const variants: Record<string, {
      title: string;
      subtitle: string;
      bgImage: string;
    }> = {
      home: {
        title: 'Como el musguito',
        subtitle: 'Crea Vida en Cualquier Lugar',
        bgImage: `${baseUrl}/images/hero/hero-fallback.jpg`,
      },
      terrarios: {
        title: 'Terrarios Artesanales',
        subtitle: 'Ecosistemas vivos hechos a mano',
        bgImage: `${baseUrl}/images/about/terrarios-musguito-1.jpg`,
      },
      cursos: {
        title: 'Cursos Online',
        subtitle: 'Aprende a crear terrarios a tu ritmo',
        bgImage: `${baseUrl}/images/hero/hero-fallback.jpg`,
      },
      talleres: {
        title: 'Talleres Presenciales',
        subtitle: 'Aprende creando en persona',
        bgImage: `${baseUrl}/images/about/tomas-table.jpg`,
      },
    };

    // Obtener configuración del tipo o usar default
    const config = variants[type] || variants.home;
    
    // Usar valores personalizados si se proporcionan, sino usar los del tipo
    const title = customTitle || config.title;
    const subtitle = customSubtitle || config.subtitle;
    const bgImageUrl = config.bgImage;
    const logoUrl = `${baseUrl}/logo/logo-white.svg`;

    // Colores de la marca
    const textColor = '#FDFAF6'; // cream
    const accentColor = '#6B9362'; // vida

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '60px 80px',
            backgroundImage: `url(${bgImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >

          {/* Overlay oscuro para mejor legibilidad del texto */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(45, 80, 22, 0.6) 0%, rgba(31, 57, 16, 0.75) 100%)',
            }}
          />

          {/* Contenido principal */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              width: '100%',
            }}
          >
            {/* Logo arriba */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '32px',
              }}
            >
              <img
                src={logoUrl}
                alt="comoelmusguito logo"
                width={200}
                height={120}
                style={{
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Título principal */}
            <div
              style={{
                fontSize: 80,
                fontWeight: 700,
                color: textColor,
                marginBottom: '20px',
                textAlign: 'center',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
            >
              {title}
            </div>

            {/* Subtítulo */}
            <div
              style={{
                fontSize: 36,
                fontWeight: 500,
                color: accentColor,
                textAlign: 'center',
                lineHeight: 1.2,
                maxWidth: '900px',
                textShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
              }}
            >
              {subtitle}
            </div>

            {/* Línea decorativa */}
            <div
              style={{
                width: '120px',
                height: '4px',
                backgroundColor: accentColor,
                marginTop: '32px',
                borderRadius: '2px',
              }}
            />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`Error generating OG image: ${e.message}`);
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
    });
  }
}