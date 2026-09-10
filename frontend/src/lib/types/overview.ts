import type { DatasetMetadata } from './dataset';

export interface OverviewResponse {
  metadata: DatasetMetadata;
  completeness_percentage: number;
  preview: Record<string, unknown>[];
}
