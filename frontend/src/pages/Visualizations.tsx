import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';
import {
  AlertCircle,
  BarChart3,
  Info,
  Loader2,
  PieChart,
  Upload,
} from 'lucide-react';
import axios from 'axios';

import { getColumnSummaries } from '../api/column';
import { getVisualizationData, getVisualizationOptions } from '../api/visualization';
import { PageContainer } from '../components/layout/PageContainer';
import { Panel } from '../components/layout/Panel';
import { SectionHeader } from '../components/layout/SectionHeader';
import { useDatasetSession } from '../hooks/useDatasetSession';
import type { ColumnSummary } from '../types/column';
import type { ChartData, ChartOption } from '../types/visualization';

export default function Visualizations() {
  const { session } = useDatasetSession();
  const navigate = useNavigate();

  // Column summaries state
  const [columns, setColumns] = useState<ColumnSummary[] | null>(null);
  const [loadingColumns, setLoadingColumns] = useState<boolean>(true);
  const [columnsError, setColumnsError] = useState<string | null>(null);

  // Selection mode & dropdown state
  const [mode, setMode] = useState<'single' | 'two'>('single');
  const [columnA, setColumnA] = useState<string>('');
  const [columnB, setColumnB] = useState<string>('');

  // Available chart options state
  const [availableCharts, setAvailableCharts] = useState<ChartOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);
  const [selectedChartType, setSelectedChartType] = useState<string>('');

  // Generated chart data state
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loadingChartData, setLoadingChartData] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);

  // Load available columns on mount/session change
  useEffect(() => {
    if (!session?.datasetId) {
      setLoadingColumns(false);
      return;
    }

    let isMounted = true;
    setLoadingColumns(true);
    setColumnsError(null);

    getColumnSummaries(session.datasetId)
      .then((data) => {
        if (isMounted) {
          setColumns(data);
          setLoadingColumns(false);
          if (data.length > 0) {
            setColumnA(data[0].column_name);
            if (data.length >= 2) {
              setColumnB(data[1].column_name);
            }
          }
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          let msg = 'Failed to load dataset columns.';
          if (axios.isAxiosError(err)) {
            if (err.response?.status === 404) {
              msg = 'Dataset session was not found or has expired. Please upload the dataset again.';
            } else if (err.response?.data?.message) {
              msg = err.response.data.message;
            }
          } else if (err instanceof Error) {
            msg = err.message;
          }
          setColumnsError(msg);
          setLoadingColumns(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session?.datasetId]);

  // Fetch valid visualization options when column selections change
  useEffect(() => {
    if (!session?.datasetId || !columnA) {
      setAvailableCharts([]);
      setSelectedChartType('');
      return;
    }

    if (mode === 'two' && (!columnB || columnA === columnB)) {
      setAvailableCharts([]);
      setSelectedChartType('');
      return;
    }

    let isMounted = true;
    setLoadingOptions(true);

    const targetB = mode === 'two' ? columnB : null;

    getVisualizationOptions(session.datasetId, columnA, targetB)
      .then((data) => {
        if (isMounted) {
          setAvailableCharts(data.available_charts);
          setLoadingOptions(false);
          if (data.available_charts.length > 0) {
            setSelectedChartType(data.available_charts[0].chart_type);
          } else {
            setSelectedChartType('');
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setAvailableCharts([]);
          setSelectedChartType('');
          setLoadingOptions(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session?.datasetId, columnA, columnB, mode]);

  // Handle chart generation request
  const handleGenerate = () => {
    if (!session?.datasetId || !columnA || !selectedChartType) return;
    if (mode === 'two' && (!columnB || columnA === columnB)) return;

    setLoadingChartData(true);
    setChartError(null);
    setChartData(null);

    const targetB = mode === 'two' ? columnB : null;

    getVisualizationData(session.datasetId, columnA, selectedChartType, targetB)
      .then((data) => {
        setChartData(data);
        setLoadingChartData(false);
      })
      .catch((err: unknown) => {
        let msg = 'Failed to generate chart visualization.';
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            msg = 'Dataset session was not found or has expired. Please upload the dataset again.';
          } else if (err.response?.data?.message) {
            msg = err.response.data.message;
          }
        } else if (err instanceof Error) {
          msg = err.message;
        }
        setChartError(msg);
        setLoadingChartData(false);
      });
  };

  // Build Plotly traces and layout from backend ChartData directly
  const plotlyPayload = useMemo(() => {
    if (!chartData || !chartData.data) {
      return { traces: [], layout: {} };
    }

    const { chart_type, title, x_label, y_label, data } = chartData;

    const baseLayout = {
      title: {
        text: title,
        font: { color: '#f8fafc', family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', size: 16 },
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: '#0b0f19',
      font: { color: '#94a3b8', family: 'sans-serif' },
      xaxis: {
        title: { text: x_label || '', font: { color: '#94a3b8' } },
        tickfont: { color: '#94a3b8' },
        gridcolor: '#1e293b',
        zerolinecolor: '#334155',
      },
      yaxis: {
        title: { text: y_label || '', font: { color: '#94a3b8' } },
        tickfont: { color: '#94a3b8' },
        gridcolor: '#1e293b',
        zerolinecolor: '#334155',
      },
      autosize: true,
      margin: { t: 50, r: 30, l: 60, b: 60 },
    };

    let traces: Record<string, unknown>[] = [];

    switch (chart_type) {
      case 'histogram':
        traces = [
          {
            type: 'bar',
            x: data.map((d) => String(d.range ?? '')),
            y: data.map((d) => Number(d.count ?? 0)),
            marker: { color: '#3b82f6' },
          },
        ];
        break;

      case 'boxplot': {
        const hasCategory = data.some((d) => 'category' in d);
        if (hasCategory) {
          traces = data.map((d) => {
            const catName = String(d.category ?? '');
            const outliers = Array.isArray(d.outliers) ? (d.outliers as number[]).map(Number) : [];
            return {
              type: 'box',
              name: catName,
              q1: [Number(d.q1 ?? 0)],
              median: [Number(d.median ?? 0)],
              q3: [Number(d.q3 ?? 0)],
              lowerfence: [Number(d.minimum ?? 0)],
              upperfence: [Number(d.maximum ?? 0)],
              y: outliers,
              boxpoints: 'outliers',
              marker: { size: 6 },
              fillcolor: 'rgba(59, 130, 246, 0.2)',
              line: { color: '#3b82f6' },
            };
          });
        } else if (data.length > 0) {
          const d = data[0];
          const outliers = Array.isArray(d.outliers) ? (d.outliers as number[]).map(Number) : [];
          traces = [
            {
              type: 'box',
              name: x_label || 'Distribution',
              q1: [Number(d.q1 ?? 0)],
              median: [Number(d.median ?? 0)],
              q3: [Number(d.q3 ?? 0)],
              lowerfence: [Number(d.minimum ?? 0)],
              upperfence: [Number(d.maximum ?? 0)],
              y: outliers,
              boxpoints: 'outliers',
              marker: { color: '#3b82f6', size: 6 },
              fillcolor: 'rgba(59, 130, 246, 0.2)',
              line: { color: '#3b82f6' },
            },
          ];
        }
        break;
      }

      case 'bar':
        traces = [
          {
            type: 'bar',
            x: data.map((d) => String(d.category ?? '')),
            y: data.map((d) => Number(d.count ?? 0)),
            marker: { color: '#10b981' },
          },
        ];
        break;

      case 'grouped_bar':
        traces = [
          {
            type: 'bar',
            x: data.map((d) => String(d.category ?? '')),
            y: data.map((d) => Number(d.value ?? 0)),
            marker: { color: '#3b82f6' },
          },
        ];
        break;

      case 'scatter':
        traces = [
          {
            type: 'scatter',
            mode: 'markers',
            x: data.map((d) => Number(d.x ?? 0)),
            y: data.map((d) => Number(d.y ?? 0)),
            marker: { color: '#3b82f6', size: 6, opacity: 0.7 },
          },
        ];
        break;

      case 'line':
        traces = [
          {
            type: 'scatter',
            mode: 'lines',
            x: data.map((d) => String(d.date ?? '')),
            y: data.map((d) => Number(d.value ?? 0)),
            line: { color: '#3b82f6', width: 2 },
          },
        ];
        break;

      case 'heatmap': {
        const xVals = Array.from(new Set(data.map((d) => String(d.x ?? ''))));
        const yVals = Array.from(new Set(data.map((d) => String(d.y ?? ''))));
        const zMatrix: number[][] = yVals.map((y) =>
          xVals.map((x) => {
            const match = data.find((d) => String(d.x) === x && String(d.y) === y);
            return match ? Number(match.count ?? 0) : 0;
          })
        );
        traces = [
          {
            type: 'heatmap',
            x: xVals,
            y: yVals,
            z: zMatrix,
            colorscale: 'Viridis',
          },
        ];
        break;
      }

      default:
        break;
    }

    return { traces, layout: baseLayout };
  }, [chartData]);

  // 1. No Active Session State
  if (!session?.datasetId) {
    return (
      <PageContainer>
        <SectionHeader
          title="Visualization Studio"
          description="Generate backend-computed data charts and distribution visualizers."
        />
        <Panel className="max-w-2xl mx-auto py-12 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-[var(--color-bg-surface-hover)] rounded-full text-[var(--color-text-muted)] border border-[var(--color-border-strong)]">
              <PieChart className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
              No Active Dataset Session
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
              A dataset must be uploaded before charts and visualizations can be generated.
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-[var(--color-brand-blue)] hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Dataset
            </button>
          </div>
        </Panel>
      </PageContainer>
    );
  }

  // 2. Loading Columns State
  if (loadingColumns) {
    return (
      <PageContainer>
        <SectionHeader
          title="Visualization Studio"
          description="Loading dataset column definitions..."
        />
        <Panel className="py-16 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              Loading available columns...
            </p>
          </div>
        </Panel>
      </PageContainer>
    );
  }

  // 3. Failed Columns Request State
  if (columnsError || !columns) {
    return (
      <PageContainer>
        <SectionHeader
          title="Visualization Studio"
          description="Generate backend-computed data charts and distribution visualizers."
        />
        <Panel className="max-w-2xl mx-auto py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[var(--color-brand-red)]/10 rounded-lg text-[var(--color-brand-red)] border border-[var(--color-brand-red)]/20 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                Failed to Load Columns
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-mono mb-6">
                {columnsError || 'An unexpected error occurred.'}
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-blue)] hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload New Dataset
              </button>
            </div>
          </div>
        </Panel>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        title="Visualization Studio"
        description="Select single or paired columns to view supported backend-generated charts."
      />

      {/* Control Configuration Panel */}
      <Panel title="Visualization Controls">
        <div className="space-y-6">
          {/* Mode Selector Toggle */}
          <div className="flex items-center gap-6 pb-4 border-b border-[var(--color-border-subtle)]">
            <span className="text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
              Analysis Mode:
            </span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  name="viz_mode"
                  value="single"
                  checked={mode === 'single'}
                  onChange={() => setMode('single')}
                  className="accent-[var(--color-brand-blue)]"
                />
                Single Column
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[var(--color-text-primary)]">
                <input
                  type="radio"
                  name="viz_mode"
                  value="two"
                  checked={mode === 'two'}
                  onChange={() => setMode('two')}
                  className="accent-[var(--color-brand-blue)]"
                />
                Two Columns
              </label>
            </div>
          </div>

          {/* Column Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                Column A
              </label>
              <select
                value={columnA}
                onChange={(e) => setColumnA(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] rounded text-sm text-[var(--color-text-primary)] font-mono focus:outline-none focus:border-[var(--color-brand-blue)]"
              >
                <option value="" disabled>
                  Select Column A
                </option>
                {columns.map((col) => (
                  <option key={col.column_name} value={col.column_name}>
                    {col.column_name} ({col.detected_type})
                  </option>
                ))}
              </select>
            </div>

            {mode === 'two' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Column B
                </label>
                <select
                  value={columnB}
                  onChange={(e) => setColumnB(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] rounded text-sm text-[var(--color-text-primary)] font-mono focus:outline-none focus:border-[var(--color-brand-blue)]"
                >
                  <option value="" disabled>
                    Select Column B
                  </option>
                  {columns.map((col) => (
                    <option
                      key={col.column_name}
                      value={col.column_name}
                      disabled={col.column_name === columnA}
                    >
                      {col.column_name} ({col.detected_type})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Supported Chart Types Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
              Supported Chart Types ({availableCharts.length})
            </label>

            {loadingOptions ? (
              <div className="flex items-center gap-2 py-3 text-xs font-mono text-[var(--color-text-secondary)]">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-brand-blue)]" />
                <span>Checking backend chart compatibility...</span>
              </div>
            ) : availableCharts.length === 0 ? (
              <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded text-xs font-mono text-[var(--color-text-muted)] flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" />
                <span>
                  No backend-supported charts available for this column combination.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {availableCharts.map((chart) => {
                  const isSelected = chart.chart_type === selectedChartType;

                  return (
                    <div
                      key={chart.chart_type}
                      onClick={() => setSelectedChartType(chart.chart_type)}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[var(--color-bg-surface-hover)] border-[var(--color-brand-blue)] text-[var(--color-text-primary)]'
                          : 'bg-[var(--color-bg-base)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-semibold text-[var(--color-text-primary)]">
                          {chart.label}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                          {chart.chart_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2">
                        {chart.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleGenerate}
              disabled={
                !columnA ||
                !selectedChartType ||
                (mode === 'two' && (!columnB || columnA === columnB)) ||
                loadingChartData
              }
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-brand-blue)] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium text-sm transition-colors"
            >
              {loadingChartData ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Chart Data...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Generate Visualization
                </>
              )}
            </button>
          </div>
        </div>
      </Panel>

      {/* Chart Output Panel */}
      <div className="mt-6">
        {loadingChartData ? (
          <Panel className="py-16 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
              <p className="text-sm font-medium text-[var(--color-text-secondary)] font-mono">
                Fetching backend visualization data for "{selectedChartType}"...
              </p>
            </div>
          </Panel>
        ) : chartError ? (
          <Panel title="Visualization Error">
            <div className="p-4 bg-[var(--color-brand-red)]/10 border border-[var(--color-brand-red)]/20 rounded-lg text-sm font-mono text-red-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1">Visualization Failed</span>
                <span>{chartError}</span>
              </div>
            </div>
          </Panel>
        ) : !chartData ? (
          <Panel className="py-12 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <BarChart3 className="w-8 h-8 text-[var(--color-text-muted)]" />
              <p className="text-sm font-mono text-[var(--color-text-secondary)]">
                Select columns and a chart type above, then click "Generate Visualization".
              </p>
            </div>
          </Panel>
        ) : (
          <Panel title={chartData.title}>
            {chartData.data.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-mono text-[var(--color-text-muted)]">
                  The backend returned empty data for this visualization selection.
                </p>
              </div>
            ) : (
              <div className="w-full min-h-[420px] flex items-center justify-center">
                <Plot
                  data={plotlyPayload.traces as never}
                  layout={plotlyPayload.layout as never}
                  config={{ responsive: true, displayModeBar: true, displaylogo: false }}
                  style={{ width: '100%', height: '100%', minHeight: '420px' }}
                />
              </div>
            )}
          </Panel>
        )}
      </div>
    </PageContainer>
  );
}
