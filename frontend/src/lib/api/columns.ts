import { apiClient } from './client';
import type { ColumnAnalysis, ColumnSummary } from '../types/column';

export async function getColumnSummaries(datasetId: string): Promise<ColumnSummary[]> {
  const res = await apiClient.get<ColumnSummary[]>(`/columns/${datasetId}/diagnosis`);
  return res.data;
}

export async function getColumnAnalysis(datasetId: string, columnName: string): Promise<ColumnAnalysis> {
  const res = await apiClient.get<ColumnAnalysis>(`/columns/${datasetId}/analysis`, {
    params: { column_name: columnName },
  });
  return res.data;
}
