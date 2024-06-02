import { cn } from '@/lib/utils';
import * as React from 'react';
import type { ElementType } from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: ElementType;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon: Icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {Icon && (
          <Icon className="absolute left-3 h-5 w-5 text-muted-foreground" />
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md bg-muted px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
