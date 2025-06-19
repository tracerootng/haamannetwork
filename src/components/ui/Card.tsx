import React from 'react';
import { cn } from '../../lib/utils';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  elevation?: 'flat' | 'default' | 'elevated';
  onClick?: () => void;
  hoverEffect?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      elevation = 'default',
      onClick,
      hoverEffect = false,
      ...props
    },
    ref
  ) => {
    const elevationClasses = {
      flat: 'border border-gray-200 dark:border-gray-700',
      default: 'shadow-card',
      elevated: 'shadow-elevated',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl p-4 transition-all duration-200',
          elevationClasses[elevation],
          hoverEffect &&
            'hover:shadow-elevated hover:translate-y-[-2px] cursor-pointer',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;