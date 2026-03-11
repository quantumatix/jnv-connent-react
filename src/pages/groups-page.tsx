import * as React from 'react';
import { Link } from 'react-router-dom';
import { useGroups } from '@/hooks/useGroups';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { Hash, Users, Plus, LogOut, Lock, MessageSquare, Compass, UserCheck } from 'lucide-react';
import { formatRelativeDate } from '@/utils/formatTime';
import type { Group } from '@/types';

function GroupCard({ group }: { group: Group }) {
    return (
        <Link
            to={`/groups/${group._id}`}
            className="flex flex-col rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all group"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    <Hash className="w-6 h-6" />
                </div>
                {group.isPrivate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        <Lock className="w-3 h-3" />
                        Private
                    </span>
                )}
            </div>
            <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{group.name}</h3>
            {group.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{group.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                </span>
                <span>Created {formatRelativeDate(group.createdAt)}</span>
            </div>
        </Link>
    );
}

function DiscoverGroupCard({ group, onJoin, isJoining }: { group: Group, onJoin: (id: string) => void, isJoining: boolean }) {
    return (
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-all group-card">
            <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Hash className="w-6 h-6" />
                </div>
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => { e.preventDefault(); onJoin(group._id); }}
                    isLoading={isJoining}
                    className="h-8 shadow-sm"
                >
                    Join Group
                </Button>
            </div>
            <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{group.name}</h3>
            {group.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{group.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                </span>
                <span>Created {formatRelativeDate(group.createdAt)}</span>
            </div>
        </div>
    );
}

export function GroupsPage() {
    const user = useAuthStore((s) => s.user);
    const { logout } = useAuth();
    const {
        groups, isLoadingGroups, createGroup, isCreatingGroup,
        discoverGroups, isLoadingDiscover, joinGroup, isJoiningGroup
    } = useGroups();

    const [activeTab, setActiveTab] = React.useState<'my_groups' | 'discover'>('my_groups');
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [joiningId, setJoiningId] = React.useState<string | null>(null);
    const [form, setForm] = React.useState({ name: '', description: '', is_private: false });
    const [formError, setFormError] = React.useState('');

    const handleJoin = async (id: string) => {
        setJoiningId(id);
        try {
            await joinGroup(id);
            setActiveTab('my_groups');
        } catch (err: any) {
            console.error(err);
        } finally {
            setJoiningId(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setFormError('Group name is required');
            return;
        }
        setFormError('');
        try {
            await createGroup({ name: form.name.trim(), description: form.description.trim(), is_private: form.is_private });
            setIsModalOpen(false);
            setForm({ name: '', description: '', is_private: false });
        } catch (err: any) {
            setFormError(err?.response?.data?.detail || 'Failed to create group');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Top nav bar */}
            <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold">JNV Connect</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground hidden sm:block">
                            Hi, <span className="font-medium text-foreground">{user?.displayName}</span>
                        </span>
                        <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                            <LogOut className="w-4 h-4" />
                            Sign out
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Groups</h1>
                        <p className="text-muted-foreground">
                            {activeTab === 'my_groups'
                                ? `You're a member of ${groups.length} group${groups.length !== 1 ? 's' : ''}`
                                : 'Discover new public communities to join'}
                        </p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20 shrink-0">
                        <Plus className="w-4 h-4" />
                        New Group
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border mb-8">
                    <button
                        onClick={() => setActiveTab('my_groups')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'my_groups'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            }`}
                    >
                        <UserCheck className="w-4 h-4" />
                        My Groups
                    </button>
                    <button
                        onClick={() => setActiveTab('discover')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'discover'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            }`}
                    >
                        <Compass className="w-4 h-4" />
                        Discover
                    </button>
                </div>

                {/* Tab Content: My Groups */}
                {activeTab === 'my_groups' && (
                    <>
                        {isLoadingGroups ? (
                            <div className="flex justify-center py-16">
                                <Loader text="Loading your groups…" />
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                    <Hash className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">No groups yet</h2>
                                <p className="text-muted-foreground mb-8 max-w-sm">
                                    Get started by creating your first group or check out the Discover tab to find communities.
                                </p>
                                <Button onClick={() => setActiveTab('discover')} variant="secondary" className="gap-2">
                                    <Compass className="w-4 h-4" />
                                    Explore Groups
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groups.map((group) => (
                                    <GroupCard key={group._id} group={group} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Tab Content: Discover */}
                {activeTab === 'discover' && (
                    <>
                        {isLoadingDiscover ? (
                            <div className="flex justify-center py-16">
                                <Loader text="Finding public groups…" />
                            </div>
                        ) : discoverGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                    <Compass className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">No public groups found</h2>
                                <p className="text-muted-foreground mb-8 max-w-sm">
                                    You have already joined all available public groups, or none exist yet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {discoverGroups.map((group) => (
                                    <DiscoverGroupCard
                                        key={group._id}
                                        group={group}
                                        onJoin={handleJoin}
                                        isJoining={isJoiningGroup && joiningId === group._id}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Create Group Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a New Group">
                <form onSubmit={handleCreate} className="space-y-4">
                    <Input
                        label="Group Name"
                        placeholder="e.g. Study Group, Project Team…"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        required
                        maxLength={100}
                        autoFocus
                    />
                    <div className="w-full">
                        <label className="block text-sm font-medium mb-1.5">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
                        <textarea
                            placeholder="What is this group about?"
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            maxLength={500}
                            rows={3}
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={form.is_private}
                                onChange={(e) => setForm((f) => ({ ...f, is_private: e.target.checked }))}
                            />
                            <div className={`w-10 h-6 rounded-full transition-colors ${form.is_private ? 'bg-primary' : 'bg-muted'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_private ? 'translate-x-5' : 'translate-x-1'}`} />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Private group</p>
                            <p className="text-xs text-muted-foreground">Only invited members can join</p>
                        </div>
                    </label>

                    {formError && (
                        <p className="text-sm text-destructive">{formError}</p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isCreatingGroup} className="flex-1">
                            Create Group
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
