import { apiClient } from './client';
import type { HealthResponse } from '../types/health';

export async function getHealth(datasetId: string): Promise<HealthResponse> {
  const res = await apiClient.get<HealthResponse>(`/health/${datasetId}`);
  return res.data;
}
