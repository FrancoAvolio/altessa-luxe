import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed ring-offset-background';

const variants: Record<string, string> = {
  default: 'bg-black text-white hover:bg-gold hover:text-black',
  outline: 'border border-gold text-black hover:bg-black hover:text-white',
  destructive: 'bg-black text-white hover:bg-gold hover:text-black',
  ghost: 'text-black hover:bg-black hover:text-white',
  secondary: 'bg-gold text-black hover:bg-black hover:text-white',
};

const sizes: Record<string, string> = {
  sm: 'h-8 px-3',
  md: 'h-10 px-4',
  lg: 'h-12 px-6',
  icon: 'h-9 w-9',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export default Button;
