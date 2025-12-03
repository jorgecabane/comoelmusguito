/**
 * Footer Principal
 * Links, redes sociales, newsletter
 */

import Link from 'next/link';
import { Instagram, Youtube, Mail, Leaf } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Logo } from './Logo';

const footerLinks = {
  shop: [
    { name: 'Todos los Terrarios', href: '/terrarios' },
    { name: 'Terrarios Bosque', href: '/terrarios?category=bosque' },
    { name: 'Terrarios Desierto', href: '/terrarios?category=desierto' },
    { name: 'Regalos', href: '/terrarios?category=regalo' },
  ],
  learn: [
    { name: 'Cursos Online', href: '/cursos' },
    { name: 'Talleres Presenciales', href: '/talleres' },
    { name: 'Blog', href: '/blog' },
    { name: 'Guías Gratuitas', href: '/recursos' },
  ],
  about: [
    { name: 'Sobre el Musguito', href: '/sobre' },
    { name: 'Nuestra Historia', href: '/sobre#historia' },
    { name: 'Sustentabilidad', href: '/sustentabilidad' },
    { name: 'Contacto', href: '/contacto' },
  ],
  legal: [
    { name: 'Términos y Condiciones', href: '/terminos' },
    { name: 'Política de Privacidad', href: '/privacidad' },
    { name: 'Envíos y Devoluciones', href: '/envios' },
    { name: 'Preguntas Frecuentes', href: '/faq' },
  ],
};

const socialLinks = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/comoelmusguito',
    icon: Instagram,
    followers: '40k',
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@comoelmusguito',
    icon: Youtube,
    followers: '15k',
  },
];

export function Footer() {
  return (
    <footer className="bg-forest text-cream">
      {/* Newsletter Section */}
      <div className="border-b border-cream/10">
        <div className="container py-16">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <Leaf className="mx-auto text-vida" size={48} />
            <h3 className="font-display text-3xl font-semibold !text-white">
              Únete a la Comunidad 🌿
            </h3>
            <p className="text-cream/80 text-lg">
              Recibe tips de cuidado, nuevos terrarios y ofertas exclusivas cada semana
            </p>
            <form className="flex gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 bg-cream/10 border-cream/20 text-cream placeholder:text-cream/50"
              />
              <Button variant="primary">
                Suscribirme
              </Button>
            </form>
            <p className="text-sm text-cream/60">
              Sin spam. Solo contenido útil y hermosos terrarios 💚
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-4">
            <Logo size="md" />
            <p className="text-cream/70 text-sm leading-relaxed">
              Crea vida en cualquier lugar. Terrarios artesanales y educación
              para conectar con la naturaleza.
            </p>
            {/* Social Links */}
            <div className="flex gap-4 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                  aria-label={social.name}
                >
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-cream/5 hover:bg-vida/20 transition-colors">
                    <social.icon size={20} className="text-cream/70 group-hover:text-vida transition-colors" />
                    <span className="text-xs text-cream/60">{social.followers}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Tienda</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-cream/70 hover:text-vida transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Aprender</h4>
            <ul className="space-y-3">
              {footerLinks.learn.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-cream/70 hover:text-vida transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Nosotros</h4>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-cream/70 hover:text-vida transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-cream/70 hover:text-vida transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-cream/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-cream/60 text-sm text-center md:text-left">
            © {new Date().getFullYear()} comoelmusguito. Hecho con 💚 en Chile.
          </p>
          <div className="flex items-center gap-2 text-cream/60 text-sm">
            <Mail size={16} />
            <a
              href="mailto:hola@comoelmusguito.cl"
              className="hover:text-vida transition-colors"
            >
              hola@comoelmusguito.cl
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

