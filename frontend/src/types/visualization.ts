export interface ChartOption {
  chart_type: string;
  label: string;
  description: string;
}

export interface VisualizationOptions {
  column_a: string;
  column_b: string | null;
  available_charts: ChartOption[];
}

export interface ChartData {
  chart_type: string;
  title: string;
  x_label: string | null;
  y_label: string | null;
  data: Record<string, unknown>[];
}
