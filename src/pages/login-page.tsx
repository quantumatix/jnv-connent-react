import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare } from 'lucide-react';

export function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoggingIn, loginError } = useAuth();

    const [form, setForm] = React.useState({ email: '', password: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(form);
            navigate('/');
        } catch {
            // error rendered from loginError
        }
    };

    const getErrorMessage = () => {
        if (!loginError) return null;
        const err = loginError as any;
        return err?.response?.data?.detail || 'Invalid email or password.';
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Hero Panel */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/30 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-300/30 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-8 shadow-2xl backdrop-blur-sm">
                        <MessageSquare className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 leading-tight">Welcome to JNV Connect</h1>
                    <p className="text-lg text-white/70 leading-relaxed">
                        Real-time group messaging for your community. Connect, collaborate, and communicate in an instant.
                    </p>

                    {/* Fake message bubbles for visual interest */}
                    <div className="mt-10 w-full max-w-sm space-y-3 text-left">
                        {[
                            { text: 'Hey everyone! 👋', time: '2:30 PM', align: 'left' },
                            { text: 'Welcome to the group!', time: '2:31 PM', align: 'right' },
                            { text: 'Excited to be here 🎉', time: '2:32 PM', align: 'left' },
                        ].map((bubble, i) => (
                            <div key={i} className={`flex ${bubble.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`rounded-2xl px-4 py-2 text-sm backdrop-blur-sm ${bubble.align === 'right'
                                        ? 'bg-white/20 border border-white/20'
                                        : 'bg-white/10 border border-white/10'
                                    }`}>
                                    {bubble.text}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Auth Panel */}
            <div className="flex-1 lg:max-w-md flex flex-col items-center justify-center px-8 py-12">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-10 lg:hidden">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">JNV Connect</span>
                    </div>

                    <h2 className="text-2xl font-bold mb-1">Sign in</h2>
                    <p className="text-muted-foreground mb-8">Enter your credentials to access your account</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            id="email"
                            type="email"
                            label="Email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            required
                            autoComplete="email"
                        />
                        <Input
                            id="password"
                            type="password"
                            label="Password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                            required
                            autoComplete="current-password"
                        />

                        {getErrorMessage() && (
                            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                                <p className="text-sm text-destructive">{getErrorMessage()}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            isLoading={isLoggingIn}
                            className="w-full h-11 text-base"
                        >
                            {isLoggingIn ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-primary hover:underline">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
