import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { ChartRenderer } from '../components/charts/ChartRenderer';
import { useDataset } from '../context/DatasetContext';
import { getColumnSummaries } from '../lib/api/columns';
import { getChartData, getVisualizationOptions } from '../lib/api/visualizations';
import type { ColumnSummary } from '../lib/types/column';
import type { ChartData, ChartOption } from '../lib/types/visualization';
import { extractErrorMessage } from '../lib/errors';

const NONE = '__none__';

export default function Visualizations() {
  const { dataset } = useDataset();
  const [columns, setColumns] = useState<ColumnSummary[]>([]);
  const [columnA, setColumnA] = useState('');
  const [columnB, setColumnB] = useState(NONE);
  const [options, setOptions] = useState<ChartOption[]>([]);
  const [chartType, setChartType] = useState('');
  const [chart, setChart] = useState<ChartData | null>(null);

  const [isLoadingColumns, setIsLoadingColumns] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataset) return;
    setIsLoadingColumns(true);
    setError(null);
    getColumnSummaries(dataset.datasetId)
      .then((cols) => {
        setColumns(cols);
        if (cols.length > 0) setColumnA(cols[0].column_name);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoadingColumns(false));
  }, [dataset?.datasetId]);

  useEffect(() => {
    if (!dataset || !columnA) return;
    const effectiveB = columnB === NONE ? undefined : columnB;
    if (effectiveB && effectiveB === columnA) return;

    setIsLoadingOptions(true);
    setOptionsError(null);
    setChart(null);
    getVisualizationOptions(dataset.datasetId, columnA, effectiveB)
      .then((res) => {
        setOptions(res.available_charts);
        setChartType(res.available_charts[0]?.chart_type ?? '');
      })
      .catch((err) => setOptionsError(extractErrorMessage(err)))
      .finally(() => setIsLoadingOptions(false));
  }, [dataset?.datasetId, columnA, columnB]);

  useEffect(() => {
    if (!dataset || !columnA || !chartType) {
      setChart(null);
      return;
    }
    const effectiveB = columnB === NONE ? undefined : columnB;

    setIsLoadingChart(true);
    setChartError(null);
    getChartData(dataset.datasetId, columnA, chartType, effectiveB)
      .then(setChart)
      .catch((err) => setChartError(extractErrorMessage(err)))
      .finally(() => setIsLoadingChart(false));
  }, [dataset?.datasetId, columnA, columnB, chartType]);

  if (!dataset) return null;

  const sameColumn = columnB !== NONE && columnB === columnA;

  return (
    <AppShell>
      <Topbar title="Visualizations" subtitle={dataset.filename} />

      <div className="mt-6">
        {isLoadingColumns && <LoadingState label="Loading columns…" />}
        {!isLoadingColumns && error && <ErrorState message={error} />}
        {!isLoadingColumns && !error && (
          <div className="flex flex-col gap-6">
            <Card className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Select label="Column A" value={columnA} onChange={(e) => setColumnA(e.target.value)}>
                  {columns.map((c) => (
                    <option key={c.column_name} value={c.column_name}>
                      {c.column_name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex-1">
                <Select label="Column B (optional)" value={columnB} onChange={(e) => setColumnB(e.target.value)}>
                  <option value={NONE}>None</option>
                  {columns.map((c) => (
                    <option key={c.column_name} value={c.column_name}>
                      {c.column_name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex-1">
                <Select
                  label="Chart type"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  disabled={options.length === 0}
                >
                  {options.length === 0 && <option value="">No charts available</option>}
                  {options.map((opt) => (
                    <option key={opt.chart_type} value={opt.chart_type}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </Card>

            {sameColumn && <p className="text-sm text-ink-soft">Pick two different columns, or set Column B to None.</p>}

            {!sameColumn && isLoadingOptions && <LoadingState label="Finding available charts…" />}
            {!sameColumn && !isLoadingOptions && optionsError && <ErrorState message={optionsError} />}
            {!sameColumn && !isLoadingOptions && !optionsError && options.length === 0 && (
              <EmptyState
                title="No charts available"
                message="This column combination doesn't have enough usable data, or isn't supported yet."
              />
            )}

            {!sameColumn && !isLoadingOptions && options.length > 0 && (
              <Card>
                {isLoadingChart && <LoadingState label="Rendering chart…" />}
                {!isLoadingChart && chartError && <ErrorState message={chartError} />}
                {!isLoadingChart && !chartError && chart && <ChartRenderer chart={chart} />}
              </Card>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
