import { useEffect, useState } from 'react';
import { SprayCan, AlertCircle } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { useDataset } from '../context/DatasetContext';
import { applyCleaning, getCleaningRecommendations, previewCleaning } from '../lib/api/cleaning';
import type {
  CleaningOperationType,
  CleaningPreviewResponse,
  CleaningRecommendation,
  RecommendationSeverity,
} from '../lib/types/cleaning';
import { extractErrorMessage } from '../lib/errors';

const severityTone: Record<RecommendationSeverity, 'default' | 'info' | 'warn' | 'bad'> = {
  low: 'info',
  moderate: 'warn',
  high: 'bad',
  very_high: 'bad',
  complete: 'bad',
};

const OPERATIONS_NEEDING_VALUE: CleaningOperationType[] = ['fill_missing_placeholder'];
const DATASET_WIDE_OPERATIONS: CleaningOperationType[] = [
  'drop_duplicates',
  'drop_empty_columns',
  'drop_constant_columns',
  'drop_missing_rows',
];

export default function Cleaning() {
  const { dataset, setDataset } = useDataset();
  const [recommendations, setRecommendations] = useState<CleaningRecommendation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOp, setSelectedOp] = useState<Record<string, string>>({});
  const [placeholderValue, setPlaceholderValue] = useState<Record<string, string>>({});
  const [busyColumn, setBusyColumn] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [previewFor, setPreviewFor] = useState<CleaningRecommendation | null>(null);
  const [preview, setPreview] = useState<CleaningPreviewResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const load = () => {
    if (!dataset) return;
    setIsLoading(true);
    setError(null);
    getCleaningRecommendations(dataset.datasetId)
      .then((res) => setRecommendations(res.recommendations))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [dataset?.datasetId]);

  if (!dataset) return null;

  function buildRequest(rec: CleaningRecommendation) {
    const operation = (selectedOp[rec.column] ?? rec.suggested_operation ?? rec.available_operations[0]) as CleaningOperationType;
    const needsValue = OPERATIONS_NEEDING_VALUE.includes(operation);
    return {
      operation,
      column_name: DATASET_WIDE_OPERATIONS.includes(operation) ? null : rec.column,
      value: needsValue ? placeholderValue[rec.column] ?? '' : undefined,
    };
  }

  async function handlePreview(rec: CleaningRecommendation) {
    if (!dataset) return;
    setActionError(null);
    setBusyColumn(rec.column);
    setIsPreviewing(true);
    setPreviewFor(rec);
    try {
      const res = await previewCleaning(dataset.datasetId, buildRequest(rec));
      setPreview(res);
    } catch (err) {
      setActionError(extractErrorMessage(err));
      setPreviewFor(null);
    } finally {
      setIsPreviewing(false);
      setBusyColumn(null);
    }
  }

  async function handleApply() {
    if (!dataset || !previewFor) return;
    setIsApplying(true);
    setActionError(null);
    try {
      const res = await applyCleaning(dataset.datasetId, buildRequest(previewFor));
      setDataset({ ...dataset, rows: res.rows, columns: res.columns });
      setPreviewFor(null);
      setPreview(null);
      load();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <AppShell>
      <Topbar title="Cleaning" subtitle={dataset.filename} />

      <div className="mt-6">
        {isLoading && <LoadingState label="Diagnosing dataset…" />}
        {!isLoading && error && <ErrorState message={error} onRetry={load} />}
        {!isLoading && !error && recommendations && recommendations.length === 0 && (
          <EmptyState
            icon={<SprayCan className="h-6 w-6 text-signal" />}
            title="Nothing to clean"
            message="No data quality issues were found in this dataset."
          />
        )}
        {!isLoading && !error && recommendations && recommendations.length > 0 && (
          <div className="flex flex-col gap-3">
            {actionError && (
              <p className="flex items-center gap-2 rounded-md bg-red-soft px-3 py-2 text-sm text-red">
                <AlertCircle className="h-4 w-4 shrink-0" /> {actionError}
              </p>
            )}
            {recommendations.map((rec) => {
              const needsValue = OPERATIONS_NEEDING_VALUE.includes(
                (selectedOp[rec.column] ?? rec.suggested_operation ?? '') as CleaningOperationType
              );
              return (
                <Card key={rec.column} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink">{rec.column}</p>
                      <Badge tone={severityTone[rec.severity]}>{rec.severity.replaceAll('_', ' ')}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {rec.issue} — {rec.count} affected ({rec.percentage.toFixed(1)}%)
                    </p>
                    <p className="mt-0.5 text-xs text-ink-faint">{rec.reason}</p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {rec.available_operations.length > 1 ? (
                      <Select
                        value={selectedOp[rec.column] ?? rec.suggested_operation ?? rec.available_operations[0]}
                        onChange={(e) => setSelectedOp((prev) => ({ ...prev, [rec.column]: e.target.value }))}
                      >
                        {rec.available_operations.map((op) => (
                          <option key={op} value={op}>
                            {op.replaceAll('_', ' ')}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Badge tone="default">{(rec.suggested_operation ?? '').replaceAll('_', ' ')}</Badge>
                    )}

                    {needsValue && (
                      <input
                        placeholder="Fill value"
                        value={placeholderValue[rec.column] ?? ''}
                        onChange={(e) => setPlaceholderValue((prev) => ({ ...prev, [rec.column]: e.target.value }))}
                        className="w-28 rounded-md border border-line-strong bg-surface px-2 py-1.5 text-sm text-ink focus:border-signal"
                      />
                    )}

                    <Button
                      variant="secondary"
                      onClick={() => void handlePreview(rec)}
                      isLoading={busyColumn === rec.column}
                    >
                      Preview
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {previewFor && (
        <Modal
          title={`Preview: ${previewFor.column}`}
          onClose={() => {
            setPreviewFor(null);
            setPreview(null);
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setPreviewFor(null);
                  setPreview(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => void handleApply()} isLoading={isApplying} disabled={isPreviewing || !preview}>
                Apply cleaning
              </Button>
            </>
          }
        >
          {isPreviewing && <LoadingState label="Building preview…" />}
          {!isPreviewing && preview && (
            <div className="flex flex-col gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-ink-soft">Rows</p>
                  <p className="font-mono text-ink">
                    {preview.rows_before.toLocaleString()} → {preview.rows_after.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-ink-soft">Columns</p>
                  <p className="font-mono text-ink">
                    {preview.columns_before} → {preview.columns_after}
                  </p>
                </div>
              </div>
              <div className="rounded-md bg-surface-sunken p-3 text-xs text-ink-soft">{preview.operation.reason}</div>
              <p className="text-xs text-ink-faint">
                This won't change anything until you apply it. Nothing is modified automatically.
              </p>
            </div>
          )}
        </Modal>
      )}
    </AppShell>
  );
}
