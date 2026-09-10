export type ExportFormat = 'csv' | 'xlsx';

export interface ExportRequest {
  format: ExportFormat;
}
