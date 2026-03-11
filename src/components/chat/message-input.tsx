import * as React from 'react';
import { Send, Paperclip, X, AlertCircle } from 'lucide-react';
import type { Message, MediaAttachment } from '@/types';
import { ReplyBox } from './reply-box';
import { cn } from '@/components/ui/button';
import { useMediaUpload } from '@/hooks/useMediaUpload';

const MAX_LENGTH = 5000;

interface MessageInputProps {
    onSendMessage: (content: string, attachments?: MediaAttachment[]) => Promise<void>;
    onSendReply: (messageId: string, content: string, attachments?: MediaAttachment[]) => Promise<void>;
    replyTarget: Message | null;
    onCancelReply: () => void;
    isSending: boolean;
}

export function MessageInput({
    onSendMessage,
    onSendReply,
    replyTarget,
    onCancelReply,
    isSending,
}: MessageInputProps) {
    const [content, setContent] = React.useState('');
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { pendingUploads, addFiles, removeUpload, clearAll, isUploading, completedAttachments } = useMediaUpload();

    const trimmed = content.trim();
    const canSend = (trimmed || completedAttachments.length > 0) && !isSending && !isUploading;

    const handleSubmit = async () => {
        if (!canSend) return;
        try {
            const attachments = completedAttachments.length > 0 ? completedAttachments : undefined;
            if (replyTarget) {
                await onSendReply(replyTarget._id, trimmed, attachments);
                onCancelReply();
            } else {
                await onSendMessage(trimmed, attachments);
            }
            setContent('');
            clearAll();
            textareaRef.current?.focus();
            // Reset height
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } catch {
            // errors handled upstream
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value.length <= MAX_LENGTH) {
            setContent(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
            e.target.value = ''; // allow re-selection of same file
        }
    };

    return (
        <div className="px-4 py-3 bg-card/60 backdrop-blur-lg border-t border-border/50 space-y-3 chat-bg bg-none">
            {replyTarget && (
                <ReplyBox replyTarget={replyTarget} onCancel={onCancelReply} />
            )}

            {/* Pending upload previews */}
            {pendingUploads.length > 0 && (
                <div className="flex gap-2 flex-wrap max-w-5xl mx-auto px-1">
                    {pendingUploads.map((upload, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border/40 bg-muted shrink-0">
                            {/* Preview */}
                            {upload.file.type.startsWith('image/') ? (
                                <img
                                    src={upload.status === 'done' ? upload.attachment?.url : upload.previewUrl}
                                    alt={upload.file.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1">
                                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-[9px] text-muted-foreground text-center truncate w-full px-1">{upload.file.name}</span>
                                </div>
                            )}

                            {/* Upload progress overlay */}
                            {upload.status === 'uploading' && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                                    {/* Circular progress ring */}
                                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="14" fill="none" stroke="white" strokeWidth="2.5" strokeOpacity="0.3" />
                                        <circle
                                            cx="18" cy="18" r="14" fill="none" stroke="white" strokeWidth="2.5"
                                            strokeDasharray={`${2 * Math.PI * 14}`}
                                            strokeDashoffset={`${2 * Math.PI * 14 * (1 - upload.progress / 100)}`}
                                            strokeLinecap="round"
                                            className="transition-all duration-200"
                                        />
                                    </svg>
                                    <span className="text-[9px] text-white font-bold mt-0.5">{upload.progress}%</span>
                                </div>
                            )}

                            {/* Requesting URL overlay */}
                            {upload.status === 'requesting_url' && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                </div>
                            )}

                            {/* Error overlay */}
                            {upload.status === 'error' && (
                                <div className="absolute inset-0 bg-red-900/70 flex flex-col items-center justify-center p-1" title={upload.error}>
                                    <AlertCircle className="w-5 h-5 text-red-300" />
                                    <span className="text-[8px] text-red-200 text-center mt-0.5">{upload.error}</span>
                                </div>
                            )}

                            {/* Remove button */}
                            {upload.status !== 'uploading' && upload.status !== 'requesting_url' && (
                                <button
                                    onClick={() => removeUpload(idx)}
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                                    aria-label="Remove attachment"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2 max-w-5xl mx-auto">
                <div className="flex-1 flex items-end gap-2 bg-background/80 dark:bg-[#202c33] backdrop-blur-md rounded-[24px] border border-border/40 shadow-sm focus-within:shadow-md transition-all px-3 py-1.5 min-h-[44px]">

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,application/pdf,audio/*"
                        className="hidden"
                        onChange={handleFileChange}
                        aria-label="Attach files"
                    />

                    {/* Attachment button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        title="Attach image or file"
                        aria-label="Attach file"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder={replyTarget ? 'Write a reply…' : 'Message…'}
                        rows={1}
                        className="flex-1 bg-transparent text-[15px] resize-none outline-none placeholder:text-muted-foreground/60 max-h-40 py-2 leading-tight"
                        aria-label="Message input"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!canSend}
                    className={cn(
                        "flex items-center justify-center w-[44px] h-[44px] rounded-full transition-all shadow-md active:scale-90 shrink-0",
                        canSend ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-muted text-muted-foreground"
                    )}
                    aria-label="Send message"
                >
                    {isSending || isUploading ? (
                        <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <Send className={cn("w-5 h-5", canSend ? "translate-x-0.5" : "")} />
                    )}
                </button>
            </div>
        </div>
    );
}
