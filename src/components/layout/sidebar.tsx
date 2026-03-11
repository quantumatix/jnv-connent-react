
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useGroups } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';
import { Plus, Hash, Settings, LogOut } from 'lucide-react';

export function Sidebar({ onCreateGroupClick }: { onCreateGroupClick: () => void }) {
    const user = useAuthStore((state) => state.user);
    const { groups, isLoadingGroups } = useGroups();
    const { logout } = useAuth();

    return (
        <aside className="w-72 flex-shrink-0 border-r border-border bg-card/50 hidden md:flex flex-col h-full overflow-hidden">
            {/* User Header */}
            <div className="p-4 border-b border-border flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar
                        src={user?.avatarUrl}
                        alt={user?.displayName || 'User'}
                        size="md"
                        className="ring-2 ring-primary/20"
                    />
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-sm truncate">{user?.displayName}</span>
                        <span className="text-xs text-muted-foreground truncate">@{user?.username}</span>
                    </div>
                </div>
                <button onClick={logout} className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors" title="Logout">
                    <LogOut className="w-4 h-4" />
                </button>
            </div>

            {/* Groups List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <div className="flex items-center justify-between px-2 py-2 mb-1">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Groups</h3>
                    <button
                        onClick={onCreateGroupClick}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                        title="Create Group"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {isLoadingGroups ? (
                    <div className="px-2 py-4 flex flex-col gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse flex items-center gap-3">
                                <div className="w-8 h-8 bg-muted rounded-md" />
                                <div className="flex-1 h-4 bg-muted rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    groups.map((group) => (
                        <NavLink
                            key={group._id}
                            to={`/groups/${group._id}`}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-foreground hover:bg-muted'
                                }`
                            }
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted text-muted-foreground">
                                <Hash className="w-4 h-4" />
                            </div>
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <span className="truncate text-sm">{group.name}</span>
                                {/* Could add latest message preview here but backend doesn't return it in group list currently */}
                            </div>
                        </NavLink>
                    ))
                )}

                {groups.length === 0 && !isLoadingGroups && (
                    <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                        <p>You haven't joined any groups yet.</p>
                        <button
                            onClick={onCreateGroupClick}
                            className="mt-2 text-primary hover:underline"
                        >
                            Create one now
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Settings Area */}
            <div className="p-3 border-t border-border">
                <NavLink
                    to="/" // Generic root link for now, could be a settings page
                    className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    Settings
                </NavLink>
            </div>
        </aside>
    );
}
