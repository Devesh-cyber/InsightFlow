import { apiClient } from './client';
import type {
  CleaningPreviewResponse,
  CleaningRecommendationsResponse,
  CleaningRequest,
  CleaningResponse,
  CleaningHistoryResponse,
} from '../types/cleaning';

export const getCleaningRecommendations = async (
  datasetId: string
): Promise<CleaningRecommendationsResponse> => {
  const response = await apiClient.get<CleaningRecommendationsResponse>(
    `/cleaning/${datasetId}/recommendations`
  );
  return response.data;
};

export const applyCleaningOperation = async (
  datasetId: string,
  request: CleaningRequest
): Promise<CleaningResponse> => {
  const response = await apiClient.post<CleaningResponse>(
    `/cleaning/${datasetId}`,
    request
  );
  return response.data;
};

export const previewCleaningOperation = async (
  datasetId: string,
  request: CleaningRequest
): Promise<CleaningPreviewResponse> => {
  const response = await apiClient.post<CleaningPreviewResponse>(
    `/cleaning/${datasetId}/preview`,
    request
  );
  return response.data;
};

export const getCleaningHistory = async (
  datasetId: string
): Promise<CleaningHistoryResponse> => {
  const response = await apiClient.get<CleaningHistoryResponse>(
    `/cleaning/${datasetId}/history`
  );
  return response.data;
};
