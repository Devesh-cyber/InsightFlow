import { apiClient } from './client';
import type {
  CleaningHistoryResponse,
  CleaningPreviewResponse,
  CleaningRecommendationsResponse,
  CleaningRequest,
  CleaningResponse,
} from '../types/cleaning';

export async function getCleaningRecommendations(datasetId: string): Promise<CleaningRecommendationsResponse> {
  const res = await apiClient.get<CleaningRecommendationsResponse>(`/cleaning/${datasetId}/recommendations`);
  return res.data;
}

export async function previewCleaning(datasetId: string, request: CleaningRequest): Promise<CleaningPreviewResponse> {
  const res = await apiClient.post<CleaningPreviewResponse>(`/cleaning/${datasetId}/preview`, request);
  return res.data;
}

export async function applyCleaning(datasetId: string, request: CleaningRequest): Promise<CleaningResponse> {
  const res = await apiClient.post<CleaningResponse>(`/cleaning/${datasetId}`, request);
  return res.data;
}

export async function getCleaningHistory(datasetId: string): Promise<CleaningHistoryResponse> {
  const res = await apiClient.get<CleaningHistoryResponse>(`/cleaning/${datasetId}/history`);
  return res.data;
}
