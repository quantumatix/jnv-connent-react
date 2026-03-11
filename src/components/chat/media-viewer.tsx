import * as React from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import type { MediaAttachment } from '@/types';

export interface MediaViewerProps {
    attachments: MediaAttachment[];
    initialIndex: number;
    onClose: () => void;
}

export function MediaViewer({ attachments, initialIndex, onClose }: MediaViewerProps) {
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

    // Only viewable media (images/videos)
    const mediaItems = attachments.filter(
        (a) => a.mimeType.startsWith('image/') || a.mimeType.startsWith('video/')
    );

    // If the initialIndex pointed to a non-media item (shouldn't happen with proper wiring), clamp it
    const activeItem = mediaItems[currentIndex] || mediaItems[0];

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const handleNext = React.useCallback(() => {
        if (currentIndex < mediaItems.length - 1) setCurrentIndex((i) => i + 1);
    }, [currentIndex, mediaItems.length]);

    const handlePrev = React.useCallback(() => {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
    }, [currentIndex]);

    const [touchStart, setTouchStart] = React.useState<number | null>(null);
    const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        
        // Left swipe -> Next item
        if (distance > minSwipeDistance) handleNext();
        // Right swipe -> Prev item
        if (distance < -minSwipeDistance) handlePrev();
    };

    if (!activeItem) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in touch-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Header / Controls */}
            <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent z-10 transition-opacity">
                <div className="flex items-center gap-3">
                    <span className="text-white/80 text-sm font-medium">
                        {currentIndex + 1} / {mediaItems.length}
                    </span>
                    <span className="text-white font-semibold truncate max-w-[200px] sm:max-w-md">
                        {activeItem.fileName}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={activeItem.url}
                        download={activeItem.fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        title="Download"
                    >
                        <Download className="w-5 h-5" />
                    </a>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors ml-2"
                        title="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Navigation Left */}
            {currentIndex > 0 && (
                <button
                    onClick={handlePrev}
                    className="absolute left-4 p-3 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all hidden sm:block z-10 hover:scale-110 active:scale-95"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
            )}

            {/* Main Content Area */}
            <div 
                className="w-full h-full flex items-center justify-center p-4 sm:p-12 overflow-hidden"
                onClick={onClose} // Close if clicking background
            >
                <div 
                    className="relative max-w-full max-h-full flex items-center justify-center animate-zoom-in"
                    onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
                >
                    {activeItem.mimeType.startsWith('image/') ? (
                        <img
                            src={activeItem.url}
                            alt={activeItem.fileName}
                            className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl"
                        />
                    ) : (
                        <video
                            src={activeItem.url}
                            controls
                            autoPlay
                            className="max-w-full max-h-[85vh] rounded-sm shadow-2xl bg-black"
                        />
                    )}
                </div>
            </div>

            {/* Navigation Right */}
            {currentIndex < mediaItems.length - 1 && (
                <button
                    onClick={handleNext}
                    className="absolute right-4 p-3 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all hidden sm:block z-10 hover:scale-110 active:scale-95"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            )}
            
            {/* Mobile swipe hint overlay (optional, framer motion could be used here but keeping it simple) */}
        </div>,
        document.body
    );
}
