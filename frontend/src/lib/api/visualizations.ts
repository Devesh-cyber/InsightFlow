import { apiClient } from './client';
import type { ChartData, VisualizationOptions } from '../types/visualization';

export async function getVisualizationOptions(
  datasetId: string,
  columnA: string,
  columnB?: string
): Promise<VisualizationOptions> {
  const res = await apiClient.get<VisualizationOptions>(`/visualizations/${datasetId}/options`, {
    params: { column_a: columnA, column_b: columnB || undefined },
  });
  return res.data;
}

export async function getChartData(
  datasetId: string,
  columnA: string,
  chartType: string,
  columnB?: string
): Promise<ChartData> {
  const res = await apiClient.get<ChartData>(`/visualizations/${datasetId}/data`, {
    params: { column_a: columnA, chart_type: chartType, column_b: columnB || undefined },
  });
  return res.data;
}
