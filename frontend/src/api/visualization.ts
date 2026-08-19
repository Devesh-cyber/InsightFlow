import { apiClient } from './client';
import type { ChartData, VisualizationOptions } from '../types/visualization';

export const getVisualizationOptions = async (
  datasetId: string,
  columnA: string,
  columnB?: string | null
): Promise<VisualizationOptions> => {
  const response = await apiClient.get<VisualizationOptions>(
    `/visualizations/${datasetId}/options`,
    {
      params: {
        column_a: columnA,
        ...(columnB ? { column_b: columnB } : {}),
      },
    }
  );
  return response.data;
};

export const getVisualizationData = async (
  datasetId: string,
  columnA: string,
  chartType: string,
  columnB?: string | null
): Promise<ChartData> => {
  const response = await apiClient.get<ChartData>(
    `/visualizations/${datasetId}/data`,
    {
      params: {
        column_a: columnA,
        chart_type: chartType,
        ...(columnB ? { column_b: columnB } : {}),
      },
    }
  );
  return response.data;
};
