import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Database,
  History as HistoryIcon,
  Loader2,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import axios from 'axios';

import { getCleaningHistory } from '../api/cleaning';
import { getOverview } from '../api/overview';
import { PageContainer } from '../components/layout/PageContainer';
import { Panel } from '../components/layout/Panel';
import { SectionHeader } from '../components/layout/SectionHeader';
import { useDatasetSession } from '../hooks/useDatasetSession';
import type { CleaningOperation } from '../types/cleaning';
import type { OverviewResponse } from '../types/overview';

const OPERATION_LABELS: Record<string, string> = {
  fill_missing_mean: 'Fill Missing with Mean',
  fill_missing_median: 'Fill Missing with Median',
  fill_missing_mode: 'Fill Missing with Mode',
  fill_missing_placeholder: 'Fill Missing with Placeholder',
  drop_column: 'Drop Column',
  drop_duplicates: 'Drop Duplicate Rows',
  drop_empty_columns: 'Drop Empty Columns',
  drop_constant_columns: 'Drop Constant Columns',
  drop_missing_rows: 'Drop Missing Rows',
};

export default function CleaningHistory() {
  const { session } = useDatasetSession();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [history, setHistory] = useState<CleaningOperation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoryData = useCallback(async () => {
    if (!session?.datasetId) return;

    setLoading(true);
    setError(null);

    try {
      const [overviewRes, historyRes] = await Promise.all([
        getOverview(session.datasetId),
        getCleaningHistory(session.datasetId),
      ]);

      setOverview(overviewRes);
      setHistory(historyRes.history);
    } catch (err: unknown) {
      let msg = 'Failed to load dataset cleaning history.';
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          msg = 'Dataset session was not found or has expired. Please upload the dataset again.';
        } else if (err.response?.data?.message) {
          msg = err.response.data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [session?.datasetId]);

  useEffect(() => {
    fetchHistoryData();
  }, [fetchHistoryData]);

  // 1. No Active Dataset Session
  if (!session?.datasetId) {
    return (
      <PageContainer>
        <SectionHeader
          title="Cleaning History"
          description="View the chronological analytical activity log of dataset cleaning operations."
        />
        <Panel className="max-w-2xl mx-auto py-12 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-[var(--color-bg-surface-hover)] rounded-full text-[var(--color-text-muted)] border border-[var(--color-border-strong)]">
              <Sparkles className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
              No Active Dataset Session
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
              A dataset must be uploaded before cleaning history can be inspected.
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

  // 2. Loading State
  if (loading && !overview) {
    return (
      <PageContainer>
        <SectionHeader
          title="Cleaning History"
          description="Fetching analytical activity log from session..."
        />
        <Panel className="py-16 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
            <p className="text-sm font-medium text-[var(--color-text-secondary)] font-mono">
              Loading cleaning execution history...
            </p>
          </div>
        </Panel>
      </PageContainer>
    );
  }

  // 3. API Error State
  if (error && !overview) {
    return (
      <PageContainer>
        <SectionHeader
          title="Cleaning History"
          description="View the chronological analytical activity log of dataset cleaning operations."
        />
        <Panel className="max-w-2xl mx-auto py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[var(--color-brand-red)]/10 rounded-lg text-[var(--color-brand-red)] border border-[var(--color-brand-red)]/20 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                Failed to Load History
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-mono mb-6">{error}</p>
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <SectionHeader
          title="Cleaning History"
          description="Authoritative chronological log of all cleaning operations executed on this dataset session."
        />
        <button
          onClick={() => navigate('/cleaning')}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-strong)] rounded text-xs font-mono text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cleaning Center
        </button>
      </div>

      {/* Dataset Metadata Header */}
      {overview && (
        <Panel title="Active Dataset Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
              <span className="text-[var(--color-text-muted)] block text-[10px] uppercase mb-1">
                Dataset Name
              </span>
              <span className="font-semibold text-[var(--color-text-primary)] truncate block">
                {overview.metadata.dataset_name}
              </span>
            </div>
            <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
              <span className="text-[var(--color-text-muted)] block text-[10px] uppercase mb-1">
                Current Dimensions
              </span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {overview.metadata.rows.toLocaleString()} rows × {overview.metadata.columns} cols
              </span>
            </div>
            <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
              <span className="text-[var(--color-text-muted)] block text-[10px] uppercase mb-1">
                Operations Executed
              </span>
              <span className="font-semibold text-[var(--color-brand-blue)]">
                {history.length} operations
              </span>
            </div>
          </div>
        </Panel>
      )}

      {/* Chronological History Log */}
      <div className="mt-6">
        {history.length === 0 ? (
          <Panel className="py-16 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-[var(--color-bg-surface-hover)] rounded-full text-[var(--color-text-muted)] border border-[var(--color-border-strong)]">
                <HistoryIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                No cleaning operations have been executed yet.
              </h3>
              <p className="text-xs font-mono text-[var(--color-text-secondary)] max-w-md">
                Operations executed in the Cleaning Center will be logged chronologically here.
              </p>
              <button
                onClick={() => navigate('/cleaning')}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-blue)] hover:bg-blue-700 text-white rounded font-medium text-xs font-mono transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Go to Cleaning Center
              </button>
            </div>
          </Panel>
        ) : (
          <Panel title="Analytical Activity Log">
            <div className="space-y-4">
              {history.map((op, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded space-y-3 font-mono"
                >
                  {/* Item Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border border-[var(--color-brand-blue)]/30 rounded text-xs font-bold">
                        #{idx + 1}
                      </span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">
                        {OPERATION_LABELS[op.operation] || op.operation}
                      </span>
                      {op.column_name && (
                        <span className="px-2 py-0.5 bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-strong)] rounded text-xs text-amber-300">
                          Target: {op.column_name}
                        </span>
                      )}
                      {op.method && (
                        <span className="px-2 py-0.5 bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-subtle)] rounded text-xs text-[var(--color-text-secondary)]">
                          Method: {op.method}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      Status: Executed
                    </div>
                  </div>

                  {/* Impact Summary Grid */}
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-2 bg-[var(--color-bg-surface-hover)]/40 rounded border border-[var(--color-border-subtle)]">
                      <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">
                        Rows Affected
                      </span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {op.affected_rows.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 bg-[var(--color-bg-surface-hover)]/40 rounded border border-[var(--color-border-subtle)]">
                      <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">
                        Columns Affected
                      </span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {op.affected_columns.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 bg-[var(--color-bg-surface-hover)]/40 rounded border border-[var(--color-border-subtle)]">
                      <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">
                        Cells Affected
                      </span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {op.affected_cells.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Reason Text */}
                  <div className="text-xs text-[var(--color-text-secondary)] flex items-start gap-2 pt-1">
                    <Database className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                    <span>{op.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </PageContainer>
  );
}
