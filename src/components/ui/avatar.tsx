import * as React from 'react';
import { cn } from './button';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ src, alt, fallback, size = 'md', className, ...props }: AvatarProps) {
    const [imageError, setImageError] = React.useState(false);

    const sizes = {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
    };

    const getInitials = (name?: string) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div
            className={cn(
                'relative flex shrink-0 overflow-hidden rounded-full bg-muted',
                sizes[size],
                className
            )}
            {...props}
        >
            {src && !imageError ? (
                <img
                    src={src}
                    alt={alt || 'Avatar'}
                    className="aspect-square h-full w-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-medium">
                    {getInitials(fallback || alt)}
                </div>
            )}
        </div>
    );
}
