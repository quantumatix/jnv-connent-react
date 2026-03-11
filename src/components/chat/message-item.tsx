import * as React from 'react';
import type { Message } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { formatMessageTime } from '@/utils/formatTime';
import { CornerDownRight, MessageSquare, FileText } from 'lucide-react';
import { cn } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { messageApi } from '@/api/messageApi';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { MediaViewer } from './media-viewer';

interface MessageItemProps {
    message: Message;
    replies?: Message[];
    onReply?: (message: Message) => void;
    currentUserId?: string;
    className?: string;
}

export function MessageItem({
    message,
    replies = [],
    onReply,
    currentUserId,
    className,
}: MessageItemProps) {
    const [showReplies, setShowReplies] = React.useState(false);
    const [selectedMediaIndex, setSelectedMediaIndex] = React.useState<number | null>(null);
    const isOwn = message.userId === currentUserId;

    // Motion values for swipe gesture
    const x = useMotionValue(0);

    // Adjust transform values based on swipe direction (right for others, left for own)
    const opacity = useTransform(
        x,
        isOwn ? [0, -60] : [0, 60],
        [0, 1]
    );
    const scale = useTransform(
        x,
        isOwn ? [0, -60] : [0, 60],
        [0.5, 1]
    );

    // Generate a stable color index based on userId for avatars
    const colorIndex = message.userId.charCodeAt(0) % 6;
    const colors = ['text-violet-500', 'text-blue-500', 'text-emerald-500', 'text-amber-500', 'text-rose-500', 'text-cyan-500'];
    const authorColor = colors[colorIndex];

    const repliesQuery = useQuery({
        queryKey: ['replies', message._id],
        queryFn: () => messageApi.listReplies(message._id, null, 50),
        enabled: showReplies,
    });

    // Merge fetched replies with real-time replies from props, preferring newest
    const allReplies = React.useMemo(() => {
        const map = new Map<string, Message>();
        if (repliesQuery.data?.items) {
            repliesQuery.data.items.forEach(r => map.set(r._id, r));
        }
        replies.forEach(r => map.set(r._id, r));
        return Array.from(map.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }, [replies, repliesQuery.data]);

    const handleDragEnd = (_: any, info: any) => {
        // Trigger reply based on direction
        const triggered = isOwn ? info.offset.x < -80 : info.offset.x > 80;

        if (triggered) {
            onReply?.(message);
            // Haptic feedback
            if (typeof window !== 'undefined' && window.navigator?.vibrate) {
                window.navigator.vibrate(10);
            }
        }
    };

    return (
        <div
            className={cn(
                'group relative flex items-start px-4 py-1 gap-2 transition-colors',
                isOwn ? 'flex-row-reverse' : 'flex-row',
                className
            )}
        >
            {/* Swipe Indicator (reveals behind) */}
            <motion.div
                style={{ opacity, scale }}
                className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary z-0",
                    isOwn ? "right-4" : "left-4"
                )}
            >
                <CornerDownRight className="w-5 h-5" />
            </motion.div>

            {/* Avatar */}
            {!isOwn && (
                <Avatar
                    fallback={message.userDisplayName?.substring(0, 2).toUpperCase() || '??'}
                    size="sm"
                    className="ring-1 ring-border shrink-0 mt-1 shadow-sm"
                />
            )}

            {/* Space for own avatar hidden on mobile but visible on desktop */}
            {isOwn && (
                <Avatar
                    fallback={message.userDisplayName?.substring(0, 2).toUpperCase() || '??'}
                    size="sm"
                    className="hidden sm:flex ring-1 ring-border shrink-0 mt-1 shadow-sm"
                />
            )}

            {/* Content Container - Static wrapper to maintain alignment */}
            <div className={cn('flex-1 flex flex-col min-w-0', isOwn ? 'items-end' : 'items-start')}>
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.6}
                    onDragEnd={handleDragEnd}
                    style={{ x }}
                    className={cn(
                        'flex flex-col max-w-[90%] sm:max-w-[75%] relative z-10 cursor-grab active:cursor-grabbing touch-pan-y',
                        isOwn ? 'items-end' : 'items-start'
                    )}
                >
                    {/* Author row */}
                    {!isOwn && (
                        <div className="flex items-baseline gap-2 mb-0.5 px-1.5">
                            <span className={cn('text-[11px] font-bold tracking-tight', authorColor)}>
                                {message.userDisplayName || `${message.userId.substring(0, 8)}...`}
                            </span>
                        </div>
                    )}

                    {/* Message bubble */}
                    <div
                        className={cn(
                            'px-3.5 py-2.5 rounded-[18px] text-[14.5px] relative shadow-md transition-all border border-transparent',
                            isOwn
                                ? 'bg-primary text-primary-foreground rounded-tr-none border-primary/10'
                                : 'bg-muted/90 backdrop-blur-md text-foreground rounded-tl-none border-border/30'
                        )}
                    >
                        {/* Speech Bubble Tail */}
                        <div className={cn(
                            "absolute top-0 w-3 h-3 overflow-hidden",
                            isOwn ? "-right-2.5" : "-left-2.5"
                        )}>
                            <div className={cn(
                                "w-4 h-4 transform rotate-45 mt-[-2px]",
                                isOwn ? "bg-primary ml-[-2px]" : "bg-muted/90 mr-[-2px]"
                            )} />
                        </div>

                        <div className="flex flex-col gap-1">
                            {/* Media attachments */}
                            {message.attachments && message.attachments.length > 0 && (() => {
                                const visualMedia = message.attachments.filter(att => att.mimeType?.startsWith('image/') || att.mimeType?.startsWith('video/'));
                                const otherAttachments = message.attachments.filter(att => !att.mimeType?.startsWith('image/') && !att.mimeType?.startsWith('video/'));

                                return (
                                    <div className="flex flex-col gap-1.5 mb-1">
                                        {/* Visual Media Grid */}
                                        {visualMedia.length > 0 && (
                                            <div className={cn(
                                                "grid max-w-[280px] overflow-hidden shadow-sm",
                                                visualMedia.length === 1 ? "grid-cols-1 rounded-xl" : "grid-cols-2 gap-0.5 rounded-xl bg-border/40 border border-border/20",
                                                visualMedia.length > 2 && "grid-rows-2"
                                            )}>
                                                {visualMedia.slice(0, 4).map((att, i) => {
                                                    const isImage = att.mimeType?.startsWith('image/');
                                                    const isLastDisplay = i === 3;
                                                    const remainingCount = visualMedia.length - 4;
                                                    
                                                    // If exactly 3 items, make the first one span full width
                                                    const isThreeItemsFirst = visualMedia.length === 3 && i === 0;

                                                    return (
                                                        <button 
                                                            key={`vis-${i}`} 
                                                            onClick={() => setSelectedMediaIndex(i)} 
                                                            className={cn(
                                                                "relative focus:outline-none overflow-hidden cursor-zoom-in group w-full bg-background/50",
                                                                visualMedia.length === 1 ? "rounded-xl border border-border/20" : "aspect-square",
                                                                isThreeItemsFirst && "col-span-2 aspect-[2/1]"
                                                            )}
                                                        >
                                                            {isImage ? (
                                                                <img
                                                                    src={att.url}
                                                                    alt={att.fileName}
                                                                    loading="lazy"
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                                                    style={visualMedia.length === 1 && att.width && att.height ? { aspectRatio: `${att.width}/${att.height}` } : undefined}
                                                                />
                                                            ) : (
                                                                <div className="relative w-full h-full bg-black/10">
                                                                    <video
                                                                        src={att.url}
                                                                        preload="metadata"
                                                                        className="w-full h-full object-cover pointer-events-none"
                                                                    />
                                                                    {/* Play Icon Overlay */}
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <div className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:bg-primary/80 transition-colors">
                                                                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                                            
                                                            {/* +N Overlay */}
                                                            {isLastDisplay && remainingCount > 0 && (
                                                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                                                    <span className="text-white text-3xl font-light">+{remainingCount}</span>
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Other Attachments */}
                                        {otherAttachments.map((att, i) => {
                                            const isAudio = att.mimeType?.startsWith('audio/');

                                            if (isAudio) {
                                                return (
                                                    <div key={`audio-${i}`} className="relative max-w-[280px] w-full min-w-[240px]">
                                                        <audio
                                                            src={att.url}
                                                            controls
                                                            preload="metadata"
                                                            className={cn(
                                                                "w-full h-10",
                                                                isOwn ? "[&::-webkit-media-controls-enclosure]:bg-white/20" : "[&::-webkit-media-controls-enclosure]:bg-background/80"
                                                            )}
                                                        />
                                                    </div>
                                                );
                                            }

                                            // Generic file download
                                            return (
                                                <a
                                                    key={`file-${i}`}
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download={att.fileName}
                                                    className={cn(
                                                        'flex items-center gap-2.5 px-3 py-2 rounded-xl border text-[13px] font-medium transition-opacity hover:opacity-80',
                                                        isOwn
                                                            ? 'bg-white/10 border-white/20 text-primary-foreground'
                                                            : 'bg-background/60 border-border/40 text-foreground',
                                                    )}
                                                >
                                                    <FileText className="w-4 h-4 shrink-0" />
                                                    <span className="truncate max-w-[180px]">{att.fileName}</span>
                                                    <span className="shrink-0 opacity-60 text-[11px]">{(att.size / 1024).toFixed(0)} KB</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {message.content && (
                                <p className="break-words leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            )}

                            {/* Time and Status check inside bubble like WhatsApp */}
                            <div className={cn(
                                "flex items-center self-end gap-1 mt-0.5 -mb-1",
                                isOwn ? "text-primary-foreground/70" : "text-muted-foreground/60"
                            )}>
                                <span className="text-[9px] font-medium uppercase tracking-tighter">
                                    {formatMessageTime(message.createdAt)}
                                </span>
                            </div>
                        </div>

                        {/* Desktop Hover Reply Icon */}
                        <button
                            onClick={() => onReply?.(message)}
                            className={cn(
                                'hidden sm:flex absolute top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-background border border-border text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-95 z-20',
                                isOwn ? '-left-12' : '-right-12'
                            )}
                            title="Reply"
                        >
                            <CornerDownRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Reply count toggle */}
                    {message.replyCount > 0 && !showReplies && (
                        <button
                            onClick={() => setShowReplies(true)}
                            className={cn('mt-1.5 px-3 py-1 text-[11px] font-bold text-primary/80 hover:text-primary hover:bg-primary/5 rounded-full transition-all flex items-center gap-1.5 active:scale-95')}
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
                        </button>
                    )}

                    {/* Replies container */}
                    {showReplies && (
                        <div className={cn('mt-3 w-full space-y-2 border-l-[3.5px] border-primary/40 pl-4 py-1')}>
                            <div className="flex items-center justify-between gap-4 mb-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/50">Thread Context</span>
                                <button
                                    onClick={() => setShowReplies(false)}
                                    className="px-2.5 py-1 text-[9px] bg-primary/15 text-primary rounded-md font-black hover:bg-primary/25 transition-all uppercase tracking-tight"
                                >
                                    HIDE
                                </button>
                            </div>
                            {repliesQuery.isLoading && <p className="text-xs text-muted-foreground animate-pulse">Loading...</p>}
                            {allReplies.map((reply) => {
                                const replyIsOwn = reply.userId === currentUserId;
                                return (
                                    <div key={reply._id} className={cn('flex flex-col mb-1', replyIsOwn ? 'items-end' : 'items-start')}>
                                        <div className={cn('px-3.5 py-2 rounded-2xl text-[13px] shadow-sm border border-border/20 max-w-[95%]', replyIsOwn ? 'bg-primary/5 text-foreground rounded-tr-none' : 'bg-muted/50 text-foreground rounded-tl-none')}>
                                            <div className="flex items-center gap-2 mb-1">
                                                {!replyIsOwn && (
                                                    <span className="text-[10px] font-black opacity-90 tracking-tight">
                                                        {reply.userDisplayName || `${reply.userId.substring(0, 6)}...`}
                                                    </span>
                                                )}
                                                <span className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">{formatMessageTime(reply.createdAt)}</span>
                                            </div>
                                            <p className="break-words leading-tight">{reply.content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            {selectedMediaIndex !== null && message.attachments && (
                <MediaViewer
                    attachments={message.attachments}
                    initialIndex={selectedMediaIndex}
                    onClose={() => setSelectedMediaIndex(null)}
                />
            )}
        </div>
    );
}
