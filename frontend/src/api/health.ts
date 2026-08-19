import { apiClient } from './client';
import type { HealthResponse } from '../types/health';

export const getDatasetHealth = async (datasetId: string): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>(`/health/${datasetId}`);
  return response.data;
};
