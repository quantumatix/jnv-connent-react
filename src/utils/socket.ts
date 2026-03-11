import type { WSEvent } from '@/types';

type EventCallback = (event: WSEvent) => void;

class SocketManager {
    private socket: WebSocket | null = null;
    private groupId: string | null = null;
    private token: string | null = null;

    private listeners: Set<EventCallback> = new Set();

    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectIntervalId: ReturnType<typeof setTimeout> | null = null;

    private onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

    public connect(groupId: string, token: string, onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            if (this.groupId === groupId) return; // Already connected to this group
            this.disconnect(); // Disconnect existing before reconnecting
        }

        this.groupId = groupId;
        this.token = token;
        if (onStatusChange) this.onStatusChange = onStatusChange;

        this.initSocket();
    }

    private initSocket() {
        if (!this.groupId) return;

        this.onStatusChange?.('connecting');

        // Assumes Vite proxy forwards /ws to the backend
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; // Uses vite proxy in dev
        let wsUrl = `${protocol}//${host}/ws/groups/${this.groupId}`;

        if (this.token) {
            wsUrl += `?token=${encodeURIComponent(this.token)}`;
        }

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log(`[WS] Connected to group ${this.groupId}`);
            this.reconnectAttempts = 0;
            this.onStatusChange?.('connected');
        };

        ws.onmessage = (event) => {
            try {
                const payload: WSEvent = JSON.parse(event.data);
                this.emit(payload);
            } catch (err) {
                console.error('[WS] Error parsing message', err);
            }
        };

        ws.onclose = (event) => {
            console.log(`[WS] Disconnected (code: ${event.code})`);
            this.socket = null;
            this.onStatusChange?.('disconnected');

            // Auto-reconnect if it wasn't a clean stop
            if (event.code !== 1000 && this.groupId) {
                this.handleReconnect();
            }
        };

        ws.onerror = (err) => {
            console.error('[WS] Error', err);
            this.onStatusChange?.('error');
        };

        this.socket = ws;
    }

    private handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('[WS] Max reconnect attempts reached');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exp backoff up to 30s
        this.reconnectAttempts++;

        console.log(`[WS] Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})`);

        if (this.reconnectIntervalId) clearTimeout(this.reconnectIntervalId);
        this.reconnectIntervalId = setTimeout(() => {
            this.initSocket();
        }, delay);
    }

    public disconnect() {
        if (this.reconnectIntervalId) {
            clearTimeout(this.reconnectIntervalId);
            this.reconnectIntervalId = null;
        }
        this.groupId = null;
        this.token = null;
        if (this.socket) {
            this.socket.close(1000, 'Client disconnected');
            this.socket = null;
        }
        this.onStatusChange?.('disconnected');
    }

    // Event Registry
    public onMessage(cb: EventCallback) {
        this.listeners.add(cb);
        return () => {
            this.listeners.delete(cb);
        };
    }

    private emit(event: WSEvent) {
        this.listeners.forEach((cb) => cb(event));
    }
}

// Singleton export
export const socketManager = new SocketManager();
