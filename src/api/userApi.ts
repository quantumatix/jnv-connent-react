import { apiClient } from './setup';
import type { User } from '@/types';

export const userApi = {
    getMe: async (): Promise<User> => {
        const res = await apiClient.get('/users/me');
        return res.data;
    },
};
