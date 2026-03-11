import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/authApi';
import type { LoginPayload, RegisterPayload } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
    const queryClient = useQueryClient();
    const setAuth = useAuthStore((state) => state.setAuth);
    const clearAuth = useAuthStore((state) => state.clearAuth);

    const loginMutation = useMutation({
        mutationFn: (payload: LoginPayload) => authApi.login(payload),
        // After login we still need to get the user profile to store it
        onSuccess: async (tokenResponse) => {
            // In a real app we'd fetch the user profile here using the token,
            // but since we need it in standard apps, I will implement a fetch inside the mutation
            // We will actually just set the token first, then fetch user profile using userApi
            useAuthStore.setState({ token: tokenResponse.accessToken });

            const { userApi } = await import('@/api/userApi');
            const user = await userApi.getMe();
            setAuth(user, tokenResponse.accessToken);
        },
    });

    const registerMutation = useMutation({
        mutationFn: (payload: RegisterPayload) => authApi.register(payload),
        onSuccess: async (_data, variables) => {
            // Auto login after register
            const loginPayload: LoginPayload = {
                email: variables.email,
                password: variables.password,
            };
            await loginMutation.mutateAsync(loginPayload);
        },
    });

    const logout = () => {
        clearAuth();
        queryClient.clear(); // Clear all cached data
    };

    return {
        login: loginMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        loginError: loginMutation.error,

        register: registerMutation.mutateAsync,
        isRegistering: registerMutation.isPending,
        registerError: registerMutation.error,

        logout,
    };
}
