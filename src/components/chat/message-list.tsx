import * as React from 'react';
import type { Message } from '@/types';
import { MessageItem } from './message-item';
import { Loader } from '@/components/ui/loader';
import { formatRelativeDate } from '@/utils/formatTime';

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    onFetchNextPage: () => void;
    onReply: (message: Message) => void;
    currentUserId?: string;
}

function shouldShowDateSeparator(prev: Message | undefined, curr: Message): boolean {
    if (!prev) return true;
    const prevDate = new Date(prev.createdAt).toDateString();
    const currDate = new Date(curr.createdAt).toDateString();
    return prevDate !== currDate;
}

const SCROLL_THRESHOLD = 150; // px from bottom — within this = "at bottom", increased for mobile leniency

export function MessageList({
    messages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    onFetchNextPage,
    onReply,
    currentUserId,
}: MessageListProps) {
    const listRef = React.useRef<HTMLDivElement>(null);
    const topSentinelRef = React.useRef<HTMLDivElement>(null);
    const bottomRef = React.useRef<HTMLDivElement>(null);
    const isFirstLoad = React.useRef(true);
    // Track if we've completed the initial scroll to bottom for this group
    const hasInitiallyScrolled = React.useRef(false);
    
    // Track last top-level message id to detect genuine new messages (not pagination/replies)
    const lastTopLevelMsgId = React.useRef<string | null>(null);
    // Ref mirror of isScrolledUp — readable inside effects without stale closure issues.
    // Scroll events do NOT fire when DOM content is added, so this stays accurate
    // even after new messages grow the scrollHeight.
    const isScrolledUpRef = React.useRef(false);

    // Track whether user has scrolled up away from the bottom
    const [isScrolledUp, setIsScrolledUp] = React.useState(false);
    const [unreadCount, setUnreadCount] = React.useState(0);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const isAtBottom = React.useCallback(() => {
        const el = listRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_THRESHOLD;
    }, []);

    const scrollToBottom = React.useCallback((behavior: ScrollBehavior = 'smooth') => {
        bottomRef.current?.scrollIntoView({ behavior });
        setIsScrolledUp(false);
        setUnreadCount(0);
    }, []);

    // ── Scroll listener — detect manual scroll up ────────────────────────────

    // Extracted so we can bind it to onTouchMove explicitly for mobile momentum scrolling
    const handleScroll = React.useCallback(() => {
        const atBottom = isAtBottom();
        isScrolledUpRef.current = !atBottom;
        if (atBottom) {
            setIsScrolledUp(false);
            setUnreadCount(0);
        } else {
            setIsScrolledUp(true);
        }
    }, [isAtBottom]);

    React.useEffect(() => {
        const el = listRef.current;
        if (!el) return;

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // ── Initial load: scroll to bottom instantly ─────────────────────────────

    const topLevelMessages = React.useMemo(
        () => messages.filter((m) => !m.parentId),
        [messages]
    );

    React.useEffect(() => {
        if (!isLoading && topLevelMessages.length > 0 && isFirstLoad.current) {
            scrollToBottom('instant' as ScrollBehavior);
            isFirstLoad.current = false;
            hasInitiallyScrolled.current = true;
            lastTopLevelMsgId.current = topLevelMessages[topLevelMessages.length - 1]._id;
        }
    }, [isLoading, topLevelMessages, scrollToBottom]);

    // Reset layout state when changing groups (empty messages list initially)
    React.useEffect(() => {
        if (topLevelMessages.length === 0) {
            isFirstLoad.current = true;
            hasInitiallyScrolled.current = false;
            lastTopLevelMsgId.current = null;
        }
    }, [topLevelMessages.length]);

    // ── New messages: auto-scroll or increment unread badge ──────────────────
    // Keyed on the last top-level message's ID — fires for ALL users via socket,
    // ignores pagination loads (older messages) and replies.
    // Uses isScrolledUpRef (not isAtBottom()) because:
    //   - isAtBottom() reads scrollHeight AFTER the new message is in the DOM (unreliable)
    //   - scroll events don't fire when DOM content is added, so the ref stays accurate

    React.useEffect(() => {
        if (isFirstLoad.current) return;
        if (topLevelMessages.length === 0) return;

        const latestId = topLevelMessages[topLevelMessages.length - 1]._id;
        if (latestId === lastTopLevelMsgId.current) return;

        const prevId = lastTopLevelMsgId.current;
        lastTopLevelMsgId.current = latestId;

        const prevIdx = prevId
            ? topLevelMessages.findIndex((m) => m._id === prevId)
            : -1;
        const newMsgCount = prevIdx === -1 ? 1 : topLevelMessages.length - 1 - prevIdx;

        if (!isScrolledUpRef.current) {
            // User is at bottom — follow new messages
            console.log('User is at bottom — scrolling down');
            scrollToBottom('smooth');
        } else {
            // User scrolled up — accumulate badge count
            console.log('User scrolled up — counting ' + newMsgCount + ' unread: prev badge = ' + unreadCount);
            setUnreadCount((prev) => prev + newMsgCount);
        }
    }, [topLevelMessages, scrollToBottom]);

    // ── Infinite scroll — trigger when top sentinel is visible ───────────────

    React.useEffect(() => {
        const sentinel = topSentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                // Only trigger pagination if the initial down-scroll has finished
                // This prevents the sentinel from fetching 10 pages immediately on group-switch mount
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage && hasInitiallyScrolled.current) {
                    onFetchNextPage();
                }
            },
            { root: listRef.current, threshold: 0.1, rootMargin: '100px 0px 0px 0px' }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, onFetchNextPage]);

    // ── Derived data ──────────────────────────────────────────────────────────

    const repliesByParent = React.useMemo(() =>
        messages.reduce<Record<string, Message[]>>((acc, msg) => {
            if (msg.parentId) {
                if (!acc[msg.parentId]) acc[msg.parentId] = [];
                acc[msg.parentId].push(msg);
            }
            return acc;
        }, {}),
        [messages]
    );

    // ── Render ────────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader text="Loading messages..." />
            </div>
        );
    }

    if (topLevelMessages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl">💬</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">No messages yet</h3>
                <p className="text-sm text-muted-foreground">Be the first to send a message in this group!</p>
            </div>
        );
    }

    return (
        <div className="flex-1 relative overflow-hidden flex flex-col">
            {/* Scrollable message area */}
            <div 
                ref={listRef} 
                className="flex-1 overflow-y-auto py-4 flex flex-col chat-bg"
                onTouchMove={handleScroll}
            >
                {/* Top sentinel for infinite scroll */}
                <div ref={topSentinelRef} className="h-1" />

                {isFetchingNextPage && (
                    <div className="flex justify-center py-3">
                        <Loader className="scale-75" />
                    </div>
                )}

                {/* Message items with date separators */}
                {topLevelMessages.map((msg, idx) => {
                    const prevMsg = topLevelMessages[idx - 1];
                    const showDate = shouldShowDateSeparator(prevMsg, msg);

                    return (
                        <React.Fragment key={msg._id}>
                            {showDate && (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="text-xs text-muted-foreground font-medium px-2 py-1 rounded-full bg-muted">
                                        {formatRelativeDate(msg.createdAt)}
                                    </span>
                                    <div className="flex-1 h-px bg-border" />
                                </div>
                            )}
                            <MessageItem
                                message={msg}
                                replies={repliesByParent[msg._id] || []}
                                onReply={onReply}
                                currentUserId={currentUserId}
                            />
                        </React.Fragment>
                    );
                })}

                {/* Bottom anchor for auto-scroll */}
                <div ref={bottomRef} className="h-4" />
            </div>

            {/* Scroll-to-bottom FAB — only visible when scrolled up */}
            {isScrolledUp && (
                <button
                    onClick={() => scrollToBottom('smooth')}
                    className="
                        absolute bottom-2 right-4 md:bottom-6 md:right-8
                        w-10 h-10 rounded-full
                        bg-primary text-primary-foreground
                        shadow-lg shadow-primary/30
                        flex items-center justify-center
                        transition-all duration-200
                        hover:scale-110 hover:shadow-xl hover:shadow-primary/40
                        active:scale-95
                        z-50
                    "
                    aria-label="Scroll to bottom"
                >
                    {/* Down chevron icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>

                    {/* Unread count badge */}
                    {unreadCount > 0 && (
                        <span className="
                            absolute -top-2 -right-1
                            min-w-[20px] h-5 px-1
                            rounded-full
                            bg-green-500 text-white
                            text-[10px] font-bold
                            flex items-center justify-center
                            leading-none
                            shadow-md
                        ">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            )}
        </div>
    );
}
