'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Foco accesible para modales: al abrir mueve el foco adentro, Escape cierra,
 * Tab queda atrapado en el diálogo y al cerrar el foco vuelve al disparador.
 * Asigna el ref devuelto al elemento con role="dialog" (con tabIndex={-1}).
 * Marca con `data-autofocus` el elemento que debe recibir el foco inicial (si no, el primero).
 */
export function useDialogFocus<T extends HTMLElement>(isOpen: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    const focusables = () => Array.from(dialog?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);

    (dialog?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0] ?? dialog)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const items = focusables();
      const first = items[0] ?? dialog;
      const last = items[items.length - 1] ?? dialog;
      const active = document.activeElement;
      const outside = !dialog.contains(active);
      if (e.shiftKey && (outside || active === first || active === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (outside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      trigger?.focus();
    };
  }, [isOpen]);

  return ref;
}
