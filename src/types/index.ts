// ── Auth & Users ─────────────────────────────────────────────────────────────

export interface User {
    _id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface TokenResponse {
    accessToken: string;
    tokenType: string;
}

// ── Groups ───────────────────────────────────────────────────────────────────

export interface Group {
    _id: string;
    name: string;
    description: string;
    createdBy: string;
    isPrivate: boolean;
    memberCount: number;
    createdAt: string;
}

export interface GroupMember {
    _id: string;
    groupId: string;
    userId: string;
    role: 'admin' | 'member';
    joinedAt: string;
    isActive: boolean;
}

// ── Media ─────────────────────────────────────────────────────────────────────

export interface MediaAttachment {
    url: string;
    mimeType: string;
    size: number;
    fileName: string;
    width?: number | null;
    height?: number | null;
}

// ── Messages ─────────────────────────────────────────────────────────────────

export interface Message {
    _id: string;
    groupId: string;
    userId: string;
    userDisplayName?: string;
    content: string;
    parentId: string | null;
    replyCount: number;
    createdAt: string;
    updatedAt: string;
    attachments?: MediaAttachment[];
}

export interface CursorPage<T> {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
}

// ── WebSockets ───────────────────────────────────────────────────────────────

export interface WSEvent {
    eventType: 'NEW_MESSAGE' | 'NEW_REPLY';
    groupId: string;
    message: Message;
}
