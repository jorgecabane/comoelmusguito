/**
 * Página: Contacto
 */

'use client';

import { useState } from 'react';
import { FadeIn } from '@/components/animations';
import { Mail, Phone, MapPin, Send, Instagram, Youtube } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import Link from 'next/link';

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el mensaje');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-16">
      <div className="container max-w-6xl">
        <FadeIn immediate={true}>
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-musgo/20 mb-6">
              <Mail className="text-musgo" size={32} />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-4">
              Contáctanos
            </h1>
            <p className="text-gray text-lg">
              Estamos aquí para ayudarte. Escríbenos y te responderemos lo antes posible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-2xl font-semibold text-forest mb-6">
                  Información de Contacto
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-musgo/20 flex items-center justify-center shrink-0">
                      <MapPin className="text-musgo" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-forest mb-1">Dirección</h3>
                      <p className="text-gray text-sm">
                        Santa Isabel 676<br />
                        Providencia, Santiago, Chile
                      </p>
                      <a
                        href="https://maps.app.goo.gl/ZrVNsERx7zXKhtUA8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-musgo hover:text-forest underline text-sm mt-2 inline-block"
                      >
                        Ver en Google Maps
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-vida/20 flex items-center justify-center shrink-0">
                      <Phone className="text-vida" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-forest mb-1">Teléfono</h3>
                      <a
                        href="tel:+56966563208"
                        className="text-gray hover:text-musgo transition-colors text-sm"
                      >
                        +56 9 6656 3208
                      </a>
                      <p className="text-gray text-xs mt-1">
                        Lunes a Viernes: 10:00 - 18:00 hrs<br />
                        Sábados: 10:00 - 14:00 hrs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-forest/20 flex items-center justify-center shrink-0">
                      <Mail className="text-forest" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-forest mb-1">Email</h3>
                      <a
                        href="mailto:hola@comoelmusguito.cl"
                        className="text-gray hover:text-musgo transition-colors text-sm"
                      >
                        hola@comoelmusguito.cl
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="font-semibold text-forest mb-4">Síguenos</h3>
                <div className="flex gap-4">
                  <a
                    href="https://www.instagram.com/comoelmusguito"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg bg-cream/50 hover:bg-cream flex items-center justify-center transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="text-forest" size={24} />
                  </a>
                  <a
                    href="https://www.youtube.com/@comoelmusguito"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg bg-cream/50 hover:bg-cream flex items-center justify-center transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="text-forest" size={24} />
                  </a>
                </div>
              </div>

              {/* Map */}
              <div className="bg-cream/50 rounded-xl p-4">
                <a
                  href="https://maps.app.goo.gl/ZrVNsERx7zXKhtUA8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-[300px] rounded-lg overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-musgo/20 to-vida/20 flex items-center justify-center z-10 group-hover:opacity-0 transition-opacity">
                    <div className="text-center">
                      <MapPin className="text-musgo mx-auto mb-2" size={32} />
                      <p className="text-forest font-medium">Ver en Google Maps</p>
                      <p className="text-gray text-sm mt-1">Haz clic para abrir</p>
                    </div>
                  </div>
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3329.1234567890123!2d-70.61000000000001!3d-33.45000000000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDI3JzAwLjAiUyA3MMKwMzYnMzYuMCJX!5e0!3m2!1ses!2scl!4v1234567890123!5m2!1ses!2scl"
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: '12px' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación Como el Musguito"
                    className="pointer-events-none"
                  />
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="font-display text-2xl font-semibold text-forest mb-6">
                Envíanos un Mensaje
              </h2>
              {success ? (
                <div className="bg-vida/10 border border-vida rounded-xl p-6 text-center">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="font-semibold text-forest mb-2">¡Mensaje enviado!</h3>
                  <p className="text-gray text-sm mb-4">
                    Te responderemos lo antes posible.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => setSuccess(false)}
                  >
                    Enviar otro mensaje
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-forest mb-2">
                      Nombre *
                    </label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Tu nombre"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-forest mb-2">
                      Email *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-forest mb-2">
                      Teléfono
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-forest mb-2">
                      Asunto *
                    </label>
                    <Input
                      id="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="¿Sobre qué quieres consultar?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-forest mb-2">
                      Mensaje *
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Escribe tu mensaje aquí..."
                      className="w-full px-4 py-3 rounded-lg border border-gray/20 focus:border-musgo focus:ring-2 focus:ring-musgo/20 outline-none transition-colors text-forest placeholder:text-gray/50"
                    />
                  </div>

                  {error && (
                    <div className="bg-error/10 border border-error rounded-lg p-4">
                      <p className="text-error text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                    icon={<Send size={20} />}
                  >
                    {loading ? 'Enviando...' : 'Enviar Mensaje'}
                  </Button>

                  <p className="text-xs text-gray/60 text-center">
                    Al enviar este formulario, aceptas nuestra{' '}
                    <Link href="/privacidad" className="text-musgo hover:text-forest underline">
                      Política de Privacidad
                    </Link>
                  </p>
                </form>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

