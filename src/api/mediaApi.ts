import { apiClient } from './setup';
import type { MediaAttachment } from '@/types';

export interface GetUploadUrlRequest {
    fileName: string;
    contentType: string;
    fileSizeBytes: number;
}

export interface GetUploadUrlResponse {
    uploadUrl: string;
    cdnUrl: string;
    s3Key: string;
}

export const mediaApi = {
    /**
     * Step 1: Request a pre-signed upload URL from the backend.
     * The backend validates the file type/size and returns a short-lived PUT URL.
     */
    getUploadUrl: async (payload: GetUploadUrlRequest): Promise<GetUploadUrlResponse> => {
        const res = await apiClient.post('/media/upload-url', payload);
        return res.data;
    },

    /**
     * Step 2: PUT the actual file bytes directly to S3.
     * Note: Use the raw fetch/axios with the presigned URL directly (no auth headers!).
     * Adding authorization headers to a pre-signed S3 request causes a SignatureDoesNotMatch error.
     */
    uploadToS3: async (
        uploadUrl: string,
        file: File,
        onProgress?: (percent: number) => void,
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', file.type);

            if (onProgress) {
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        onProgress(Math.round((event.loaded / event.total) * 100));
                    }
                };
            }

            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve();
                } else {
                    reject(new Error(`S3 upload failed with status ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error('S3 upload network error'));
            xhr.send(file);
        });
    },

    /**
     * Helper: Build a MediaAttachment object from a File and the CDN URL.
     * For images, reads the dimensions using a temporary Image element.
     */
    buildAttachment: async (file: File, cdnUrl: string): Promise<MediaAttachment> => {
        const base: MediaAttachment = {
            url: cdnUrl,
            mimeType: file.type,
            size: file.size,
            fileName: file.name,
            width: null,
            height: null,
        };

        if (file.type.startsWith('image/')) {
            try {
                const dims = await new Promise<{ width: number; height: number }>((res) => {
                    const img = new Image();
                    img.onload = () => res({ width: img.naturalWidth, height: img.naturalHeight });
                    img.onerror = () => res({ width: 0, height: 0 });
                    img.src = URL.createObjectURL(file);
                });
                base.width = dims.width || null;
                base.height = dims.height || null;
            } catch {
                // non-critical
            }
        }

        return base;
    },
};
