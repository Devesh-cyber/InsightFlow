import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { useDataset } from '../context/DatasetContext';
import { getRelationship, getRelationshipColumns } from '../lib/api/relationships';
import type { ColumnSummary } from '../lib/types/column';
import type { RelationshipResult } from '../lib/types/relationship';
import { extractErrorMessage } from '../lib/errors';
import { formatNumber } from '../lib/format';

const directionTone: Record<string, 'good' | 'bad' | 'default'> = {
  positive: 'good',
  negative: 'bad',
  none: 'default',
};

export default function Relationships() {
  const { dataset } = useDataset();
  const [columns, setColumns] = useState<ColumnSummary[]>([]);
  const [columnA, setColumnA] = useState('');
  const [columnB, setColumnB] = useState('');
  const [result, setResult] = useState<RelationshipResult | null>(null);
  const [isLoadingColumns, setIsLoadingColumns] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataset) return;
    setIsLoadingColumns(true);
    setError(null);
    getRelationshipColumns(dataset.datasetId)
      .then((cols) => {
        setColumns(cols);
        if (cols.length >= 2) {
          setColumnA(cols[0].column_name);
          setColumnB(cols[1].column_name);
        }
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoadingColumns(false));
  }, [dataset?.datasetId]);

  useEffect(() => {
    if (!dataset || !columnA || !columnB || columnA === columnB) {
      setResult(null);
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    getRelationship(dataset.datasetId, columnA, columnB)
      .then(setResult)
      .catch((err) => setAnalysisError(extractErrorMessage(err)))
      .finally(() => setIsAnalyzing(false));
  }, [dataset?.datasetId, columnA, columnB]);

  if (!dataset) return null;

  return (
    <AppShell>
      <Topbar title="Relationships" subtitle={dataset.filename} />

      <div className="mt-6">
        {isLoadingColumns && <LoadingState label="Loading columns…" />}
        {!isLoadingColumns && error && <ErrorState message={error} />}
        {!isLoadingColumns && !error && columns.length < 2 && (
          <EmptyState title="Not enough columns" message="This dataset needs at least two columns to analyze a relationship." />
        )}
        {!isLoadingColumns && !error && columns.length >= 2 && (
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
                <Select label="Column B" value={columnB} onChange={(e) => setColumnB(e.target.value)}>
                  {columns.map((c) => (
                    <option key={c.column_name} value={c.column_name}>
                      {c.column_name}
                    </option>
                  ))}
                </Select>
              </div>
            </Card>

            {columnA === columnB && (
              <p className="text-sm text-ink-soft">Pick two different columns to compare.</p>
            )}

            {isAnalyzing && <LoadingState label="Analyzing relationship…" />}
            {!isAnalyzing && analysisError && <ErrorState message={analysisError} />}
            {!isAnalyzing && !analysisError && result && columnA !== columnB && (
              <Card>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-ink">
                    {result.column_a} vs {result.column_b}
                  </h3>
                  <Badge>{result.analysis_type.replaceAll('_', ' → ')}</Badge>
                  {result.direction && (
                    <Badge tone={directionTone[result.direction]}>{result.direction}</Badge>
                  )}
                  {result.strength && <Badge tone="info">{result.strength}</Badge>}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  {result.correlation !== null && (
                    <div>
                      <dt className="text-ink-soft">Correlation</dt>
                      <dd className="font-mono text-ink">{formatNumber(result.correlation, 3)}</dd>
                    </div>
                  )}
                  {result.association !== null && (
                    <div>
                      <dt className="text-ink-soft">Association</dt>
                      <dd className="font-mono text-ink">{formatNumber(result.association, 3)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-ink-soft">Sample size</dt>
                    <dd className="font-mono text-ink">{formatNumber(result.sample_size)}</dd>
                  </div>
                </dl>

                {Object.keys(result.result).length > 0 && (
                  <div className="mt-4 overflow-x-auto rounded-md border border-line">
                    <table className="w-full min-w-max border-collapse text-sm">
                      <tbody>
                        {Object.entries(result.result).map(([key, value]) => (
                          <tr key={key} className="border-b border-line last:border-0">
                            <td className="px-3 py-2 text-ink-soft">{key.replaceAll('_', ' ')}</td>
                            <td className="px-3 py-2 text-right font-mono text-ink">
                              {typeof value === 'number' ? formatNumber(value, 3) : String(value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
