import { forwardRef } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointsBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const PointsBadge = forwardRef<HTMLDivElement, PointsBadgeProps>(
  ({ points, size = 'md', animated = false, className }, ref) => {
    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5 gap-1',
      md: 'text-sm px-3 py-1 gap-1.5',
      lg: 'text-base px-4 py-1.5 gap-2',
    };

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center font-semibold rounded-full bg-gradient-gold text-accent-foreground shadow-gold",
          sizeClasses[size],
          animated && "animate-points-pop",
          className
        )}
      >
        <Star className={cn(iconSizes[size], "fill-current")} />
        <span>{points.toLocaleString()}</span>
      </div>
    );
  }
);

PointsBadge.displayName = 'PointsBadge';
