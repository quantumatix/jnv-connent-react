import { create } from 'zustand';

type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface SocketState {
    status: SocketStatus;
    currentGroupId: string | null;
    setStatus: (status: SocketStatus) => void;
    setGroupId: (groupId: string | null) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
    status: 'disconnected',
    currentGroupId: null,
    setStatus: (status) => set({ status }),
    setGroupId: (groupId) => set({ currentGroupId: groupId }),
}));
