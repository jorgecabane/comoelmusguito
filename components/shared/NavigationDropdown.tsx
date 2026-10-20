/**
 * NavigationDropdown Component
 * Dropdown para navegación con click (se abre/cierra con click, se cierra al hacer click fuera)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NavigationItem {
  name: string;
  href: string;
  description?: string;
}

interface NavigationDropdownProps {
  label: string;
  items: NavigationItem[];
  className?: string;
}

export function NavigationDropdown({ label, items, className }: NavigationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      ref={dropdownRef}
      className={cn('relative', className)}
    >
      {/* Trigger Button */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-1 text-fg hover:text-brand font-medium transition-colors relative group"
      >
        <span>{label}</span>
        <ChevronDown
          size={16}
          className={cn(
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-56 bg-surface rounded-lg shadow-natural-lg border border-line overflow-hidden z-50 animate-fade-in-slide"
        >
          <div className="py-2">
            {items.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-fg hover:bg-bg hover:text-brand transition-colors group"
              >
                <div className="font-medium text-sm">{item.name}</div>
                {item.description && (
                  <div className="text-xs text-muted mt-0.5">{item.description}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
