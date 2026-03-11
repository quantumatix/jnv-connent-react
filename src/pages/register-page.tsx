import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare } from 'lucide-react';

export function RegisterPage() {
    const navigate = useNavigate();
    const { register, isRegistering, registerError } = useAuth();

    const [form, setForm] = React.useState({
        username: '',
        email: '',
        display_name: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register(form);
            navigate('/');
        } catch {
            // error shown below
        }
    };

    const getErrorMessage = () => {
        if (!registerError) return null;
        const err = registerError as any;
        const detail = err?.response?.data?.detail;
        if (Array.isArray(detail)) {
            return detail.map((d: any) => d.msg).join(', ');
        }
        return detail || 'Could not create account. Please try again.';
    };

    const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Hero */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-white/30 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary-300/30 rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 text-center max-w-lg">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-8 shadow-2xl backdrop-blur-sm mx-auto">
                        <MessageSquare className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Join JNV Connect</h1>
                    <p className="text-lg text-white/70">
                        Create your account and start connecting with your community in real-time.
                    </p>
                </div>
            </div>

            {/* Right Form */}
            <div className="flex-1 lg:max-w-md flex flex-col items-center justify-center px-8 py-12">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-10 lg:hidden">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">JNV Connect</span>
                    </div>

                    <h2 className="text-2xl font-bold mb-1">Create Account</h2>
                    <p className="text-muted-foreground mb-8">Fill in the details below to get started</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            id="display_name"
                            type="text"
                            label="Display Name"
                            placeholder="Your Name"
                            value={form.display_name}
                            onChange={handleChange('display_name')}
                            required
                            minLength={1}
                            maxLength={64}
                        />
                        <Input
                            id="username"
                            type="text"
                            label="Username"
                            placeholder="yourhandle"
                            value={form.username}
                            onChange={handleChange('username')}
                            required
                            minLength={3}
                            maxLength={32}
                        />
                        <Input
                            id="email"
                            type="email"
                            label="Email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange('email')}
                            required
                            autoComplete="email"
                        />
                        <Input
                            id="password"
                            type="password"
                            label="Password"
                            placeholder="Min. 8 characters"
                            value={form.password}
                            onChange={handleChange('password')}
                            required
                            minLength={8}
                            maxLength={128}
                        />

                        {getErrorMessage() && (
                            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                                <p className="text-sm text-destructive">{getErrorMessage()}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            isLoading={isRegistering}
                            className="w-full h-11 text-base"
                        >
                            {isRegistering ? 'Creating account…' : 'Create Account'}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
