import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Eye,
  Filter,
  Info,
  Loader2,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import axios from 'axios';

import {
  applyCleaningOperation,
  getCleaningRecommendations,
  previewCleaningOperation,
} from '../api/cleaning';
import { getOverview } from '../api/overview';
import { PageContainer } from '../components/layout/PageContainer';
import { Panel } from '../components/layout/Panel';
import { SectionHeader } from '../components/layout/SectionHeader';
import { useDatasetSession } from '../hooks/useDatasetSession';
import type {
  CleaningOperationType,
  CleaningPreviewResponse,
  CleaningRecommendation,
  CleaningRequest,
  CleaningResponse,
  SeverityLevel,
} from '../types/cleaning';
import type { OverviewResponse } from '../types/overview';

// Helper labels for backend cleaning operations
const OPERATION_LABELS: Record<string, string> = {
  keep_missing: 'Keep Missing Values (No Action)',
  fill_missing_mean: 'Fill Missing with Mean',
  fill_missing_median: 'Fill Missing with Median',
  fill_missing_mode: 'Fill Missing with Mode',
  fill_missing_placeholder: 'Fill Missing with Custom Placeholder',
  drop_column: 'Drop Column',
  drop_duplicates: 'Drop Duplicate Rows',
  drop_empty_columns: 'Drop Empty Columns',
  drop_constant_columns: 'Drop Constant Columns',
  drop_missing_rows: 'Drop Rows with Missing Values',
};

// Helper colors for severity badges
const SEVERITY_STYLES: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
  low: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  moderate: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
  },
  high: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
  },
  very_high: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
  complete: {
    bg: 'bg-rose-600/20',
    text: 'text-rose-300',
    border: 'border-rose-500/40',
  },
};

export default function Cleaning() {
  const { session } = useDatasetSession();
  const navigate = useNavigate();

  // Overview stats state
  const [overview, setOverview] = useState<OverviewResponse | null>(null);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<CleaningRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User selections per recommendation column
  const [userSelections, setUserSelections] = useState<Record<string, CleaningOperationType>>({});
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});

  // Execution & Preview states
  const [executingCol, setExecutingCol] = useState<string | null>(null);
  const [executingGlobal, setExecutingGlobal] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<CleaningResponse | null>(null);

  // Preview Modal state
  const [previewData, setPreviewData] = useState<CleaningPreviewResponse | null>(null);
  const [pendingRequest, setPendingRequest] = useState<CleaningRequest | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  // Fetch cleaning recommendations & overview
  const fetchData = useCallback(async () => {
    if (!session?.datasetId) return;

    setLoading(true);
    setError(null);

    try {
      const [overviewRes, recsRes] = await Promise.all([
        getOverview(session.datasetId),
        getCleaningRecommendations(session.datasetId),
      ]);

      setOverview(overviewRes);
      setRecommendations(recsRes.recommendations);

      const initialSelections: Record<string, CleaningOperationType> = {};
      recsRes.recommendations.forEach((rec: CleaningRecommendation) => {
        const initialOp = (rec.suggested_operation as CleaningOperationType) || 'keep_missing';
        initialSelections[rec.column] = initialOp;
      });
      setUserSelections(initialSelections);
    } catch (err: unknown) {
      let msg = 'Failed to load dataset cleaning recommendations.';
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
    fetchData();
  }, [fetchData]);

  // Request Preview from Backend
  const handlePreviewOperation = async (req: CleaningRequest) => {
    if (!session?.datasetId) return;

    if (req.operation === 'keep_missing') return;

    if (req.operation === 'fill_missing_placeholder' && (!req.value || !req.value.trim())) {
      alert('Please enter a valid placeholder value.');
      return;
    }

    setPreviewLoading(true);
    try {
      const previewRes = await previewCleaningOperation(session.datasetId, req);
      setPreviewData(previewRes);
      setPendingRequest(req);
    } catch (err: unknown) {
      let msg = 'Failed to preview cleaning operation.';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`Preview Error: ${msg}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Execute Pending Previewed Request
  const handleExecutePendingPreview = async () => {
    if (!session?.datasetId || !pendingRequest) return;

    setExecutingCol(pendingRequest.column_name || 'global');
    setPreviewData(null);

    try {
      const res = await applyCleaningOperation(session.datasetId, pendingRequest);
      setLastResponse(res);
      await fetchData();
    } catch (err: unknown) {
      let msg = 'Failed to execute cleaning operation.';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`Execution Error: ${msg}`);
    } finally {
      setExecutingCol(null);
      setPendingRequest(null);
    }
  };

  // Direct Execute Column Cleaning
  const handleExecuteColumnCleaning = async (columnName: string) => {
    if (!session?.datasetId) return;

    const selectedOp = userSelections[columnName];
    if (!selectedOp || selectedOp === 'keep_missing') return;

    const placeholderVal = placeholderValues[columnName] || '';
    if (selectedOp === 'fill_missing_placeholder' && !placeholderVal.trim()) {
      alert('Please enter a valid placeholder value.');
      return;
    }

    setExecutingCol(columnName);
    setLastResponse(null);

    try {
      const res = await applyCleaningOperation(session.datasetId, {
        operation: selectedOp,
        column_name: columnName,
        value: selectedOp === 'fill_missing_placeholder' ? placeholderVal : undefined,
      });

      setLastResponse(res);
      await fetchData();
    } catch (err: unknown) {
      let msg = 'Failed to execute cleaning operation.';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`Cleaning Error: ${msg}`);
    } finally {
      setExecutingCol(null);
    }
  };

  // Direct Execute Global Cleaning
  const handleExecuteGlobalCleaning = async (operation: CleaningOperationType) => {
    if (!session?.datasetId) return;

    setExecutingGlobal(operation);
    setLastResponse(null);

    try {
      const res = await applyCleaningOperation(session.datasetId, {
        operation,
      });

      setLastResponse(res);
      await fetchData();
    } catch (err: unknown) {
      let msg = 'Failed to execute dataset cleaning operation.';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`Cleaning Error: ${msg}`);
    } finally {
      setExecutingGlobal(null);
    }
  };

  // 1. No Active Session State
  if (!session?.datasetId) {
    return (
      <PageContainer>
        <SectionHeader
          title="Cleaning Center"
          description="Review evidence-based cleaning recommendations and submit dataset modifications."
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
              A dataset must be uploaded before data quality issues can be diagnosed and cleaned.
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
          title="Cleaning Center"
          description="Analyzing dataset for evidence-based cleaning recommendations..."
        />
        <Panel className="py-16 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              Generating backend cleaning diagnostic analysis...
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
          title="Cleaning Center"
          description="Review evidence-based cleaning recommendations and submit dataset modifications."
        />
        <Panel className="max-w-2xl mx-auto py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[var(--color-brand-red)]/10 rounded-lg text-[var(--color-brand-red)] border border-[var(--color-brand-red)]/20 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                Failed to Load Recommendations
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
      <SectionHeader
        title="Cleaning Center"
        description="Review system evidence, select user actions, preview impact, and execute deterministic cleaning operations."
      />

      {/* Execution Feedback Notification */}
      {lastResponse && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-mono">
            <span className="font-semibold text-emerald-300 block mb-0.5">
              Cleaning Operation Applied Successfully
            </span>
            <p className="text-emerald-200/90 text-xs mb-1">{lastResponse.operation.reason}</p>
            <div className="flex items-center gap-4 text-[11px] text-emerald-300/70">
              <span>Rows remaining: {lastResponse.rows.toLocaleString()}</span>
              <span>Columns remaining: {lastResponse.columns.toLocaleString()}</span>
              <span>
                Affected cells:{' '}
                {(
                  lastResponse.operation.affected_cells ||
                  lastResponse.operation.affected_rows ||
                  lastResponse.operation.affected_columns
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dataset & Session Header */}
      {overview && (
        <Panel title="Active Session & Dataset State">
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
                Dimensions
              </span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {overview.metadata.rows.toLocaleString()} rows × {overview.metadata.columns} cols
              </span>
            </div>
            <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
              <span className="text-[var(--color-text-muted)] block text-[10px] uppercase mb-1">
                Missing Cells
              </span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {overview.metadata.missing_cells.toLocaleString()}
              </span>
            </div>
          </div>
        </Panel>
      )}

      {/* Global Dataset Operations Panel */}
      <div className="mt-6">
        <Panel title="Global Dataset Cleaning Actions">
          <p className="text-xs font-mono text-[var(--color-text-secondary)] mb-4">
            Execute dataset-wide cleaning rules across all rows and columns.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'drop_duplicates', label: 'Drop Duplicates', icon: Filter, color: 'text-[var(--color-brand-blue)]' },
              { id: 'drop_empty_columns', label: 'Drop Empty Cols', icon: Trash2, color: 'text-amber-400' },
              { id: 'drop_constant_columns', label: 'Drop Constant Cols', icon: Database, color: 'text-purple-400' },
              { id: 'drop_missing_rows', label: 'Drop Missing Rows', icon: Trash2, color: 'text-red-400' },
            ].map((glob) => (
              <div
                key={glob.id}
                className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded flex flex-col justify-between gap-3 font-mono"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
                  <glob.icon className={`w-4 h-4 ${glob.color}`} />
                  <span>{glob.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreviewOperation({ operation: glob.id as CleaningOperationType })}
                    disabled={previewLoading || !!executingGlobal}
                    className="flex-1 flex items-center justify-center gap-1 py-1 px-2 bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-strong)] hover:bg-[var(--color-bg-surface)] text-[11px] font-mono text-[var(--color-text-primary)] rounded transition-colors disabled:opacity-50"
                  >
                    <Eye className="w-3 h-3 text-[var(--color-brand-blue)]" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleExecuteGlobalCleaning(glob.id as CleaningOperationType)}
                    disabled={!!executingGlobal}
                    className="flex-1 flex items-center justify-center gap-1 py-1 px-2 bg-[var(--color-brand-blue)] hover:bg-blue-700 text-[11px] font-mono text-white rounded transition-colors disabled:opacity-50"
                  >
                    {executingGlobal === glob.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Execute
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Cleaning Recommendations List */}
      <div className="mt-6 space-y-6">
        {recommendations.length === 0 ? (
          <Panel className="py-12 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                Clean Dataset — No Recommendations
              </h3>
              <p className="text-xs font-mono text-[var(--color-text-secondary)] max-w-md">
                No column missingness issues or cleaning recommendations were detected for this dataset.
              </p>
            </div>
          </Panel>
        ) : (
          recommendations.map((rec) => {
            const colName = rec.column;
            const currentSelection = userSelections[colName] || rec.suggested_operation || 'keep_missing';
            const sevStyle = SEVERITY_STYLES[rec.severity] || SEVERITY_STYLES.low;
            const isExecutingThis = executingCol === colName;

            return (
              <Panel key={colName}>
                <div className="space-y-6">
                  {/* Card Top Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-mono font-bold text-[var(--color-text-primary)]">
                        {rec.column}
                      </h3>
                      <span className="px-2 py-0.5 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] rounded text-[11px] font-mono text-[var(--color-text-secondary)]">
                        {rec.data_type}
                      </span>
                      <span className="px-2 py-0.5 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] rounded text-[11px] font-mono text-[var(--color-text-muted)] uppercase">
                        {rec.issue.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[var(--color-text-muted)]">
                        Severity:
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase border ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border}`}
                      >
                        {rec.severity.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Evidence & Statistics Section */}
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-brand-blue)] flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      EVIDENCE & STATISTICS
                    </span>

                    {/* Progress Bar for Missingness */}
                    <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[var(--color-text-secondary)]">
                          Affected Values: {rec.count.toLocaleString()} rows
                        </span>
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {rec.percentage}% missing
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--color-bg-surface-hover)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${Math.min(rec.percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Statistics Data Grid */}
                    {Object.keys(rec.statistics).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                        {'mean' in rec.statistics && rec.statistics.mean !== undefined && (
                          <div className="p-2.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                            <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">
                              Mean
                            </span>
                            <span className="font-semibold text-[var(--color-text-primary)]">
                              {rec.statistics.mean !== null ? String(rec.statistics.mean) : 'N/A'}
                            </span>
                          </div>
                        )}

                        {'median' in rec.statistics && rec.statistics.median !== undefined && (
                          <div className="p-2.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                            <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">
                              Median
                            </span>
                            <span className="font-semibold text-[var(--color-text-primary)]">
                              {rec.statistics.median !== null ? String(rec.statistics.median) : 'N/A'}
                            </span>
                          </div>
                        )}

                        {'skewness' in rec.statistics && rec.statistics.skewness !== undefined && (
                          <div className="p-2.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                            <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">
                              Skewness
                            </span>
                            <span className="font-semibold text-[var(--color-text-primary)]">
                              {rec.statistics.skewness !== null ? String(rec.statistics.skewness) : 'N/A'}
                            </span>
                          </div>
                        )}

                        {'mode' in rec.statistics && rec.statistics.mode !== undefined && (
                          <div className="p-2.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                            <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">
                              Mode
                            </span>
                            <span className="font-semibold text-[var(--color-text-primary)] truncate block">
                              {rec.statistics.mode !== null ? String(rec.statistics.mode) : 'N/A'}
                            </span>
                          </div>
                        )}

                        {'unique_values' in rec.statistics && (
                          <div className="p-2.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                            <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">
                              Unique Values
                            </span>
                            <span className="font-semibold text-[var(--color-text-primary)]">
                              {String(rec.statistics.unique_values)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reason Text */}
                    <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded text-xs font-mono text-[var(--color-text-secondary)] leading-relaxed">
                      {rec.reason}
                    </div>
                  </div>

                  {/* System Recommendation vs User Selection Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border-subtle)]">
                    {/* System Recommendation Box */}
                    <div className="p-3.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-brand-blue)]">
                        SYSTEM RECOMMENDATION
                      </span>
                      <div className="text-xs font-mono font-semibold text-[var(--color-text-primary)]">
                        {rec.suggested_operation ? (
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                            {OPERATION_LABELS[rec.suggested_operation] || rec.suggested_operation}
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-muted)] italic">
                            No Automatic System Recommendation
                          </span>
                        )}
                      </div>
                    </div>

                    {/* User Selection Box */}
                    <div className="p-3.5 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] rounded space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                        USER SELECTION
                      </span>

                      <select
                        value={currentSelection}
                        onChange={(e) =>
                          setUserSelections((prev) => ({
                            ...prev,
                            [colName]: e.target.value as CleaningOperationType,
                          }))
                        }
                        className="w-full px-3 py-1.5 bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-strong)] rounded text-xs text-[var(--color-text-primary)] font-mono focus:outline-none focus:border-[var(--color-brand-blue)]"
                      >
                        {rec.available_operations.map((op) => (
                          <option key={op} value={op}>
                            {OPERATION_LABELS[op] || op}
                          </option>
                        ))}
                      </select>

                      {/* Custom Placeholder Input if Selected */}
                      {currentSelection === 'fill_missing_placeholder' && (
                        <div className="pt-2">
                          <input
                            type="text"
                            placeholder="Enter placeholder value..."
                            value={placeholderValues[colName] || ''}
                            onChange={(e) =>
                              setPlaceholderValues((prev) => ({
                                ...prev,
                                [colName]: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-1.5 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] rounded text-xs text-[var(--color-text-primary)] font-mono focus:outline-none focus:border-[var(--color-brand-blue)]"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="text-[11px] font-mono text-[var(--color-text-muted)]">
                      {currentSelection === 'keep_missing' ? (
                        <span>Action: Keep missing values unchanged</span>
                      ) : (
                        <span>Selected Action: {OPERATION_LABELS[currentSelection] || currentSelection}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Preview Button */}
                      <button
                        onClick={() =>
                          handlePreviewOperation({
                            operation: currentSelection,
                            column_name: colName,
                            value:
                              currentSelection === 'fill_missing_placeholder'
                                ? placeholderValues[colName] || ''
                                : undefined,
                          })
                        }
                        disabled={currentSelection === 'keep_missing' || previewLoading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-strong)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--color-text-primary)] rounded font-medium text-xs transition-colors font-mono"
                      >
                        <Eye className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                        Preview Impact
                      </button>

                      {/* Execute Button */}
                      <button
                        onClick={() => handleExecuteColumnCleaning(colName)}
                        disabled={currentSelection === 'keep_missing' || isExecutingThis}
                        className="flex items-center gap-1.5 px-5 py-2 bg-[var(--color-brand-blue)] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded font-medium text-xs transition-colors font-mono"
                      >
                        {isExecutingThis ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Executing Cleaning...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            Execute Cleaning Action
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </Panel>
            );
          })
        )}
      </div>

      {/* PREVIEW IMPACT MODAL */}
      {previewData && pendingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-strong)] rounded-lg shadow-2xl overflow-hidden font-mono">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                <Eye className="w-4 h-4 text-[var(--color-brand-blue)]" />
                <span>Cleaning Operation Preview</span>
              </div>
              <button
                onClick={() => {
                  setPreviewData(null);
                  setPendingRequest(null);
                }}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* SAFETY NOTICE BANNER */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-blue-300 block">
                    PREVIEW — Dataset has NOT been modified
                  </span>
                  <span className="text-[11px] text-blue-200/80 block">
                    This simulation calculates expected operational impact without altering stored session data.
                  </span>
                </div>
              </div>

              {/* Operation Details */}
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Operation:</span>
                    <span className="font-semibold text-amber-300">
                      {OPERATION_LABELS[previewData.operation.operation] || previewData.operation.operation}
                    </span>
                  </div>
                  {previewData.operation.column_name && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Target Column:</span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {previewData.operation.column_name}
                      </span>
                    </div>
                  )}
                  {pendingRequest.value && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Placeholder Value:</span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        "{pendingRequest.value}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Dimensions Comparison Grid */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase block mb-1">
                      Rows Impact
                    </span>
                    <div className="text-sm font-bold text-[var(--color-text-primary)]">
                      {previewData.rows_before.toLocaleString()} → {previewData.rows_after.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-[var(--color-text-secondary)]">
                      ({previewData.rows_after - previewData.rows_before} rows)
                    </span>
                  </div>

                  <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase block mb-1">
                      Columns Impact
                    </span>
                    <div className="text-sm font-bold text-[var(--color-text-primary)]">
                      {previewData.columns_before} → {previewData.columns_after}
                    </div>
                    <span className="text-[10px] text-[var(--color-text-secondary)]">
                      ({previewData.columns_after - previewData.columns_before} cols)
                    </span>
                  </div>
                </div>

                {/* Reason Explanation */}
                <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  <span className="text-[var(--color-text-muted)] block text-[10px] uppercase font-bold mb-1">
                    Backend Operational Explanation
                  </span>
                  {previewData.operation.reason}
                </div>
              </div>

              {/* Execution Impact Warning */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-300">
                Proceeding will permanently execute this operation on your active session dataset.
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[var(--color-bg-base)] border-t border-[var(--color-border-subtle)]">
              <button
                onClick={() => {
                  setPreviewData(null);
                  setPendingRequest(null);
                }}
                className="px-4 py-2 bg-[var(--color-bg-surface-hover)] hover:bg-[var(--color-bg-surface)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] rounded text-xs font-mono font-medium transition-colors"
              >
                Cancel / Back
              </button>
              <button
                onClick={handleExecutePendingPreview}
                className="flex items-center gap-1.5 px-5 py-2 bg-[var(--color-brand-blue)] hover:bg-blue-700 text-white rounded text-xs font-mono font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Execute Operation (Modify Dataset)
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
