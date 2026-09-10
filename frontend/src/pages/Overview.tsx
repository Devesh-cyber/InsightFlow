import { useEffect, useState } from 'react';
import { Database, Rows3, Columns3, Percent } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useDataset } from '../context/DatasetContext';
import { getOverview } from '../lib/api/overview';
import type { OverviewResponse } from '../lib/types/overview';
import { extractErrorMessage } from '../lib/errors';
import { formatBytes, formatNumber, formatPercent } from '../lib/format';

export default function Overview() {
  const { dataset } = useDataset();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!dataset) return;
    setIsLoading(true);
    setError(null);
    getOverview(dataset.datasetId)
      .then(setData)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [dataset?.datasetId]);

  if (!dataset) return null;

  return (
    <AppShell>
      <Topbar title="Overview" subtitle={dataset.filename} />

      <div className="mt-6">
        {isLoading && <LoadingState label="Loading overview…" />}
        {!isLoading && error && <ErrorState message={error} onRetry={load} />}
        {!isLoading && !error && data && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Rows" value={formatNumber(data.metadata.rows)} icon={<Rows3 className="h-4 w-4 text-ink-faint" />} />
              <StatCard label="Columns" value={formatNumber(data.metadata.columns)} icon={<Columns3 className="h-4 w-4 text-ink-faint" />} />
              <StatCard
                label="Completeness"
                value={formatPercent(data.completeness_percentage)}
                tone={data.completeness_percentage >= 95 ? 'good' : data.completeness_percentage >= 80 ? 'warn' : 'bad'}
                icon={<Percent className="h-4 w-4 text-ink-faint" />}
              />
              <StatCard label="Memory" value={formatBytes(data.metadata.memory_usage)} icon={<Database className="h-4 w-4 text-ink-faint" />} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <p className="text-sm text-ink-soft">Missing cells</p>
                <p className="mt-1 font-mono text-lg font-medium text-ink">{formatNumber(data.metadata.missing_cells)}</p>
              </Card>
              <Card>
                <p className="text-sm text-ink-soft">Duplicate rows</p>
                <p className="mt-1 font-mono text-lg font-medium text-ink">{formatNumber(data.metadata.duplicate_rows)}</p>
              </Card>
              <Card>
                <p className="text-sm text-ink-soft">Column types</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-ink-soft">
                  {Object.entries(data.metadata.column_types).map(([type, count]) => (
                    <span key={type}>
                      {type}: {count}
                    </span>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-medium text-ink-soft">Preview</h2>
              <Card className="overflow-x-auto p-0">
                {data.preview.length === 0 ? (
                  <p className="p-5 text-sm text-ink-soft">No rows to preview.</p>
                ) : (
                  <table className="w-full min-w-max border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-line bg-surface-sunken">
                        {Object.keys(data.preview[0]).map((col) => (
                          <th key={col} className="px-3 py-2 text-left text-xs font-medium text-ink-soft">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.preview.map((row, i) => (
                        <tr key={i} className="border-b border-line last:border-0">
                          {Object.keys(data.preview[0]).map((col) => (
                            <td key={col} className="whitespace-nowrap px-3 py-2 font-mono text-ink">
                              {row[col] === null || row[col] === undefined ? (
                                <span className="text-ink-faint">null</span>
                              ) : (
                                String(row[col])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
