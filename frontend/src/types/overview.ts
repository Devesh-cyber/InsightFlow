export interface DatasetMetadata {
  dataset_name: string;
  rows: number;
  columns: number;
  memory_usage: number;
  missing_cells: number;
  duplicate_rows: number;
  column_types: Record<string, number>;
  created_at: string;
}

export interface OverviewResponse {
  metadata: DatasetMetadata;
  completeness_percentage: number;
  preview: Array<Record<string, unknown>>;
}
