import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#0038FF] text-white hover:bg-[#001A99]',
        accent: 'bg-[#CCFF00] text-black hover:bg-yellow-300',
        outline: 'border border-[#0038FF] text-[#0038FF] hover:bg-[#0038FF] hover:text-white',
        ghost: 'hover:bg-gray-100 text-gray-800',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        white: 'bg-white text-[#0038FF] hover:bg-gray-100',
        'outline-white': 'border border-white text-white hover:bg-white hover:text-[#0038FF]',
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-8 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
