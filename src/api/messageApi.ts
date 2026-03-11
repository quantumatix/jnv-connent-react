import { apiClient } from './setup';
import type { Message, MediaAttachment, CursorPage } from '@/types';

export interface CreateMessagePayload {
    content: string;
    attachments?: MediaAttachment[];
}

export const messageApi = {
    listMessages: async (groupId: string, cursor?: string | null, limit = 20): Promise<CursorPage<Message>> => {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (cursor) {
            params.append('cursor', cursor);
        }
        const res = await apiClient.get(`/groups/${groupId}/messages?${params.toString()}`);
        return res.data;
    },

    listReplies: async (messageId: string, cursor?: string | null, limit = 20): Promise<CursorPage<Message>> => {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (cursor) {
            params.append('cursor', cursor);
        }
        const res = await apiClient.get(`/messages/${messageId}/replies?${params.toString()}`);
        return res.data;
    },

    createMessage: async (groupId: string, payload: CreateMessagePayload): Promise<Message> => {
        const res = await apiClient.post(`/groups/${groupId}/messages`, payload);
        return res.data;
    },

    replyMessage: async (messageId: string, payload: CreateMessagePayload): Promise<Message> => {
        const res = await apiClient.post(`/messages/${messageId}/reply`, payload);
        return res.data;
    },
};

