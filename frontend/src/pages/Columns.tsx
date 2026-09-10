import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useDataset } from '../context/DatasetContext';
import { getColumnAnalysis, getColumnSummaries } from '../lib/api/columns';
import type { ColumnAnalysis, ColumnSummary, DetectedType } from '../lib/types/column';
import { extractErrorMessage } from '../lib/errors';
import { formatNumber, formatPercent } from '../lib/format';

const typeTone: Record<DetectedType, 'good' | 'info' | 'warn' | 'default'> = {
  numeric: 'good',
  categorical: 'info',
  boolean: 'warn',
  datetime: 'default',
  unknown: 'default',
};

export default function Columns() {
  const { dataset } = useDataset();
  const [columns, setColumns] = useState<ColumnSummary[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ColumnAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!dataset) return;
    setIsLoading(true);
    setError(null);
    getColumnSummaries(dataset.datasetId)
      .then((cols) => {
        setColumns(cols);
        if (cols.length > 0) setSelected(cols[0].column_name);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [dataset?.datasetId]);

  useEffect(() => {
    if (!dataset || !selected) return;
    setIsLoadingAnalysis(true);
    getColumnAnalysis(dataset.datasetId, selected)
      .then(setAnalysis)
      .catch(() => setAnalysis(null))
      .finally(() => setIsLoadingAnalysis(false));
  }, [dataset?.datasetId, selected]);

  if (!dataset) return null;

  return (
    <AppShell>
      <Topbar title="Columns" subtitle={dataset.filename} />

      <div className="mt-6">
        {isLoading && <LoadingState label="Analyzing columns…" />}
        {!isLoading && error && <ErrorState message={error} onRetry={load} />}
        {!isLoading && !error && columns && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Card className="overflow-x-auto p-0">
                <table className="w-full min-w-max border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-sunken">
                      <th className="px-3 py-2 text-left text-xs font-medium text-ink-soft">Column</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-ink-soft">Type</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-ink-soft">Missing</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-ink-soft">Unique</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((col) => (
                      <tr
                        key={col.column_name}
                        onClick={() => setSelected(col.column_name)}
                        className={`cursor-pointer border-b border-line last:border-0 hover:bg-surface-sunken ${
                          selected === col.column_name ? 'bg-signal-soft' : ''
                        }`}
                      >
                        <td className="px-3 py-2 font-medium text-ink">{col.column_name}</td>
                        <td className="px-3 py-2">
                          <Badge tone={typeTone[col.detected_type]}>{col.detected_type}</Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-ink">
                          {formatPercent(col.missing_percentage)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-ink">{formatNumber(col.unique_count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {isLoadingAnalysis && <LoadingState label="Loading column detail…" />}
              {!isLoadingAnalysis && analysis && (
                <Card>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-ink">{analysis.summary.column_name}</h3>
                    <Badge tone={typeTone[analysis.summary.detected_type]}>{analysis.summary.detected_type}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-ink-faint">{analysis.summary.pandas_dtype}</p>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-ink-soft">Missing</dt>
                      <dd className="font-mono text-ink">
                        {formatNumber(analysis.summary.missing_count)} ({formatPercent(analysis.summary.missing_percentage)})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-soft">Unique</dt>
                      <dd className="font-mono text-ink">{formatNumber(analysis.summary.unique_count)}</dd>
                    </div>

                    {analysis.statistics && (
                      <>
                        <div>
                          <dt className="text-ink-soft">Mean</dt>
                          <dd className="font-mono text-ink">{formatNumber(analysis.statistics.mean)}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-soft">Median</dt>
                          <dd className="font-mono text-ink">{formatNumber(analysis.statistics.median)}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-soft">Min</dt>
                          <dd className="font-mono text-ink">{formatNumber(analysis.statistics.minimum)}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-soft">Max</dt>
                          <dd className="font-mono text-ink">{formatNumber(analysis.statistics.maximum)}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-soft">Std. dev</dt>
                          <dd className="font-mono text-ink">{formatNumber(analysis.statistics.standard_deviation)}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-soft">Skewness</dt>
                          <dd className="font-mono text-ink">{formatNumber(analysis.statistics.skewness)}</dd>
                        </div>
                      </>
                    )}
                  </dl>

                  {analysis.sample_values.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-ink-soft">Sample values</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {analysis.sample_values.slice(0, 12).map((v, i) => (
                          <span
                            key={i}
                            className="rounded bg-surface-sunken px-2 py-0.5 font-mono text-xs text-ink-soft"
                          >
                            {String(v)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
