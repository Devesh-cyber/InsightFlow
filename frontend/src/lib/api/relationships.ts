import { apiClient } from './client';
import type { ColumnSummary } from '../types/column';
import type { RelationshipResult } from '../types/relationship';

export async function getRelationshipColumns(datasetId: string): Promise<ColumnSummary[]> {
  const res = await apiClient.get<ColumnSummary[]>(`/relationships/${datasetId}/columns`);
  return res.data;
}

export async function getRelationship(
  datasetId: string,
  columnA: string,
  columnB: string
): Promise<RelationshipResult> {
  const res = await apiClient.get<RelationshipResult>(`/relationships/${datasetId}/analysis`, {
    params: { column_a: columnA, column_b: columnB },
  });
  return res.data;
}
