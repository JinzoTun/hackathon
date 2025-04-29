import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-green-600 text-white shadow-xs hover:bg-green-700 focus-visible:ring-green-300',
        destructive:
          'bg-red-600 text-white shadow-xs hover:bg-red-700 focus-visible:ring-red-300',
        outline:
          'border border-green-700 bg-transparent shadow-xs hover:bg-green-50 hover:text-green-800 dark:border-green-600 dark:hover:bg-green-950/30',
        secondary: 'bg-amber-600 text-white shadow-xs hover:bg-amber-700',
        harvest:
          'bg-amber-500 text-brown-900 shadow-xs hover:bg-amber-600 border-2 border-amber-700',
        soil: 'bg-brown-800 text-amber-100 shadow-xs hover:bg-brown-900 focus-visible:ring-brown-300',
        leaf: 'bg-green-100 text-green-800 border border-green-300 shadow-xs hover:bg-green-200',
        ghost:
          'hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900/30',
        link: 'text-green-700 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-12 rounded-md px-6 has-[>svg]:px-4 text-base',
        xl: 'h-14 rounded-lg px-8 has-[>svg]:px-6 text-lg font-semibold',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
