/**
 * Footer Principal
 * Links, redes sociales, newsletter
 */

import Link from 'next/link';
import { Instagram, Youtube, Mail, Leaf } from 'lucide-react';
import { Logo } from './Logo';
import { NewsletterForm } from './NewsletterForm';

const footerLinks = {
  shop: [
    { name: 'Todos los Terrarios', href: '/terrarios' },
  ],
  learn: [
    { name: 'Cursos Online', href: '/cursos' },
    { name: 'Talleres Presenciales', href: '/talleres' },
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
            <div className="max-w-md mx-auto">
              <NewsletterForm source="footer-home" variant="footer" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1 space-y-4 text-center md:text-left">
            <div className="flex justify-center md:justify-start">
              <Logo size="md" textColor="text-white"/>
            </div>
            <p className="text-cream/70 text-sm leading-relaxed">
              Crea vida en cualquier lugar. Terrarios artesanales y educación
              para conectar con la naturaleza.
            </p>
            {/* Social Links */}
            <div className="flex gap-4 pt-2 justify-center md:justify-start">
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
          <div className="text-center md:text-left">
            <h4 className="font-display text-lg font-semibold mb-4 !text-white">Tienda</h4>
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
          <div className="text-center md:text-left">
            <h4 className="font-display text-lg font-semibold mb-4 !text-white">Aprender</h4>
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
          <div className="text-center md:text-left">
            <h4 className="font-display text-lg font-semibold mb-4 !text-white">Nosotros</h4>
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
          <div className="text-center md:text-left">
            <h4 className="font-display text-lg font-semibold mb-4 !text-white">Legal</h4>
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

