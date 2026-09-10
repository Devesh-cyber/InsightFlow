import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/ui/Card';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { useDataset } from '../context/DatasetContext';
import { getCleaningHistory } from '../lib/api/cleaning';
import type { CleaningOperation } from '../lib/types/cleaning';
import { extractErrorMessage } from '../lib/errors';

export default function CleaningHistory() {
  const { dataset } = useDataset();
  const [history, setHistory] = useState<CleaningOperation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!dataset) return;
    setIsLoading(true);
    setError(null);
    getCleaningHistory(dataset.datasetId)
      .then((res) => setHistory(res.history))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [dataset?.datasetId]);

  if (!dataset) return null;

  return (
    <AppShell>
      <Topbar title="Cleaning history" subtitle={dataset.filename} />

      <div className="mt-6">
        {isLoading && <LoadingState label="Loading history…" />}
        {!isLoading && error && <ErrorState message={error} onRetry={load} />}
        {!isLoading && !error && history && history.length === 0 && (
          <EmptyState
            icon={<History className="h-6 w-6 text-ink-faint" />}
            title="No cleaning operations yet"
            message="Operations you apply from the Cleaning page will show up here, in order."
          />
        )}
        {!isLoading && !error && history && history.length > 0 && (
          <div className="flex flex-col gap-2">
            {history.map((op, i) => (
              <Card key={i} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-ink">{op.operation.replaceAll('_', ' ')}</p>
                  {op.column_name && <p className="text-xs font-mono text-ink-faint">{op.column_name}</p>}
                  <p className="mt-1 text-sm text-ink-soft">{op.reason}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-ink-faint">
                  {op.affected_rows > 0 && <p>{op.affected_rows.toLocaleString()} rows</p>}
                  {op.affected_columns > 0 && <p>{op.affected_columns} columns</p>}
                  {op.affected_cells > 0 && <p>{op.affected_cells.toLocaleString()} cells</p>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
