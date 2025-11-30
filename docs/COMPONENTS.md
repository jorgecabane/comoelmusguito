# 🧩 Guía de Componentes - comoelmusguito

## 📋 Índice de Componentes

### UI Base (`components/ui/`)
- [Button](#button)
- [Card](#card)
- [Input](#input)
- [Modal](#modal)
- [Badge](#badge)
- [Skeleton](#skeleton)

### Compartidos (`components/shared/`)
- [Header](#header)
- [Footer](#footer)
- [Navigation](#navigation)
- [Cart](#cart)

### Animaciones (`components/animations/`)
- [FadeIn](#fadein)
- [ParallaxImage](#parallaximage)
- [ScrollReveal](#scrollreveal)

---

## 🔘 Button

### Props

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}
```

### Uso

```tsx
import { Button } from '@/components/ui';

// Primario
<Button variant="primary">
  Adoptar Terrario
</Button>

// Con icono
<Button variant="primary" icon={<ShoppingCart size={20} />}>
  Agregar al Carrito
</Button>

// Loading state
<Button loading={isSubmitting}>
  Procesando...
</Button>

// Disabled
<Button disabled>
  Agotado
</Button>
```

### Implementación Base

```tsx
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading,
  icon,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        loading && 'btn-loading',
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" />}
      {!loading && icon}
      {children}
    </button>
  );
}
```

---

## 🃏 Card

### Props

```typescript
interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}
```

### Uso Composición

```tsx
import { Card } from '@/components/ui';

<Card hover padding="lg">
  <Card.Image src="/terrarium.jpg" alt="Terrario" />
  <Card.Content>
    <Card.Title>Terrario Bosque Nublado</Card.Title>
    <Card.Description>
      Un ecosistema autosustentable...
    </Card.Description>
    <Card.Price value={45000} currency="CLP" />
  </Card.Content>
  <Card.Footer>
    <Button>Adoptar</Button>
  </Card.Footer>
</Card>
```

### Implementación

```tsx
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Card({ 
  children, 
  hover = false, 
  padding = 'md',
  className 
}: CardProps) {
  return (
    <div
      className={cn(
        'card',
        hover && 'card-hover',
        `card-padding-${padding}`,
        className
      )}
    >
      {children}
    </div>
  );
}

Card.Image = function CardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="card-image">
      <Image 
        src={src} 
        alt={alt} 
        fill 
        className="object-cover"
      />
    </div>
  );
};

Card.Content = function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="card-content">{children}</div>;
};

Card.Title = function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="card-title">{children}</h3>;
};

Card.Description = function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="card-description">{children}</p>;
};

Card.Price = function CardPrice({ value, currency }: { value: number; currency: string }) {
  return (
    <span className="card-price">
      {new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: currency
      }).format(value)}
    </span>
  );
};

Card.Footer = function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="card-footer">{children}</div>;
};
```

---

## 📝 Input

### Props

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}
```

### Uso

```tsx
import { Input } from '@/components/ui';

<Input
  label="Correo electrónico"
  type="email"
  placeholder="tu@email.com"
  error={errors.email}
  helperText="Te enviaremos actualizaciones de tu pedido"
/>
```

---

## 🎭 Modal

### Props

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

### Uso

```tsx
import { Modal } from '@/components/ui';
import { useState } from 'react';

function Example() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal
      </Button>
      
      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        title="Detalles del Terrario"
      >
        <p>Contenido del modal...</p>
      </Modal>
    </>
  );
}
```

---

## 🏷️ Badge

### Props

```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
}
```

### Uso

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Disponible</Badge>
<Badge variant="warning">Últimas unidades</Badge>
<Badge variant="error">Agotado</Badge>
```

---

## 💀 Skeleton

### Uso

```tsx
import { Skeleton } from '@/components/ui';

// Loading de card
<Card>
  <Skeleton className="h-48 w-full" />
  <Card.Content>
    <Skeleton className="h-6 w-3/4 mb-2" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </Card.Content>
</Card>
```

---

## 🧭 Header

### Uso

```tsx
import { Header } from '@/components/shared';

<Header />
```

### Features

- Navegación principal
- Logo
- Carrito de compras
- Autenticación (login/perfil)
- Responsive (hamburger en mobile)
- Auto-hide al scroll down, show al scroll up

---

## 🛒 Cart

### Estructura

```
Cart/
├── CartButton.tsx      # Botón con contador
├── CartDrawer.tsx      # Drawer lateral
├── CartItem.tsx        # Item individual
└── index.ts
```

### Uso

```tsx
import { CartButton, CartDrawer } from '@/components/shared/Cart';

function Layout() {
  return (
    <>
      <Header>
        <CartButton />
      </Header>
      <CartDrawer />
    </>
  );
}
```

### Context

```tsx
import { useCart } from '@/hooks/useCart';

function Component() {
  const { 
    items, 
    addItem, 
    removeItem, 
    updateQuantity,
    total 
  } = useCart();
  
  return (
    <Button onClick={() => addItem(product)}>
      Agregar
    </Button>
  );
}
```

---

## ✨ FadeIn (Animation)

### Props

```typescript
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
}
```

### Uso

```tsx
import { FadeIn } from '@/components/animations';

<FadeIn direction="up" delay={0.2}>
  <h2>Título que aparece</h2>
</FadeIn>
```

### Implementación

```tsx
'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function FadeIn({ 
  children, 
  delay = 0, 
  direction = 'up',
  duration = 0.6 
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 }
  };
  
  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { 
        opacity: 0, 
        ...directions[direction] 
      }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration, 
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 🖼️ ParallaxImage

### Props

```typescript
interface ParallaxImageProps {
  src: string;
  alt: string;
  speed?: number; // -1 to 1
  className?: string;
}
```

### Uso

```tsx
import { ParallaxImage } from '@/components/animations';

<ParallaxImage
  src="/forest.jpg"
  alt="Bosque"
  speed={-0.3}
  className="h-[600px]"
/>
```

---

## 📜 ScrollReveal

### Props

```typescript
interface ScrollRevealProps {
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}
```

### Uso

```tsx
import { ScrollReveal } from '@/components/animations';

<ScrollReveal threshold={0.5}>
  <div className="section">
    Contenido que aparece al hacer scroll
  </div>
</ScrollReveal>
```

---

## 🎯 Patrones de Composición

### Pattern 1: Compound Components

```tsx
// ✅ Flexible y semántico
<Card>
  <Card.Image src="..." />
  <Card.Content>
    <Card.Title>Título</Card.Title>
  </Card.Content>
</Card>

// ❌ Props explosion
<Card 
  image="..." 
  title="..." 
  description="..." 
  footer="..."
  imageAlt="..."
  // ... infinitas props
/>
```

### Pattern 2: Render Props

```tsx
<DataLoader
  query={getTerrariums}
  render={({ data, loading, error }) => {
    if (loading) return <Skeleton />;
    if (error) return <Error />;
    return <TerrariumGrid data={data} />;
  }}
/>
```

### Pattern 3: Children as Function

```tsx
<CartContext.Consumer>
  {({ items, total }) => (
    <div>
      {items.length} items - ${total}
    </div>
  )}
</CartContext.Consumer>
```

---

## 🧪 Testing Components (Futuro)

### Unit Test Example

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

## 📚 Storybook (Futuro)

### Story Example

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Adoptar Terrario',
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    icon: <ShoppingCart />,
    children: 'Agregar al Carrito',
  },
};
```

---

## ✅ Checklist de Nuevo Componente

Antes de crear un componente nuevo:

- [ ] ¿Existe ya algo similar que puedo extender?
- [ ] ¿Es suficientemente reutilizable?
- [ ] ¿Está en la carpeta correcta? (`ui/`, `shared/`, `sections/`)
- [ ] ¿Tiene props bien tipadas con TypeScript?
- [ ] ¿Maneja estados de loading/error/empty?
- [ ] ¿Es accesible? (ARIA, keyboard navigation)
- [ ] ¿Respeta el sistema de diseño?
- [ ] ¿Tiene variantes necesarias?
- [ ] ¿Está documentado?
- [ ] ¿Exportado correctamente en `index.ts`?

---

## 🚀 Siguientes Pasos

1. Implementar componentes base UI
2. Crear Storybook para documentación visual
3. Agregar tests unitarios
4. Crear componentes específicos de secciones
5. Implementar animaciones

---

**Última actualización:** Noviembre 2025

