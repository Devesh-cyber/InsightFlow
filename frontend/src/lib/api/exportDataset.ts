import { apiClient } from './client';
import type { ExportFormat } from '../types/export';

/**
 * The export endpoint streams a file (not JSON), so this returns a Blob
 * and the filename the backend suggested via Content-Disposition.
 */
export async function exportDataset(
  datasetId: string,
  format: ExportFormat
): Promise<{ blob: Blob; filename: string }> {
  const res = await apiClient.post(
    `/export/${datasetId}`,
    { format },
    { responseType: 'blob' }
  );

  const disposition = res.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `dataset.${format}`;

  return { blob: res.data as Blob, filename };
}
