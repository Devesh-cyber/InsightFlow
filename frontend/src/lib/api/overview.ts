import { apiClient } from './client';
import type { OverviewResponse } from '../types/overview';

export async function getOverview(datasetId: string): Promise<OverviewResponse> {
  const res = await apiClient.get<OverviewResponse>(`/overview/${datasetId}`);
  return res.data;
}
