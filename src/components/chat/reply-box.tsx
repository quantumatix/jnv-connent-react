
import type { Message } from '@/types';
import { CornerDownRight, X } from 'lucide-react';

interface ReplyBoxProps {
    replyTarget: Message;
    onCancel: () => void;
}

export function ReplyBox({ replyTarget, onCancel }: ReplyBoxProps) {
    return (
        <div className="flex items-center gap-3 bg-muted/70 border-l-4 border-primary rounded-r-md px-4 py-2">
            <CornerDownRight className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-primary font-medium mb-0.5">
                    Replying to a message
                </p>
                <p className="text-sm text-muted-foreground truncate">
                    {replyTarget.content}
                </p>
            </div>
            <button
                onClick={onCancel}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Cancel reply"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
