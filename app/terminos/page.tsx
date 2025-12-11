/**
 * Página: Términos y Condiciones
 */

import { FadeIn } from '@/components/animations';
import { FileText, Scale } from 'lucide-react';
import Link from 'next/link';
import { getFormattedPhoneNumber } from '@/lib/config/contact';

export const metadata = {
  title: 'Términos y Condiciones | Como el Musguito',
  description: 'Términos y condiciones de uso de la plataforma y compra de productos de Como el Musguito.',
};

export default function TerminosPage() {
  return (
    <div className="pt-32 pb-16">
      <div className="container max-w-4xl">
        <FadeIn immediate={true}>
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-musgo/20 mb-6">
              <Scale className="text-musgo" size={32} />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-4">
              Términos y Condiciones
            </h1>
            <p className="text-gray text-lg">
              Última actualización: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                1. Aceptación de los Términos
              </h2>
              <p className="text-gray leading-relaxed">
                Al acceder y utilizar el sitio web <strong>comoelmusguito.cl</strong> y realizar compras a través de nuestra plataforma, 
                usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, 
                no debe utilizar nuestros servicios.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                2. Información de la Empresa
              </h2>
              <p className="text-gray leading-relaxed">
                <strong>Como el Musguito</strong> es una empresa dedicada a la creación y venta de terrarios artesanales, 
                cursos online y talleres presenciales.
              </p>
              <div className="bg-cream/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray">
                  <strong>Dirección:</strong> Santa Isabel 676, Providencia, Santiago, Chile<br />
                  <strong>Email:</strong> hola@comoelmusguito.cl<br />
                  <strong>Teléfono:</strong> {getFormattedPhoneNumber()}
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                3. Productos y Servicios
              </h2>
              <p className="text-gray leading-relaxed mb-4">
                Ofrecemos los siguientes productos y servicios:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray ml-4">
                <li><strong>Terrarios artesanales:</strong> Productos físicos únicos, hechos a mano</li>
                <li><strong>Cursos online:</strong> Contenido educativo digital sobre creación y cuidado de terrarios</li>
                <li><strong>Talleres presenciales:</strong> Experiencias educativas en persona</li>
              </ul>
              <p className="text-gray leading-relaxed mt-4">
                Todos los productos están sujetos a disponibilidad. Nos reservamos el derecho de modificar, 
                suspender o discontinuar cualquier producto o servicio en cualquier momento.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                4. Precios y Pagos
              </h2>
              <p className="text-gray leading-relaxed">
                Los precios de nuestros productos están expresados en pesos chilenos (CLP) para productos físicos 
                y en dólares estadounidenses (USD) para cursos online. Todos los precios incluyen impuestos aplicables.
              </p>
              <p className="text-gray leading-relaxed mt-4">
                Aceptamos pagos a través de <strong>Flow</strong> (tarjetas de crédito, débito y transferencias). 
                El pago debe realizarse en su totalidad antes de la entrega o activación del servicio.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                5. Envíos y Entregas
              </h2>
              <p className="text-gray leading-relaxed">
                Los terrarios se entregan únicamente mediante <strong>retiro en persona</strong> en nuestra ubicación 
                en Providencia, Santiago. No realizamos envíos a domicilio debido a la naturaleza frágil de los productos.
              </p>
              <p className="text-gray leading-relaxed mt-4">
                Los cursos online se activan inmediatamente después de la confirmación del pago. 
                El acceso se otorga a través de la cuenta del usuario en nuestro sitio web.
              </p>
              <p className="text-gray leading-relaxed mt-4">
                Para más información sobre envíos y devoluciones, consulte nuestra página de{' '}
                <Link href="/envios" className="text-musgo hover:text-forest underline">
                  Envíos y Devoluciones
                </Link>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                6. Derecho de Retracto
              </h2>
              <p className="text-gray leading-relaxed">
                De acuerdo con la Ley del Consumidor chilena, usted tiene derecho a retractarse de la compra 
                dentro de <strong>10 días hábiles</strong> desde la recepción del producto, sin necesidad de 
                justificar su decisión.
              </p>
              <p className="text-gray leading-relaxed mt-4">
                Este derecho no aplica a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray ml-4">
                <li>Productos personalizados o hechos a medida</li>
                <li>Productos perecederos o con fecha de vencimiento</li>
                <li>Contenido digital (cursos online) una vez iniciado el acceso</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                7. Propiedad Intelectual
              </h2>
              <p className="text-gray leading-relaxed">
                Todo el contenido del sitio web, incluyendo pero no limitado a textos, imágenes, logotipos, 
                videos y diseño, es propiedad de Como el Musguito y está protegido por las leyes de propiedad 
                intelectual chilenas e internacionales.
              </p>
              <p className="text-gray leading-relaxed mt-4">
                Los cursos online y su contenido son para uso personal únicamente. Está prohibida la reproducción, 
                distribución, modificación o comercialización del contenido sin autorización expresa.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                8. Cuentas de Usuario
              </h2>
              <p className="text-gray leading-relaxed">
                Al crear una cuenta, usted es responsable de mantener la confidencialidad de su contraseña 
                y de todas las actividades que ocurran bajo su cuenta. Debe notificarnos inmediatamente de 
                cualquier uso no autorizado.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                9. Limitación de Responsabilidad
              </h2>
              <p className="text-gray leading-relaxed">
                Como el Musguito no se hace responsable por daños indirectos, incidentales o consecuentes 
                derivados del uso de nuestros productos o servicios. Nuestra responsabilidad se limita al 
                valor del producto o servicio adquirido.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                10. Modificaciones
              </h2>
              <p className="text-gray leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones 
                entrarán en vigor al ser publicadas en el sitio web. Es su responsabilidad revisar periódicamente 
                estos términos.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                11. Ley Aplicable y Jurisdicción
              </h2>
              <p className="text-gray leading-relaxed">
                Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa será resuelta 
                en los tribunales competentes de Santiago, Chile.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                12. Contacto
              </h2>
              <p className="text-gray leading-relaxed">
                Para consultas sobre estos términos, puede contactarnos en:
              </p>
              <div className="bg-cream/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray">
                  <strong>Email:</strong> hola@comoelmusguito.cl<br />
                  <strong>Teléfono:</strong> {getFormattedPhoneNumber()}<br />
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

