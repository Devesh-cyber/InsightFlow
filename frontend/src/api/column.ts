import { apiClient } from './client';
import type { ColumnAnalysis, ColumnSummary } from '../types/column';

export const getColumnSummaries = async (
  datasetId: string
): Promise<ColumnSummary[]> => {
  const response = await apiClient.get<ColumnSummary[]>(
    `/columns/${datasetId}/diagnosis`
  );
  return response.data;
};

export const getColumnAnalysis = async (
  datasetId: string,
  columnName: string
): Promise<ColumnAnalysis> => {
  const response = await apiClient.get<ColumnAnalysis>(
    `/columns/${datasetId}/analysis`,
    {
      params: { column_name: columnName },
    }
  );
  return response.data;
};
