import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketManager } from '@/utils/socket';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import type { Message, CursorPage } from '@/types';

export function useSocket(groupId: string | undefined) {
    const queryClient = useQueryClient();
    const token = useAuthStore((state) => state.token);
    const setStatus = useSocketStore((state) => state.setStatus);
    const setGroupId = useSocketStore((state) => state.setGroupId);
    const status = useSocketStore((state) => state.status);

    useEffect(() => {
        if (!groupId || !token) return;

        // Connect to WebSocket
        socketManager.connect(groupId, token, (newStatus) => {
            setStatus(newStatus);
        });
        setGroupId(groupId);

        // Subscribe to messages
        const unsubscribe = socketManager.onMessage((event) => {
            // Optimistically push the message into TanStack Query Cache
            // Cache shape: InfiniteData<CursorPage<Message>>
            queryClient.setQueryData(
                ['messages', groupId],
                (oldData: any) => {
                    if (!oldData) return oldData;

                    // Check if message already exists to prevent duplicate processing
                    const messageExists = oldData.pages.some((page: CursorPage<Message>) =>
                        page.items.some(m => m._id === event.message._id)
                    );

                    if (messageExists) return oldData;

                    let updated = false;

                    const newPages = oldData.pages.map((page: CursorPage<Message>, i: number) => {
                        let newItems = [...page.items];
                        let pageUpdated = false;

                        // Increment parent message reply count if this is a reply
                        if (event.message.parentId) {
                            const parentIndex = newItems.findIndex(m => m._id === event.message.parentId);
                            if (parentIndex !== -1) {
                                newItems[parentIndex] = {
                                    ...newItems[parentIndex],
                                    replyCount: (newItems[parentIndex].replyCount || 0) + 1
                                };
                                pageUpdated = true;
                                updated = true;
                            }
                        }

                        if (i === 0) {
                            newItems.push(event.message);
                            pageUpdated = true;
                            updated = true;
                        }

                        if (pageUpdated) {
                            return { ...page, items: newItems };
                        }
                        return page;
                    });

                    return updated ? { ...oldData, pages: newPages } : oldData;
                }
            );
        });

        return () => {
            unsubscribe();
            socketManager.disconnect();
            setGroupId(null);
        };
    }, [groupId, token, queryClient, setStatus, setGroupId]);

    return { status };
}
