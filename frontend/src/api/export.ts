import { apiClient } from './client';
import type { ExportFormat } from '../types/export';

export interface ExportResult {
  filename: string;
}

export const exportDataset = async (
  datasetId: string,
  format: ExportFormat,
  fallbackFilename = 'dataset'
): Promise<ExportResult> => {
  const response = await apiClient.post(
    `/export/${datasetId}`,
    { format },
    {
      responseType: 'blob',
    }
  );

  // Extract filename from Content-Disposition header if available
  let filename = `${fallbackFilename}.${format}`;
  const contentDisposition = response.headers['content-disposition'];
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename=["']?([^"';]+)["']?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  // Determine correct MIME type
  const mimeType =
    format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';

  // Create a Blob and trigger browser file download
  const blob = new Blob([response.data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);

  return { filename };
};
