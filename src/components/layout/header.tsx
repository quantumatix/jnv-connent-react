import type { Group } from '@/types';
import { Hash, Users, Shield, LogOut, ArrowLeft, Loader2, MoreVertical, Link as LinkIcon } from 'lucide-react';
import { useSocketStore } from '@/store/socketStore';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroups } from '@/hooks/useGroups';

interface HeaderProps {
    group: Group | null;
    isLoading: boolean;
}

export function Header({ group, isLoading }: HeaderProps) {
    const socketStatus = useSocketStore((state) => state.status);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { leaveGroup, isLeavingGroup } = useGroups();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLeaveGroup = async () => {
        if (group) {
            try {
                await leaveGroup(group._id);
                navigate('/');
                setIsMenuOpen(false);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleCopyInvite = () => {
        if (group) {
            const inviteUrl = `${window.location.origin}/join/${group._id}`;
            navigator.clipboard.writeText(inviteUrl);
            alert('Invite link copied to clipboard!');
            setIsMenuOpen(false);
        }
    };

    if (isLoading) {
        return (
            <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card shadow-sm z-10">
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-muted rounded-md" />
                    <div className="flex flex-col gap-2">
                        <div className="w-32 h-4 bg-muted rounded" />
                        <div className="w-16 h-3 bg-muted rounded" />
                    </div>
                </div>
            </header>
        );
    }

    if (!group) {
        return (
            <header className="h-16 flex items-center px-6 border-b border-border bg-card shadow-sm z-10">
                <span className="text-muted-foreground font-medium">Select a group</span>
            </header>
        );
    }

    return (
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 z-10 shadow-sm shrink-0">
            <div className="flex items-center gap-2 sm:gap-4">
                <Button variant="ghost" className="md:hidden w-8 h-8 p-0" onClick={() => navigate('/groups')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
                    <Hash className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-foreground">{group.name}</h2>
                        {group.isPrivate && (
                            <span title="Private Group">
                                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Users className="w-3 h-3" />
                        {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                        <span className="mx-1">•</span>
                        <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${socketStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                socketStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                                    'bg-rose-500'
                                }`} />
                            {socketStatus === 'connected' ? 'Live' : socketStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                        </span>
                    </p>
                </div>
            </div>

            <div className="relative" ref={menuRef}>
                <Button variant="ghost" className="w-9 h-9 p-0" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <MoreVertical className="w-5 h-5" />
                </Button>

                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-card border border-border shadow-lg rounded-md overflow-hidden z-50">
                        <div className="p-3 border-b border-border">
                            <p className="text-sm font-medium text-foreground">{group.name}</p>
                            {group.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                    {group.description}
                                </p>
                            )}
                        </div>
                        <div className="p-1">
                            <button
                                onClick={handleCopyInvite}
                                className="w-full text-left px-3 py-2 text-sm text-foreground rounded-md transition-colors hover:bg-muted flex items-center"
                            >
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Copy Invite Link
                            </button>
                            <button
                                onClick={handleLeaveGroup}
                                disabled={isLeavingGroup}
                                className="w-full text-left px-3 py-2 text-sm text-destructive rounded-md transition-colors hover:bg-destructive/10 flex items-center mt-1 disabled:opacity-50"
                            >
                                {isLeavingGroup ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                                Leave Group
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
