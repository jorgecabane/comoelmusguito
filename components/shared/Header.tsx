/**
 * Header Principal
 * Navegación responsive con cart y mobile menu
 */

'use client';

import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { Logo } from './Logo';
import { useCartStore } from '@/lib/store/useCartStore';

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Terrarios', href: '/terrarios' },
  { name: 'Cursos Online', href: '/cursos' },
  { name: 'Talleres', href: '/talleres' },
  { name: 'Sobre el Musguito', href: '/sobre' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Obtener cantidad de items del carrito
  const cartItemCount = useCartStore((state) => state.itemCount);

  // Scroll inteligente: visible al inicio (blanco), luego transparente al scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Cambiar estilo después de 50px de scroll
      if (currentScrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      // Siempre visible, pero se oculta al hacer scroll down (después de 400px)
      if (currentScrollY < 400) {
        setVisible(true);
      } else {
        // Ocultar al hacer scroll down, mostrar al scroll up
        if (currentScrollY > lastScrollY) {
          setVisible(false); // Scrolling down
        } else {
          setVisible(true);  // Scrolling up
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    // Inicialmente visible
    setVisible(true);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-200 transition-all duration-500 ease-in-out',
        visible ? 'translate-y-0' : '-translate-y-full',
        scrolled 
          ? 'bg-cream/30 backdrop-blur-xl shadow-natural-lg border-b border-gray/10' 
          : 'bg-white shadow-sm'
      )}
    >
      <nav className="container mx-auto">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-forest hover:text-musgo font-medium transition-colors relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-musgo group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Cart & Mobile Menu Button */}
          <div className="flex items-center gap-4">
            {/* Cart Button - Como jardín */}
            <Link 
              href="/carrito" 
              className="relative p-2 text-forest hover:text-musgo transition-all hover:scale-110 group"
              aria-label={`Carrito de compras (${cartItemCount} items)`}
            >
              <span className="text-2xl group-hover:animate-bounce">🌱</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-musgo text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-forest hover:text-musgo transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 space-y-4 border-t border-gray/20">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-forest hover:text-musgo font-medium transition-colors py-2"
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}

