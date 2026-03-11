import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LoginPage } from '@/pages/login-page';
import { RegisterPage } from '@/pages/register-page';
import { GroupsPage } from '@/pages/groups-page';
import { GroupChatPage } from '@/pages/group-chat-page';
import { JoinPage } from '@/pages/join-page';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((s) => s.token);
    if (!token) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((s) => s.token);
    if (token) return <Navigate to="/" replace />;
    return <>{children}</>;
}

export function AppRouter() {
    return (
        <Routes>
            {/* Public */}
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <PublicRoute>
                        <RegisterPage />
                    </PublicRoute>
                }
            />

            {/* Protected */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <GroupsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/groups/:groupId"
                element={
                    <ProtectedRoute>
                        <GroupChatPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/join/:groupId"
                element={
                    <ProtectedRoute>
                        <JoinPage />
                    </ProtectedRoute>
                }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
