import { apiClient } from './setup';
import type { Group, GroupMember } from '@/types';

export interface CreateGroupPayload {
    name: string;
    description?: string;
    is_private?: boolean;
}

export const groupApi = {
    listMyGroups: async (): Promise<Group[]> => {
        const res = await apiClient.get('/groups');
        return res.data;
    },

    discoverGroups: async (): Promise<Group[]> => {
        const res = await apiClient.get('/groups/discover');
        return res.data;
    },

    createGroup: async (payload: CreateGroupPayload): Promise<Group> => {
        const res = await apiClient.post('/groups', payload);
        return res.data;
    },

    joinGroup: async (groupId: string): Promise<GroupMember> => {
        const res = await apiClient.post(`/groups/${groupId}/join`);
        return res.data;
    },

    leaveGroup: async (groupId: string): Promise<{ message: string }> => {
        const res = await apiClient.post(`/groups/${groupId}/leave`);
        return res.data;
    },
};
