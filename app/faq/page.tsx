/**
 * Página: Preguntas Frecuentes (FAQ)
 */

'use client';

import { useState, useEffect } from 'react';
import { FadeIn } from '@/components/animations';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { FAQSchema } from '@/lib/seo/schema';
import { getTelLink, getFormattedPhoneNumber } from '@/lib/config/contact';

const faqCategories = {
  productos: {
    title: 'Productos',
    icon: '🌿',
    questions: [
      {
        question: '¿Los terrarios son únicos?',
        answer: 'Sí, cada terrario es hecho a mano de forma artesanal, por lo que cada pieza es única. Aunque pueden tener similitudes en diseño, no encontrarás dos terrarios exactamente iguales.',
      },
      {
        question: '¿Qué incluye un terrario?',
        answer: 'Cada terrario incluye el contenedor, plantas seleccionadas, musgo nativo recolectado sustentablemente, sustrato especializado, y elementos decorativos (piedras, ramas, etc.). También recibirás una guía básica de cuidados.',
      },
      {
        question: '¿Cuánto duran los terrarios?',
        answer: 'Con los cuidados adecuados, nuestros terrarios pueden durar años. Son ecosistemas autosuficientes que, con el mantenimiento correcto (luz, agua ocasional), pueden prosperar indefinidamente.',
      },
      {
        question: '¿Puedo elegir las plantas de mi terrario?',
        answer: 'Ofrecemos terrarios con plantas pre-seleccionadas según el tipo de ecosistema. Si buscas algo personalizado, contáctanos y podemos diseñar un terrario según tus preferencias.',
      },
    ],
  },
  compra: {
    title: 'Compra y Pago',
    icon: '💳',
    questions: [
      {
        question: '¿Qué métodos de pago aceptan?',
        answer: 'Aceptamos pagos a través de Flow, que incluye tarjetas de crédito, débito y transferencias bancarias. Todos los pagos son procesados de forma segura.',
      },
      {
        question: '¿Los precios incluyen impuestos?',
        answer: 'Sí, todos los precios mostrados incluyen los impuestos aplicables. Los terrarios se muestran en CLP (pesos chilenos) y los cursos online en USD (dólares).',
      },
      {
        question: '¿Puedo comprar como regalo?',
        answer: '¡Por supuesto! Puedes comprar cualquier producto como regalo. Al momento del retiro, podemos incluir una tarjeta de regalo personalizada si lo deseas.',
      },
      {
        question: '¿Ofrecen factura?',
        answer: 'Sí, emitimos boletas y facturas según corresponda. Al realizar tu compra, recibirás la documentación fiscal correspondiente por email.',
      },
    ],
  },
  envios: {
    title: 'Envíos y Retiro',
    icon: '🚚',
    questions: [
      {
        question: '¿Hacen envíos a domicilio?',
        answer: 'No, debido a la naturaleza frágil y única de nuestros terrarios, solo realizamos entregas mediante retiro en persona en nuestra ubicación en Providencia, Santiago.',
      },
      {
        question: '¿Dónde puedo retirar mi terrario?',
        answer: 'Puedes retirar tu terrario en Santa Isabel 676, Providencia, Santiago. Te enviaremos las coordenadas exactas y horarios de atención después de tu compra.',
      },
      {
        question: '¿Cuánto tiempo tarda en estar listo mi terrario?',
        answer: 'Los terrarios disponibles en stock pueden retirarse inmediatamente después de coordinar. Si es un pedido personalizado, el tiempo puede variar entre 1-2 semanas.',
      },
      {
        question: '¿Puedo enviar a alguien a retirar por mí?',
        answer: 'Sí, puedes enviar a otra persona. Solo necesitas indicarnos el nombre de la persona autorizada al momento de coordinar el retiro.',
      },
    ],
  },
  cursos: {
    title: 'Cursos Online',
    icon: '🎓',
    questions: [
      {
        question: '¿Cómo accedo a mi curso después de comprarlo?',
        answer: 'Después de confirmar tu pago, recibirás un email con las instrucciones. Si ya tienes cuenta, inicia sesión y verás el curso en "Mis Cursos". Si no tienes cuenta, puedes crearla con el mismo email de compra.',
      },
      {
        question: '¿Por cuánto tiempo tengo acceso al curso?',
        answer: 'Tienes acceso de por vida al curso una vez comprado. Puedes ver las lecciones las veces que quieras y a tu ritmo.',
      },
      {
        question: '¿Puedo descargar el contenido del curso?',
        answer: 'Depende del curso. Algunos materiales son descargables (guías, PDFs), pero los videos se ven online para proteger el contenido.',
      },
      {
        question: '¿Ofrecen certificados?',
        answer: 'Al completar un curso, puedes descargar un certificado de finalización desde tu cuenta.',
      },
    ],
  },
  talleres: {
    title: 'Talleres Presenciales',
    icon: '🤝',
    questions: [
      {
        question: '¿Dónde se realizan los talleres?',
        answer: 'Los talleres se realizan en nuestra ubicación en Providencia o en el lugar indicado en la descripción del taller. Recibirás la información completa después de reservar.',
      },
      {
        question: '¿Qué incluye el taller?',
        answer: 'Cada taller incluye todos los materiales necesarios, instrucción personalizada, y el terrario que crees durante la sesión. También incluye una guía de cuidados para llevarte a casa.',
      },
      {
        question: '¿Puedo cancelar o cambiar mi reserva?',
        answer: 'Sí, puedes cancelar o cambiar tu reserva. Las políticas de cancelación varían según la anticipación. Consulta nuestra página de Envíos y Devoluciones para más detalles.',
      },
      {
        question: '¿Necesito experiencia previa?',
        answer: 'No, nuestros talleres están diseñados para todos los niveles, desde principiantes hasta avanzados. Nuestro instructor te guiará paso a paso.',
      },
    ],
  },
  cuidados: {
    title: 'Cuidados',
    icon: '💚',
    questions: [
      {
        question: '¿Cuánta agua necesita mi terrario?',
        answer: 'Los terrarios cerrados necesitan muy poca agua, generalmente una vez al mes o cuando notes que no hay condensación. Los abiertos pueden necesitar riego más frecuente. La guía de cuidados que recibes tiene detalles específicos.',
      },
      {
        question: '¿Dónde debo colocar mi terrario?',
        answer: 'La mayoría de nuestros terrarios necesitan luz indirecta brillante. Evita la luz directa del sol y las corrientes de aire. La ubicación ideal es cerca de una ventana con luz filtrada.',
      },
      {
        question: '¿Qué hago si mi terrario se ve mal?',
        answer: 'Contáctanos inmediatamente. Muchos problemas tienen solución fácil si se detectan a tiempo. Te ayudaremos a diagnosticar y resolver el problema.',
      },
      {
        question: '¿Ofrecen soporte después de la compra?',
        answer: '¡Sí! Estamos aquí para ayudarte. Puedes contactarnos por email o teléfono con cualquier pregunta sobre el cuidado de tu terrario.',
      },
    ],
  },
};

export default function FAQPage() {
  const [openCategory, setOpenCategory] = useState<string | null>('productos');
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);

  // Logs de debugging y forzar montaje
  useEffect(() => {
    console.log('[FAQ] Componente montado');
    setIsMounted(true);
    
    // Log para verificar que el contenido está renderizado
    const timer = setTimeout(() => {
      const content = document.querySelector('[data-faq-content]');
      console.log('[FAQ] Contenido encontrado:', !!content);
      console.log('[FAQ] Window height:', window.innerHeight);
      console.log('[FAQ] Scroll position:', window.scrollY);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const toggleQuestion = (category: string, index: number) => {
    const key = `${category}-${index}`;
    const newOpen = new Set(openQuestions);
    if (newOpen.has(key)) {
      newOpen.delete(key);
    } else {
      newOpen.add(key);
    }
    setOpenQuestions(newOpen);
  };

  // Preparar datos para schema SEO
  const allQuestions = Object.values(faqCategories).flatMap(cat =>
    cat.questions.map(q => ({ question: q.question, answer: q.answer }))
  );

  // No renderizar hasta que esté montado para evitar problemas de hidratación
  if (!isMounted) {
    return (
      <div className="pt-32 pb-16">
        <div className="container max-w-4xl">
          <div className="text-center">
            <p className="text-muted">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <FAQSchema questions={allQuestions} />
      <div className="pt-32 pb-16">
        <div className="container max-w-4xl" data-faq-content>
          <FadeIn immediate={true}>
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tint/20 mb-6">
                <HelpCircle className="text-brand" size={32} />
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-fg mb-4">
                Preguntas Frecuentes
              </h1>
              <p className="text-muted text-lg">
                Encuentra respuestas a las preguntas más comunes
              </p>
            </div>

            {/* FAQ Content */}
            <div className="space-y-6">
              {Object.entries(faqCategories).map(([key, category]) => (
                <div key={key} className="bg-surface rounded-xl border border-line overflow-hidden">
                  <button
                    onClick={() => setOpenCategory(openCategory === key ? null : key)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-bg/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <h2 className="font-display text-xl font-semibold text-fg">
                        {category.title}
                      </h2>
                    </div>
                    {openCategory === key ? (
                      <ChevronUp className="text-muted" size={24} />
                    ) : (
                      <ChevronDown className="text-muted" size={24} />
                    )}
                  </button>

                  {openCategory === key && (
                    <div className="border-t border-line">
                      {category.questions.map((faq, index) => {
                        const questionKey = `${key}-${index}`;
                        const isOpen = openQuestions.has(questionKey);
                        return (
                          <div key={index} className="border-b border-line last:border-0">
                            <button
                              onClick={() => toggleQuestion(key, index)}
                              className="w-full flex items-start justify-between p-6 text-left hover:bg-bg/30 transition-colors"
                            >
                              <h3 className="font-semibold text-fg pr-4 flex-1">
                                {faq.question}
                              </h3>
                              {isOpen ? (
                                <ChevronUp className="text-brand shrink-0" size={20} />
                              ) : (
                                <ChevronDown className="text-muted shrink-0" size={20} />
                              )}
                            </button>
                            {isOpen && (
                              <div className="px-6 pb-6">
                                <p className="text-muted leading-relaxed">{faq.answer}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contact Section */}
            <div className="mt-12 bg-brand/10 rounded-xl p-8 text-center">
              <h2 className="font-display text-2xl font-semibold text-fg mb-4">
                ¿No encontraste tu respuesta?
              </h2>
              <p className="text-muted mb-6">
                Estamos aquí para ayudarte. Contáctanos y te responderemos lo antes posible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:hola@comoelmusguito.cl"
                  className="inline-flex items-center justify-center px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
                >
                  Enviar Email
                </a>
                <a
                  href={getTelLink()}
                  className="inline-flex items-center justify-center px-6 py-3 bg-scrim text-white rounded-lg hover:bg-scrim/90 transition-colors"
                >
                  Llamar: {getFormattedPhoneNumber()}
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </>
  );
}

