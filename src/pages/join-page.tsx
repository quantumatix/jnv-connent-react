import * as React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useGroups } from '@/hooks/useGroups';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

export function JoinPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const { joinGroup, isJoiningGroup } = useGroups();

    // We can fetch basic group info to show the name before joining if we want,
    // but the `groups/:id` endpoint is restricted to members.
    // So for a simple invite link, we just show a generic "Join Group" prompt.

    const [error, setError] = React.useState('');

    // If not logged in, redirect to login with a special returnTo or just directly 
    // to login relying on the fact they can come back later. 
    // Best practice is passing the current URL to login so it can redirect back, but since 
    // that requires modifying Login page logic, we can just redirect to login for now.
    if (!user) {
        // Encode the current path to return here after login
        const encodedReturn = encodeURIComponent(`/join/${id}`);
        return <Navigate to={`/login?returnTo=${encodedReturn}`} replace />;
    }

    if (!id) {
        return <Navigate to="/" replace />;
    }

    const handleJoin = async () => {
        try {
            setError('');
            await joinGroup(id);
            navigate(`/groups/${id}`);
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to join group. The link might be invalid or you are already a member.');
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 flex flex-col items-center text-center shadow-lg shadow-primary/5">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <Compass className="w-10 h-10" />
                </div>

                <h1 className="text-2xl font-bold mb-2 text-foreground">
                    You've been invited!
                </h1>

                <p className="text-muted-foreground mb-8">
                    You've received an invite to join a group on JNV Connect. Click below to accept the invitation and start chatting.
                </p>

                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 border border-destructive/20 rounded-md w-full mb-6 text-left">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-3 w-full">
                    <Button
                        onClick={handleJoin}
                        isLoading={isJoiningGroup}
                        className="w-full h-12 text-base"
                    >
                        Join Group
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="w-full"
                    >
                        Back to Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
