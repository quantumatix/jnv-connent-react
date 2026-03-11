import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '@/hooks/useMessages';
import { useSocket } from '@/hooks/useSocket';
import { useGroups } from '@/hooks/useGroups';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { Message } from '@/types';
import type { CreateGroupPayload } from '@/api/groupApi';

export function GroupChatPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    // Messages
    const { messages, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, sendMessage, isSending, replyMessage, isReplying } = useMessages(groupId);

    // Socket
    useSocket(groupId);

    // Groups (for sidebar + group details)
    const { groups, isLoadingGroups, createGroup, isCreatingGroup } = useGroups();
    const currentGroup = groups.find((g) => g._id === groupId) ?? null;

    const [replyTarget, setReplyTarget] = React.useState<Message | null>(null);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = React.useState(false);
    const [createGroupForm, setCreateGroupForm] = React.useState<CreateGroupPayload>({ name: '', description: '', isPrivate: false });
    const [createGroupError, setCreateGroupError] = React.useState('');

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createGroupForm.name.trim()) {
            setCreateGroupError('Group name is required');
            return;
        }
        try {
            const group = await createGroup({ name: createGroupForm.name.trim(), description: createGroupForm.description, isPrivate: createGroupForm.isPrivate });
            setIsCreateGroupOpen(false);
            setCreateGroupForm({ name: '', description: '', isPrivate: false });
            setCreateGroupError('');
            navigate(`/groups/${group._id}`);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { detail?: string } } };
            setCreateGroupError(e?.response?.data?.detail || 'Failed to create group');
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <Sidebar onCreateGroupClick={() => setIsCreateGroupOpen(true)} />

            {/* Main Chat */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    group={currentGroup}
                    isLoading={isLoadingGroups && !currentGroup}
                />

                <MessageList
                    messages={messages}
                    isLoading={isLoading}
                    isFetchingNextPage={isFetchingNextPage}
                    hasNextPage={!!hasNextPage}
                    onFetchNextPage={fetchNextPage}
                    onReply={setReplyTarget}
                    currentUserId={user?._id}
                />

                <MessageInput
                    onSendMessage={async (content, attachments) => { await sendMessage({ content, attachments }); }}
                    onSendReply={async (messageId, content, attachments) => { await replyMessage({ messageId, payload: { content, attachments } }); }}
                    replyTarget={replyTarget}
                    onCancelReply={() => setReplyTarget(null)}
                    isSending={isSending || isReplying}
                />
            </div>

            {/* Create Group Modal */}
            <Modal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} title="New Group">
                <form onSubmit={handleCreateGroup} className="space-y-4">
                    <div className="w-full">
                        <label className="block text-sm font-medium mb-1.5">Group Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Study Group"
                            value={createGroupForm.name}
                            onChange={(e) => setCreateGroupForm((f) => ({ ...f, name: e.target.value }))}
                            required
                            maxLength={100}
                            autoFocus
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>
                    <div className="w-full">
                        <label className="block text-sm font-medium mb-1.5">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
                        <textarea
                            placeholder="What is this group about?"
                            value={createGroupForm.description}
                            onChange={(e) => setCreateGroupForm((f) => ({ ...f, description: e.target.value }))}
                            maxLength={500}
                            rows={2}
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        />
                    </div>
                    {createGroupError && <p className="text-sm text-destructive">{createGroupError}</p>}
                    <div className="flex gap-3 pt-1">
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsCreateGroupOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isCreatingGroup} className="flex-1">Create</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
