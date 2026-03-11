import { apiClient } from './setup';
import type { User, TokenResponse } from '@/types';

// Types exactly matching backend request bodies
export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    display_name: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export const authApi = {
    register: async (payload: RegisterPayload): Promise<User> => {
        const res = await apiClient.post('/auth/register', payload);
        return res.data;
    },

    login: async (payload: LoginPayload): Promise<TokenResponse> => {
        const res = await apiClient.post('/auth/login', payload);
        return res.data;
    },
};
