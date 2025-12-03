/**
 * Menú de Usuario (Dropdown)
 * Se muestra cuando el usuario está logueado
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { User, Package, BookOpen, Calendar, HelpCircle, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface UserMenuProps {
  userName?: string | null;
  userEmail?: string | null;
  variant?: 'desktop' | 'mobile';
  onClose?: () => void; // Para cerrar el mobile menu cuando se hace click
}

export function UserMenu({ userName, userEmail, variant = 'desktop', onClose }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMenuItemClick = (tab?: string) => {
    setIsOpen(false);
    if (onClose) onClose(); // Cerrar mobile menu si existe
    if (tab) {
      router.push(`/mi-cuenta${tab ? `?tab=${tab}` : ''}`);
    }
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    if (onClose) onClose(); // Cerrar mobile menu si existe
    await signOut({ callbackUrl: '/' });
  };

  const menuItems = [
    { icon: User, label: 'Mi Cuenta', tab: 'pedidos', href: '/mi-cuenta?tab=pedidos' },
    { icon: Package, label: 'Mis Terrarios', tab: 'pedidos', href: '/mi-cuenta?tab=pedidos' },
    { icon: BookOpen, label: 'Mis Cursos', tab: 'cursos', href: '/mi-cuenta?tab=cursos' },
    { icon: Calendar, label: 'Mis Talleres', tab: 'talleres', href: '/mi-cuenta?tab=talleres' },
    {
      icon: HelpCircle,
      label: 'Ayuda',
      href: 'mailto:hola@comoelmusguito.cl?subject=Solicitud de Ayuda',
      external: true,
    },
    { icon: LogOut, label: 'Cerrar Sesión', action: handleSignOut },
  ];

  if (variant === 'mobile') {
    return (
      <div className="space-y-2">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          if (item.action) {
            return (
              <button
                key={idx}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-forest hover:bg-cream rounded-lg transition-colors"
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          }
          if (item.external) {
            return (
              <a
                key={idx}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-forest hover:bg-cream rounded-lg transition-colors"
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </a>
            );
          }
          return (
            <Link
              key={idx}
              href={item.href || '/mi-cuenta'}
              onClick={() => {
                if (onClose) onClose();
                handleMenuItemClick(item.tab);
              }}
              className="flex items-center gap-3 px-4 py-3 text-forest hover:bg-cream rounded-lg transition-colors"
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  // Desktop: Dropdown
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-forest hover:text-musgo transition-all hover:scale-110 group"
        aria-label="Menú de usuario"
      >
        <User size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-natural-lg border border-gray/10 overflow-hidden z-50">
          {/* Header del dropdown */}
          <div className="px-4 py-3 border-b border-gray/10 bg-cream/30">
            <p className="font-semibold text-forest text-sm">
              {userName || 'Usuario'}
            </p>
            {userEmail && (
              <p className="text-xs text-gray truncate">{userEmail}</p>
            )}
          </div>

          {/* Items del menú */}
          <div className="py-2">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              if (item.action) {
                return (
                  <button
                    key={idx}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-forest hover:bg-cream transition-colors"
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              }
              if (item.external) {
                return (
                  <a
                    key={idx}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-forest hover:bg-cream transition-colors"
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </a>
                );
              }
              return (
                <Link
                  key={idx}
                  href={item.href || '/mi-cuenta'}
                  onClick={() => handleMenuItemClick(item.tab)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-forest hover:bg-cream transition-colors"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

