
import { cn } from './button';

interface LoaderProps {
    fullScreen?: boolean;
    className?: string;
    text?: string;
}

export function Loader({ fullScreen, className, text }: LoaderProps) {
    const spinner = (
        <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
            <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
            {text && <p className="text-sm text-muted-foreground font-medium">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                {spinner}
            </div>
        );
    }

    return spinner;
}
