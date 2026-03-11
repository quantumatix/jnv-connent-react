import * as React from 'react';
import { mediaApi } from '@/api/mediaApi';
import type { MediaAttachment } from '@/types';

// Max file size: 100 MB (matches backend)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/webm',
];

export type UploadStatus = 'idle' | 'requesting_url' | 'uploading' | 'done' | 'error';

export interface PendingUpload {
    file: File;
    previewUrl: string;     // local object URL for preview, revoked after upload
    status: UploadStatus;
    progress: number;       // 0-100
    error?: string;
    attachment?: MediaAttachment;  // available once done
}

export interface UseMediaUploadReturn {
    pendingUploads: PendingUpload[];
    addFiles: (files: FileList | File[]) => Promise<void>;
    removeUpload: (index: number) => void;
    clearAll: () => void;
    /** True if any upload is still in progress */
    isUploading: boolean;
    /** Ready-to-send attachments (status === 'done') */
    completedAttachments: MediaAttachment[];
}

/**
 * A reusable hook that manages the full upload lifecycle:
 * 1. Validate file type & size
 * 2. Create a local preview URL
 * 3. Request a pre-signed URL from the backend
 * 4. PUT the file directly to S3 with progress tracking
 * 5. Build and expose the MediaAttachment object for the send-message call
 */
export function useMediaUpload(): UseMediaUploadReturn {
    const [pendingUploads, setPendingUploads] = React.useState<PendingUpload[]>([]);

    const updateUpload = React.useCallback(
        (index: number, patch: Partial<PendingUpload>) => {
            setPendingUploads((prev) =>
                prev.map((u, i) => (i === index ? { ...u, ...patch } : u)),
            );
        },
        [],
    );

    const addFiles = React.useCallback(
        async (files: FileList | File[]) => {
            const fileArr = Array.from(files);

            // Build initial entries with local previews
            const newEntries: PendingUpload[] = fileArr.map((file) => ({
                file,
                previewUrl: URL.createObjectURL(file),
                status: 'idle' as UploadStatus,
                progress: 0,
            }));

            setPendingUploads((prev) => {
                const startIdx = prev.length;
                // Kick off upload for each file after state settles
                newEntries.forEach((entry, i) => {
                    const globalIdx = startIdx + i;
                    uploadFile(entry, globalIdx);
                });
                return [...prev, ...newEntries];
            });

            async function uploadFile(entry: PendingUpload, idx: number) {
                const { file } = entry;

                // Client-side validation
                if (!ALLOWED_TYPES.includes(file.type)) {
                    updateUpload(idx, { status: 'error', error: `File type "${file.type}" not allowed.` });
                    return;
                }
                if (file.size > MAX_FILE_SIZE) {
                    updateUpload(idx, { status: 'error', error: 'File exceeds 100 MB limit.' });
                    return;
                }

                try {
                    // Step 1: get pre-signed URL
                    updateUpload(idx, { status: 'requesting_url' });
                    const { uploadUrl, cdnUrl } = await mediaApi.getUploadUrl({
                        fileName: file.name,
                        contentType: file.type,
                        fileSizeBytes: file.size,
                    });

                    // Step 2: upload to S3
                    updateUpload(idx, { status: 'uploading', progress: 0 });
                    await mediaApi.uploadToS3(uploadUrl, file, (progress) => {
                        updateUpload(idx, { progress });
                    });

                    // Step 3: build attachment metadata
                    const attachment = await mediaApi.buildAttachment(file, cdnUrl);

                    // Free memory
                    URL.revokeObjectURL(entry.previewUrl);

                    updateUpload(idx, { status: 'done', progress: 100, attachment });
                } catch (err: any) {
                    updateUpload(idx, { status: 'error', error: err?.message ?? 'Upload failed' });
                }
            }
        },
        [updateUpload],
    );

    const removeUpload = React.useCallback((index: number) => {
        setPendingUploads((prev) => {
            const entry = prev[index];
            if (entry?.previewUrl && entry.status !== 'done') {
                URL.revokeObjectURL(entry.previewUrl);
            }
            return prev.filter((_, i) => i !== index);
        });
    }, []);

    const clearAll = React.useCallback(() => {
        setPendingUploads((prev) => {
            prev.forEach((u) => {
                if (u.previewUrl && u.status !== 'done') URL.revokeObjectURL(u.previewUrl);
            });
            return [];
        });
    }, []);

    const isUploading = pendingUploads.some(
        (u) => u.status === 'requesting_url' || u.status === 'uploading',
    );

    const completedAttachments = pendingUploads
        .filter((u) => u.status === 'done' && u.attachment)
        .map((u) => u.attachment!);

    return { pendingUploads, addFiles, removeUpload, clearAll, isUploading, completedAttachments };
}
