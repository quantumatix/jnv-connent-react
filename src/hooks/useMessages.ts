import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { messageApi, type CreateMessagePayload } from '@/api/messageApi';
import type { Message, CursorPage } from '@/types';

export function useMessages(groupId: string | undefined) {

    // Infinite Query — loads newest messages first, then older on scroll-up
    const messagesQuery = useInfiniteQuery({
        queryKey: ['messages', groupId],
        queryFn: ({ pageParam = null as string | null }) => {
            if (!groupId) return Promise.reject("No group id provided");
            return messageApi.listMessages(groupId, pageParam, 20);
        },
        getNextPageParam: (lastPage: CursorPage<Message>) => {
            // nextCursor = oldest message's createdAt in the current page
            // passing it fetches messages older than the current window
            return lastPage.hasMore ? lastPage.nextCursor : undefined;
        },
        initialPageParam: null,
        enabled: !!groupId,
    });

    // Pages array: pages[0] = newest batch (first load), pages[1] = older batch, etc.
    // Each page's items are already in ASC order (backend reverses after DESC fetch).
    // We need to render oldest-first top-to-bottom, so we reverse the pages array
    // and then flatten — older pages go first, newest page goes last.
    const flatMessages = messagesQuery.data
        ? [...messagesQuery.data.pages].reverse().flatMap(page => page.items)
        : [];

    // Mutations
    const sendMessageMutation = useMutation({
        mutationFn: (payload: CreateMessagePayload) => {
            if (!groupId) return Promise.reject("No group id");
            return messageApi.createMessage(groupId, payload);
        },
        // Optimistic updates are ideal here, but for simplicity we rely on WebSockets or invalidation
        onSuccess: () => {
            // Do nothing, WebSocket will push it, or we can invalidate to be safe if no WS
            // queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
        },
    });

    const replyMessageMutation = useMutation({
        mutationFn: ({ messageId, payload }: { messageId: string; payload: CreateMessagePayload }) => {
            return messageApi.replyMessage(messageId, payload);
        },
        onSuccess: () => {
            // Do nothing, WebSocket will push it
        },
    });

    return {
        messages: flatMessages,
        isLoading: messagesQuery.isLoading,
        isFetchingNextPage: messagesQuery.isFetchingNextPage,
        hasNextPage: messagesQuery.hasNextPage,
        fetchNextPage: messagesQuery.fetchNextPage,
        error: messagesQuery.error,

        sendMessage: sendMessageMutation.mutateAsync,
        isSending: sendMessageMutation.isPending,

        replyMessage: replyMessageMutation.mutateAsync,
        isReplying: replyMessageMutation.isPending,
    };
}
