import Plot from 'react-plotly.js';
import type { Data, Layout } from 'plotly.js';
import type { ChartData } from '../../lib/types/visualization';
import { EmptyState } from '../ui/EmptyState';

const INK = '#16211D';
const LINE = '#D3DACB';
const SIGNAL = '#2B6E52';
const BLUE = '#2D5C82';

interface HistogramBin {
  range: string;
  count: number;
}

interface BarSlice {
  category: string;
  count: number;
}

interface BoxStats {
  minimum: number;
  q1: number;
  median: number;
  q3: number;
  maximum: number;
  lower_fence: number;
  upper_fence: number;
  outliers: number[];
  outliers_truncated: boolean;
  category?: string;
}

interface ScatterPoint {
  x: number;
  y: number;
}

interface LinePoint {
  date: string;
  value: number;
}

interface HeatmapCell {
  x: string;
  y: string;
  count: number;
}

interface GroupedBarRow {
  category: string;
  value: number;
  count: number;
}

const baseLayout: Partial<Layout> = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { family: 'IBM Plex Sans, sans-serif', color: INK, size: 12 },
  margin: { t: 40, r: 20, b: 60, l: 60 },
  xaxis: { gridcolor: LINE, zerolinecolor: LINE },
  yaxis: { gridcolor: LINE, zerolinecolor: LINE },
};

const config = { responsive: true, displaylogo: false };
const plotStyle = { width: '100%', height: '420px' };

interface ChartRendererProps {
  chart: ChartData;
}

export function ChartRenderer({ chart }: ChartRendererProps) {
  const rows = chart.data ?? [];

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No chart data"
        message="This selection doesn't have enough usable values to plot."
      />
    );
  }

  const layout: Partial<Layout> = {
    ...baseLayout,
    title: { text: chart.title, font: { size: 14 } },
    xaxis: { ...baseLayout.xaxis, title: { text: chart.x_label ?? '' } },
    yaxis: { ...baseLayout.yaxis, title: { text: chart.y_label ?? '' } },
  };

  switch (chart.chart_type) {
    case 'histogram': {
      const bins = rows as unknown as HistogramBin[];
      const data: Data[] = [
        {
          x: bins.map((b) => b.range),
          y: bins.map((b) => b.count),
          type: 'bar',
          marker: { color: SIGNAL },
        },
      ];
      return <Plot data={data} layout={layout} config={config} style={plotStyle} useResizeHandler />;
    }

    case 'bar': {
      const bars = rows as unknown as BarSlice[];
      const data: Data[] = [
        {
          x: bars.map((b) => b.category),
          y: bars.map((b) => b.count),
          type: 'bar',
          marker: { color: SIGNAL },
        },
      ];
      return <Plot data={data} layout={layout} config={config} style={plotStyle} useResizeHandler />;
    }

    case 'boxplot': {
      const stats = rows as unknown as BoxStats[];
      const traces: Data[] = stats.map((s, i) => ({
        type: 'box',
        name: s.category ?? chart.x_label ?? '',
        q1: [s.q1],
        median: [s.median],
        q3: [s.q3],
        lowerfence: [s.lower_fence],
        upperfence: [s.upper_fence],
        y: s.outliers.length ? [s.outliers] : undefined,
        boxpoints: s.outliers.length ? 'outliers' : false,
        marker: { color: SIGNAL },
        fillcolor: i % 2 === 0 ? SIGNAL : BLUE,
        opacity: 0.75,
      })) as Data[];
      const anyTruncated = stats.some((s) => s.outliers_truncated);
      return (
        <div>
          <Plot data={traces} layout={layout} config={config} style={plotStyle} useResizeHandler />
          {anyTruncated && (
            <p className="mt-2 text-xs text-ink-faint">
              Some outliers aren't shown individually — there were too many to plot.
            </p>
          )}
        </div>
      );
    }

    case 'scatter': {
      const points = rows as unknown as ScatterPoint[];
      const data: Data[] = [
        {
          x: points.map((p) => p.x),
          y: points.map((p) => p.y),
          type: 'scatter',
          mode: 'markers',
          marker: { color: SIGNAL, size: 6, opacity: 0.65 },
        },
      ];
      return <Plot data={data} layout={layout} config={config} style={plotStyle} useResizeHandler />;
    }

    case 'line': {
      const points = rows as unknown as LinePoint[];
      const data: Data[] = [
        {
          x: points.map((p) => p.date),
          y: points.map((p) => p.value),
          type: 'scatter',
          mode: 'lines+markers',
          line: { color: SIGNAL },
          marker: { size: 4 },
        },
      ];
      return <Plot data={data} layout={layout} config={config} style={plotStyle} useResizeHandler />;
    }

    case 'heatmap': {
      const cells = rows as unknown as HeatmapCell[];
      const xLabels = Array.from(new Set(cells.map((c) => c.x)));
      const yLabels = Array.from(new Set(cells.map((c) => c.y)));
      const z = yLabels.map((yl) =>
        xLabels.map((xl) => cells.find((c) => c.x === xl && c.y === yl)?.count ?? 0)
      );
      const data: Data[] = [
        {
          x: xLabels,
          y: yLabels,
          z,
          type: 'heatmap',
          colorscale: [
            [0, '#F1F3EF'],
            [1, '#1D4F3B'],
          ],
          showscale: true,
        },
      ];
      return <Plot data={data} layout={layout} config={config} style={plotStyle} useResizeHandler />;
    }

    case 'grouped_bar': {
      const groups = rows as unknown as GroupedBarRow[];
      const data: Data[] = [
        {
          x: groups.map((g) => g.category),
          y: groups.map((g) => g.value),
          type: 'bar',
          marker: { color: SIGNAL },
          text: groups.map((g) => `n = ${g.count}`),
          hovertemplate: '%{x}<br>mean = %{y:.3f}<br>%{text}<extra></extra>',
        },
      ];
      return <Plot data={data} layout={layout} config={config} style={plotStyle} useResizeHandler />;
    }

    default:
      return (
        <EmptyState
          title="Unsupported chart type"
          message={`InsightFlow doesn't have a renderer for "${chart.chart_type}" yet.`}
        />
      );
  }
}
