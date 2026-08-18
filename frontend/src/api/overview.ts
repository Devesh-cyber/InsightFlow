import { apiClient } from './client';
import type { OverviewResponse } from '../types/overview';

export const getOverview = async (datasetId: string): Promise<OverviewResponse> => {
  const response = await apiClient.get<OverviewResponse>(`/overview/${datasetId}`);
  return response.data;
};
