import { apiClient } from './client';
import type { ColumnSummary } from '../types/column';
import type { RelationshipResult } from '../types/relationship';

export const getRelationshipColumns = async (
  datasetId: string
): Promise<ColumnSummary[]> => {
  const response = await apiClient.get<ColumnSummary[]>(
    `/relationships/${datasetId}/columns`
  );
  return response.data;
};

export const getRelationship = async (
  datasetId: string,
  columnA: string,
  columnB: string
): Promise<RelationshipResult> => {
  const response = await apiClient.get<RelationshipResult>(
    `/relationships/${datasetId}/analysis`,
    {
      params: {
        column_a: columnA,
        column_b: columnB,
      },
    }
  );
  return response.data;
};
