/**
 * Página: Envíos y Devoluciones
 */

import { FadeIn } from '@/components/animations';
import { Truck, Package, RefreshCw, MapPin } from 'lucide-react';
import Link from 'next/link';
import { getFormattedPhoneNumber } from '@/lib/config/contact';

export const metadata = {
  title: 'Envíos y Devoluciones | Como el Musguito',
  description: 'Política de envíos, entregas y devoluciones de Como el Musguito.',
};

export default function EnviosPage() {
  return (
    <div className="pt-32 pb-16">
      <div className="container max-w-4xl">
        <FadeIn immediate={true}>
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/20 mb-6">
              <Truck className="text-brand" size={32} />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-fg mb-4">
              Envíos y Devoluciones
            </h1>
            <p className="text-muted text-lg">
              Información sobre entregas, retiros y políticas de devolución
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none space-y-8">
            {/* Envíos */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-fg mb-4 flex items-center gap-2">
                <Package className="text-brand" size={24} />
                Envíos y Entregas
              </h2>
              
              <div className="bg-olivo/10 border-l-4 border-olivo rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-fg mb-2">⚠️ Importante</h3>
                <p className="text-muted text-sm">
                  Los terrarios son productos frágiles y únicos. Por su naturaleza artesanal y delicada, 
                  <strong> solo realizamos entregas mediante retiro en persona</strong> en nuestra ubicación.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-bg/50 rounded-lg p-6">
                  <h3 className="font-semibold text-fg mb-3">📍 Retiro en Persona</h3>
                  <div className="space-y-3 text-muted text-sm">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-brand shrink-0 mt-1" size={20} />
                      <div>
                        <p className="font-medium text-fg mb-1">Ubicación:</p>
                        <p>Santa Isabel 676, Providencia, Santiago</p>
                        <a 
                          href="https://maps.app.goo.gl/ZrVNsERx7zXKhtUA8" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-brand hover:text-fg underline mt-1 inline-block"
                        >
                          Ver en Google Maps
                        </a>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-fg mb-1">Horarios de Retiro:</p>
                      <p>Lunes a Viernes: 10:00 - 18:00 hrs<br />
                      Sábados: 10:00 - 14:00 hrs</p>
                    </div>
                    <div>
                      <p className="font-medium text-fg mb-1">Proceso:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Realice su compra online</li>
                        <li>Recibirá un email de confirmación con los detalles</li>
                        <li>Coordine el retiro contactándonos al {getFormattedPhoneNumber()}</li>
                        <li>Retire su terrario en nuestra ubicación</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-bg/50 rounded-lg p-6">
                  <h3 className="font-semibold text-fg mb-3">🎓 Cursos Online</h3>
                  <p className="text-muted text-sm">
                    Los cursos online se activan <strong>inmediatamente</strong> después de la confirmación del pago. 
                    Recibirá un email con las instrucciones para acceder a su cuenta y comenzar el curso.
                  </p>
                </div>

                <div className="bg-bg/50 rounded-lg p-6">
                  <h3 className="font-semibold text-fg mb-3">🤝 Talleres Presenciales</h3>
                  <p className="text-muted text-sm">
                    Los talleres se realizan en nuestra ubicación o en el lugar indicado en la descripción del taller. 
                    Recibirá información detallada por email después de la reserva.
                  </p>
                </div>
              </div>
            </section>

            {/* Devoluciones */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-fg mb-4 flex items-center gap-2">
                <RefreshCw className="text-brand" size={24} />
                Devoluciones y Cambios
              </h2>

              <div className="space-y-4">
                <div className="bg-bg/50 rounded-lg p-6">
                  <h3 className="font-semibold text-fg mb-3">📦 Terrarios</h3>
                  <p className="text-muted text-sm mb-3">
                    De acuerdo con la <strong>Ley del Consumidor chilena</strong>, usted tiene derecho a retractarse 
                    de la compra dentro de <strong>10 días hábiles</strong> desde la recepción del producto.
                  </p>
                  <div className="bg-olivo/10 rounded-lg p-4 mt-4">
                    <p className="text-sm text-muted font-medium mb-2">Condiciones para devolución:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted text-sm ml-2">
                      <li>El producto debe estar en su estado original</li>
                      <li>Debe incluir todos los accesorios y documentación</li>
                      <li>No debe haber sido usado o dañado</li>
                      <li>Debe contactarnos dentro del plazo de 10 días hábiles</li>
                    </ul>
                  </div>
                  <p className="text-muted text-sm mt-4">
                    <strong>Excepciones:</strong> No aplica el derecho de retracto para productos personalizados 
                    o hechos a medida según sus especificaciones.
                  </p>
                </div>

                <div className="bg-bg/50 rounded-lg p-6">
                  <h3 className="font-semibold text-fg mb-3">🎓 Cursos Online</h3>
                  <p className="text-muted text-sm mb-3">
                    Los cursos online <strong>no son reembolsables</strong> una vez que se ha iniciado el acceso. 
                    Sin embargo, si tiene problemas técnicos o no puede acceder al contenido, contáctenos y 
                    resolveremos la situación.
                  </p>
                  <p className="text-muted text-sm">
                    Si solicita la devolución <strong>antes de iniciar el curso</strong> y dentro de 7 días 
                    desde la compra, evaluaremos su solicitud caso a caso.
                  </p>
                </div>

                <div className="bg-bg/50 rounded-lg p-6">
                  <h3 className="font-semibold text-fg mb-3">🤝 Talleres Presenciales</h3>
                  <p className="text-muted text-sm mb-3">
                    Las cancelaciones y cambios están sujetos a las siguientes condiciones:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted text-sm ml-4">
                    <li><strong>Cancelación con 7+ días de anticipación:</strong> Reembolso completo</li>
                    <li><strong>Cancelación con 3-7 días de anticipación:</strong> Reembolso del 50%</li>
                    <li><strong>Cancelación con menos de 3 días:</strong> No reembolsable</li>
                    <li><strong>Cambio de fecha:</strong> Disponible según disponibilidad, sin costo adicional</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Proceso de Devolución */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-fg mb-4">
                Proceso de Devolución
              </h2>
              <div className="bg-bg/50 rounded-lg p-6">
                <ol className="list-decimal list-inside space-y-3 text-muted">
                  <li>
                    <strong>Contacte con nosotros:</strong> Envíe un email a hola@comoelmusguito.cl o llame 
                    al {getFormattedPhoneNumber()} indicando el número de orden y motivo de la devolución.
                  </li>
                  <li>
                    <strong>Evaluación:</strong> Revisaremos su solicitud y le confirmaremos si procede la devolución.
                  </li>
                  <li>
                    <strong>Devolución del producto:</strong> Debe devolver el producto a nuestra ubicación 
                    en el mismo estado en que lo recibió.
                  </li>
                  <li>
                    <strong>Reembolso:</strong> Una vez recibido y verificado el producto, procesaremos el 
                    reembolso en un plazo de 5-10 días hábiles a través del mismo método de pago utilizado.
                  </li>
                </ol>
              </div>
            </section>

            {/* Garantías */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-fg mb-4">
                Garantías
              </h2>
              <div className="bg-bg/50 rounded-lg p-6">
                <p className="text-muted text-sm mb-4">
                  Todos nuestros terrarios están hechos a mano con materiales de calidad. Ofrecemos garantía 
                  por defectos de fabricación durante <strong>30 días</strong> desde la compra.
                </p>
                <p className="text-muted text-sm">
                  Si su terrario presenta algún defecto de fabricación, contáctenos inmediatamente y resolveremos 
                  el problema, ya sea mediante reparación, reemplazo o reembolso, según corresponda.
                </p>
              </div>
            </section>

            {/* Contacto */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-fg mb-4">
                ¿Necesitas Ayuda?
              </h2>
              <div className="bg-brand/10 rounded-lg p-6">
                <p className="text-muted text-sm mb-4">
                  Si tienes dudas sobre envíos, devoluciones o necesitas coordinar un retiro, contáctanos:
                </p>
                <div className="space-y-2 text-sm text-muted">
                  <p><strong>Email:</strong> hola@comoelmusguito.cl</p>
                  <p><strong>Teléfono:</strong> {getFormattedPhoneNumber()}</p>
                  <p><strong>Dirección:</strong> Santa Isabel 676, Providencia, Santiago</p>
                  <p><strong>Horario de atención:</strong> Lunes a Viernes 10:00 - 18:00 hrs</p>
                </div>
              </div>
            </section>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

