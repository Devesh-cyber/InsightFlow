import { apiClient } from './client';
import type { UploadResponse } from '../types/dataset';

export const ALLOWED_EXTENSIONS = ['.csv', '.xlsx'];
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export async function uploadDataset(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });

  return res.data;
}
