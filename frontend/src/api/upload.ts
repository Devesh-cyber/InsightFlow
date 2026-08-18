import { apiClient } from './client';

export interface UploadResponse {
  status: string;
  message: string;
  dataset_id: string;
  filename: string;
  rows: number;
  columns: number;
}

export const uploadDataset = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};
