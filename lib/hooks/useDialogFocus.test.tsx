// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDialogFocus } from './useDialogFocus';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Dialog({ isOpen, onClose, empty = false }: { isOpen: boolean; onClose: () => void; empty?: boolean }) {
  const ref = useDialogFocus<HTMLDivElement>(isOpen, onClose);
  if (!isOpen) return null;
  return (
    <div ref={ref} role="dialog" tabIndex={-1}>
      {!empty && (
        <>
          <button>primero</button>
          <button>último</button>
        </>
      )}
    </div>
  );
}

let root: Root;
let container: HTMLDivElement;
let trigger: HTMLButtonElement;

function setup(props: { isOpen: boolean; onClose: () => void; empty?: boolean }) {
  trigger = document.createElement('button');
  container = document.createElement('div');
  document.body.append(trigger, container);
  trigger.focus();
  root = createRoot(container);
  act(() => root.render(<Dialog {...props} />));
}

const rerender = (props: { isOpen: boolean; onClose: () => void }) => act(() => root.render(<Dialog {...props} />));
const press = (key: string, shiftKey = false) =>
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }));
  });
const buttons = () => container.querySelectorAll('button');

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
});

describe('useDialogFocus', () => {
  it('mueve el foco al primer elemento y lo devuelve al disparador al cerrar', () => {
    const onClose = vi.fn();
    setup({ isOpen: true, onClose });
    expect(document.activeElement).toBe(buttons()[0]);
    rerender({ isOpen: false, onClose });
    expect(document.activeElement).toBe(trigger);
  });

  it('no hace nada mientras está cerrado', () => {
    const onClose = vi.fn();
    setup({ isOpen: false, onClose });
    press('Escape');
    expect(onClose).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger);
  });

  it('Escape llama al onClose más reciente', () => {
    const first = vi.fn();
    const latest = vi.fn();
    setup({ isOpen: true, onClose: first });
    rerender({ isOpen: true, onClose: latest });
    press('Escape');
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledOnce();
  });

  it('atrapa Tab y Shift+Tab dentro del diálogo', () => {
    setup({ isOpen: true, onClose: vi.fn() });
    const [first, last] = buttons();
    last.focus();
    press('Tab');
    expect(document.activeElement).toBe(first);
    press('Tab', true);
    expect(document.activeElement).toBe(last);
    trigger.focus();
    press('Tab');
    expect(document.activeElement).toBe(first);
    press('Enter');
    expect(document.activeElement).toBe(first);
  });

  it('enfoca el contenedor si no hay elementos enfocables', () => {
    setup({ isOpen: true, onClose: vi.fn(), empty: true });
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]');
    expect(document.activeElement).toBe(dialog);
    press('Tab', true);
    expect(document.activeElement).toBe(dialog);
  });

  it('enfoca el elemento marcado con data-autofocus', () => {
    function AutoFocus() {
      const ref = useDialogFocus<HTMLDivElement>(true, vi.fn());
      return (
        <div ref={ref}>
          <button>cerrar</button>
          <input aria-label="token" data-autofocus />
        </div>
      );
    }
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => root.render(<AutoFocus />));
    expect(document.activeElement).toBe(container.querySelector('input'));
  });
});
