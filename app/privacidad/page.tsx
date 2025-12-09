/**
 * Página: Política de Privacidad
 */

import { FadeIn } from '@/components/animations';
import { Shield, Lock, Eye } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidad | Como el Musguito',
  description: 'Política de privacidad y protección de datos personales de Como el Musguito.',
};

export default function PrivacidadPage() {
  return (
    <div className="pt-32 pb-16">
      <div className="container max-w-4xl">
        <FadeIn immediate={true}>
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-vida/20 mb-6">
              <Shield className="text-vida" size={32} />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-4">
              Política de Privacidad
            </h1>
            <p className="text-gray text-lg">
              Última actualización: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                1. Introducción
              </h2>
              <p className="text-gray leading-relaxed">
                En <strong>Como el Musguito</strong>, nos comprometemos a proteger su privacidad y datos personales. 
                Esta política explica cómo recopilamos, usamos, almacenamos y protegemos su información personal 
                de acuerdo con la Ley N° 19.628 sobre Protección de la Vida Privada de Chile y el Reglamento 
                General de Protección de Datos (RGPD) de la Unión Europea.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                2. Responsable del Tratamiento
              </h2>
              <p className="text-gray leading-relaxed">
                El responsable del tratamiento de sus datos personales es:
              </p>
              <div className="bg-cream/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray">
                  <strong>Como el Musguito</strong><br />
                  Santa Isabel 676, Providencia, Santiago, Chile<br />
                  <strong>Email:</strong> hola@comoelmusguito.cl<br />
                  <strong>Teléfono:</strong> +56 9 6656 3208
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                3. Datos que Recopilamos
              </h2>
              <p className="text-gray leading-relaxed mb-4">
                Recopilamos los siguientes tipos de información:
              </p>
              
              <div className="space-y-4">
                <div className="bg-cream/50 rounded-lg p-4">
                  <h3 className="font-semibold text-forest mb-2">Datos de Identificación</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray text-sm ml-4">
                    <li>Nombre completo</li>
                    <li>Dirección de correo electrónico</li>
                    <li>Número de teléfono (opcional)</li>
                  </ul>
                </div>

                <div className="bg-cream/50 rounded-lg p-4">
                  <h3 className="font-semibold text-forest mb-2">Datos de Transacciones</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray text-sm ml-4">
                    <li>Historial de compras</li>
                    <li>Información de pago (procesada por Flow, no almacenamos datos de tarjetas)</li>
                    <li>Dirección de entrega (si aplica)</li>
                  </ul>
                </div>

                <div className="bg-cream/50 rounded-lg p-4">
                  <h3 className="font-semibold text-forest mb-2">Datos de Uso</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray text-sm ml-4">
                    <li>Dirección IP</li>
                    <li>Tipo de navegador y dispositivo</li>
                    <li>Páginas visitadas y tiempo de permanencia</li>
                    <li>Progreso en cursos online</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                4. Finalidad del Tratamiento
              </h2>
              <p className="text-gray leading-relaxed mb-4">
                Utilizamos sus datos personales para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray ml-4">
                <li>Procesar y gestionar sus pedidos y compras</li>
                <li>Proporcionar acceso a cursos online y talleres</li>
                <li>Comunicarnos con usted sobre su cuenta y pedidos</li>
                <li>Enviar información sobre productos, ofertas y novedades (con su consentimiento)</li>
                <li>Mejorar nuestros servicios y experiencia de usuario</li>
                <li>Cumplir con obligaciones legales y fiscales</li>
                <li>Prevenir fraudes y garantizar la seguridad</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                5. Base Legal
              </h2>
              <p className="text-gray leading-relaxed">
                El tratamiento de sus datos se basa en:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray ml-4 mt-4">
                <li><strong>Ejecución de contrato:</strong> Para procesar compras y proporcionar servicios</li>
                <li><strong>Consentimiento:</strong> Para envío de comunicaciones comerciales</li>
                <li><strong>Interés legítimo:</strong> Para mejorar servicios y seguridad</li>
                <li><strong>Obligación legal:</strong> Para cumplir con requerimientos fiscales y legales</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                6. Compartir Datos con Terceros
              </h2>
              <p className="text-gray leading-relaxed">
                Compartimos sus datos únicamente con:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray ml-4 mt-4">
                <li><strong>Flow:</strong> Procesador de pagos (datos de transacción)</li>
                <li><strong>Resend:</strong> Servicio de envío de emails (dirección de correo)</li>
                <li><strong>Sanity:</strong> Plataforma CMS para almacenamiento de datos</li>
                <li><strong>Vercel:</strong> Proveedor de hosting (datos técnicos)</li>
                <li><strong>Google reCAPTCHA:</strong> Verificación de seguridad (datos de navegación)</li>
              </ul>
              <p className="text-gray leading-relaxed mt-4">
                Todos estos proveedores cumplen con estándares de seguridad y protección de datos. 
                No vendemos ni alquilamos sus datos personales a terceros.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                7. Seguridad de los Datos
              </h2>
              <p className="text-gray leading-relaxed">
                Implementamos medidas técnicas y organizativas para proteger sus datos personales:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray ml-4 mt-4">
                <li>Cifrado de datos en tránsito (HTTPS/SSL)</li>
                <li>Almacenamiento seguro en servidores protegidos</li>
                <li>Contraseñas encriptadas (bcrypt)</li>
                <li>Acceso restringido a datos personales</li>
                <li>Actualizaciones regulares de seguridad</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                8. Retención de Datos
              </h2>
              <p className="text-gray leading-relaxed">
                Conservamos sus datos personales durante el tiempo necesario para cumplir con las finalidades 
                descritas, salvo que la ley requiera un período de retención más largo. En general:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray ml-4 mt-4">
                <li><strong>Datos de cuenta:</strong> Mientras la cuenta esté activa</li>
                <li><strong>Datos de transacciones:</strong> 7 años (requerimiento fiscal)</li>
                <li><strong>Datos de marketing:</strong> Hasta que retire su consentimiento</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                9. Sus Derechos
              </h2>
              <p className="text-gray leading-relaxed mb-4">
                Usted tiene derecho a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray ml-4">
                <li><strong>Acceso:</strong> Solicitar información sobre sus datos personales</li>
                <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos</li>
                <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos</li>
                <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
                <li><strong>Limitación:</strong> Solicitar la limitación del tratamiento</li>
                <li><strong>Retirar consentimiento:</strong> En cualquier momento para comunicaciones comerciales</li>
              </ul>
              <p className="text-gray leading-relaxed mt-4">
                Para ejercer estos derechos, contáctenos en <strong>hola@comoelmusguito.cl</strong>
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                10. Cookies y Tecnologías Similares
              </h2>
              <p className="text-gray leading-relaxed">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia. Para más información, 
                consulte nuestra <Link href="/politica-cookies" className="text-musgo hover:text-forest underline">
                  Política de Cookies
                </Link> (si aplica).
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                11. Menores de Edad
              </h2>
              <p className="text-gray leading-relaxed">
                Nuestros servicios están dirigidos a personas mayores de 18 años. No recopilamos intencionalmente 
                datos de menores de edad. Si un menor nos proporciona datos, los eliminaremos inmediatamente 
                al tener conocimiento.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                12. Cambios a esta Política
              </h2>
              <p className="text-gray leading-relaxed">
                Podemos actualizar esta política ocasionalmente. Le notificaremos de cambios significativos 
                por email o mediante un aviso en nuestro sitio web. La fecha de última actualización se 
                indica al inicio de este documento.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                13. Contacto
              </h2>
              <p className="text-gray leading-relaxed">
                Para consultas sobre esta política o para ejercer sus derechos, contáctenos:
              </p>
              <div className="bg-cream/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray">
                  <strong>Email:</strong> hola@comoelmusguito.cl<br />
                  <strong>Teléfono:</strong> +56 9 6656 3208<br />
                  <strong>Dirección:</strong> Santa Isabel 676, Providencia, Santiago
                </p>
              </div>
            </section>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

