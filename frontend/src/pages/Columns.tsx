import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Columns as ColumnsIcon,
  Hash,
  HelpCircle,
  Info,
  Loader2,
  Tag,
  ToggleLeft,
  Upload,
} from 'lucide-react';
import axios from 'axios';

import { getColumnAnalysis, getColumnSummaries } from '../api/column';
import { PageContainer } from '../components/layout/PageContainer';
import { Panel } from '../components/layout/Panel';
import { SectionHeader } from '../components/layout/SectionHeader';
import { useDatasetSession } from '../hooks/useDatasetSession';
import type {
  ColumnAnalysis,
  ColumnSummary,
  ColumnType,
} from '../types/column';

export default function Columns() {
  const { session } = useDatasetSession();
  const navigate = useNavigate();

  // Diagnosis state (all column summaries)
  const [summaries, setSummaries] = useState<ColumnSummary[] | null>(null);
  const [loadingSummaries, setLoadingSummaries] = useState<boolean>(true);
  const [summariesError, setSummariesError] = useState<string | null>(null);

  // Selected column state
  const [selectedColumnName, setSelectedColumnName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ColumnAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Fetch column diagnosis when session changes
  useEffect(() => {
    if (!session?.datasetId) {
      setLoadingSummaries(false);
      return;
    }

    let isMounted = true;
    setLoadingSummaries(true);
    setSummariesError(null);

    getColumnSummaries(session.datasetId)
      .then((data) => {
        if (isMounted) {
          setSummaries(data);
          setLoadingSummaries(false);
          // Auto-select first column if available
          if (data.length > 0) {
            setSelectedColumnName(data[0].column_name);
          }
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          let errorMessage = 'Failed to load column summaries. Please try again.';
          if (axios.isAxiosError(err)) {
            if (err.response?.status === 404) {
              errorMessage = 'Dataset session was not found or has expired. Please upload the dataset again.';
            } else if (err.response?.data?.message) {
              errorMessage = err.response.data.message;
            }
          } else if (err instanceof Error) {
            errorMessage = err.message;
          }
          setSummariesError(errorMessage);
          setLoadingSummaries(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session?.datasetId]);

  // Fetch detailed column analysis when selected column changes
  useEffect(() => {
    if (!session?.datasetId || !selectedColumnName) {
      setAnalysis(null);
      return;
    }

    let isMounted = true;
    setLoadingAnalysis(true);
    setAnalysisError(null);

    getColumnAnalysis(session.datasetId, selectedColumnName)
      .then((data) => {
        if (isMounted) {
          setAnalysis(data);
          setLoadingAnalysis(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          let errorMessage = `Failed to load analysis for column "${selectedColumnName}".`;
          if (axios.isAxiosError(err)) {
            if (err.response?.status === 404) {
              errorMessage = 'Dataset session was not found or has expired. Please upload the dataset again.';
            } else if (err.response?.status === 400) {
              errorMessage = err.response.data?.message || `Column "${selectedColumnName}" does not exist in the dataset.`;
            } else if (err.response?.data?.message) {
              errorMessage = err.response.data.message;
            }
          } else if (err instanceof Error) {
            errorMessage = err.message;
          }
          setAnalysisError(errorMessage);
          setLoadingAnalysis(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session?.datasetId, selectedColumnName]);

  // Helper for detected type badges
  const getTypeBadge = (type: ColumnType) => {
    switch (type) {
      case 'numeric':
        return {
          icon: <Hash className="w-3 h-3 shrink-0" />,
          label: 'numeric',
          className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        };
      case 'categorical':
        return {
          icon: <Tag className="w-3 h-3 shrink-0" />,
          label: 'categorical',
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'boolean':
        return {
          icon: <ToggleLeft className="w-3 h-3 shrink-0" />,
          label: 'boolean',
          className: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        };
      case 'datetime':
        return {
          icon: <Calendar className="w-3 h-3 shrink-0" />,
          label: 'datetime',
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      case 'unknown':
      default:
        return {
          icon: <HelpCircle className="w-3 h-3 shrink-0" />,
          label: 'unknown',
          className: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        };
    }
  };

  // Format statistic helper
  const formatStat = (val: number | null) => {
    if (val === null || val === undefined || Number.isNaN(val)) {
      return '—';
    }
    if (Number.isInteger(val)) {
      return val.toLocaleString();
    }
    return val.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  // Render sample value helper
  const renderSampleValue = (val: unknown) => {
    if (val === null || val === undefined) {
      return <span className="text-[var(--color-text-muted)] italic font-mono text-xs">null</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
          {val ? 'true' : 'false'}
        </span>
      );
    }
    if (typeof val === 'object') {
      return <span className="font-mono text-xs text-[var(--color-text-secondary)]">{JSON.stringify(val)}</span>;
    }
    return <span className="font-mono text-xs text-[var(--color-text-primary)]">{String(val)}</span>;
  };

  // State 1: No active dataset session
  if (!session?.datasetId) {
    return (
      <PageContainer>
        <SectionHeader
          title="Column Explorer"
          description="Inspect dataset column structures, data types, missingness, and statistical properties."
        />
        <Panel className="max-w-2xl mx-auto py-12 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-[var(--color-bg-surface-hover)] rounded-full text-[var(--color-text-muted)] border border-[var(--color-border-strong)]">
              <ColumnsIcon className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
              No Active Dataset Session
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
              You must upload a CSV or XLSX dataset before exploring column structures and statistics.
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

  // State 2: Loading column summaries
  if (loadingSummaries) {
    return (
      <PageContainer>
        <SectionHeader
          title="Column Explorer"
          description="Fetching column diagnosis and structural statistics..."
        />
        <Panel className="py-16 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              Loading column summaries...
            </p>
          </div>
        </Panel>
      </PageContainer>
    );
  }

  // State 3: Summary fetch error
  if (summariesError || !summaries) {
    return (
      <PageContainer>
        <SectionHeader
          title="Column Explorer"
          description="Inspect dataset column structures, data types, missingness, and statistical properties."
        />
        <Panel className="max-w-2xl mx-auto py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[var(--color-brand-red)]/10 rounded-lg text-[var(--color-brand-red)] border border-[var(--color-brand-red)]/20 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                Failed to Load Column Summaries
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-mono mb-6">
                {summariesError || 'An unexpected error occurred.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/upload')}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-blue)] hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload New Dataset
                </button>
              </div>
            </div>
          </div>
        </Panel>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        title="Column Explorer"
        description={`Showing ${summaries.length} columns in dataset session ${session.datasetId}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Summary Table / List (7 cols on large screens) */}
        <div className="lg:col-span-7 space-y-4">
          <Panel title={`Column Diagnosis (${summaries.length})`}>
            <div className="overflow-x-auto border border-[var(--color-border-subtle)] rounded">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-bg-surface-hover)] border-b border-[var(--color-border-strong)]">
                    <th className="px-3.5 py-2.5 text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Column
                    </th>
                    <th className="px-3.5 py-2.5 text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3.5 py-2.5 text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Dtype
                    </th>
                    <th className="px-3.5 py-2.5 text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider text-right">
                      Missing
                    </th>
                    <th className="px-3.5 py-2.5 text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider text-right">
                      Unique
                    </th>
                    <th className="px-2 py-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-bg-base)]">
                  {summaries.map((col) => {
                    const isSelected = col.column_name === selectedColumnName;
                    const typeBadge = getTypeBadge(col.detected_type);

                    return (
                      <tr
                        key={col.column_name}
                        onClick={() => setSelectedColumnName(col.column_name)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[var(--color-bg-surface-hover)] border-l-2 border-l-[var(--color-brand-blue)]'
                            : 'hover:bg-[var(--color-bg-surface)]/60'
                        }`}
                      >
                        <td className="px-3.5 py-2.5 text-xs font-mono font-semibold text-[var(--color-text-primary)] max-w-[140px] truncate">
                          {col.column_name}
                        </td>
                        <td className="px-3.5 py-2.5 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${typeBadge.className}`}
                          >
                            {typeBadge.icon}
                            <span>{typeBadge.label}</span>
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-xs font-mono text-[var(--color-text-muted)]">
                          {col.pandas_dtype}
                        </td>
                        <td className="px-3.5 py-2.5 text-xs font-mono text-right">
                          <span
                            className={
                              col.missing_count > 0
                                ? 'text-[var(--color-brand-amber)] font-medium'
                                : 'text-[var(--color-text-secondary)]'
                            }
                          >
                            {col.missing_count.toLocaleString()}{' '}
                            <span className="text-[10px] text-[var(--color-text-muted)]">
                              ({col.missing_percentage.toFixed(1)}%)
                            </span>
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-xs font-mono text-[var(--color-text-primary)] text-right">
                          {col.unique_count.toLocaleString()}
                        </td>
                        <td className="px-2 py-2.5 text-center text-[var(--color-text-muted)]">
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isSelected ? 'text-[var(--color-brand-blue)] translate-x-0.5' : 'opacity-40'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* Right Column: Selected Column Analysis Details (5 cols on large screens) */}
        <div className="lg:col-span-5 space-y-4">
          {!selectedColumnName ? (
            <Panel className="py-12 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                Select a column from the list to view detailed analysis.
              </p>
            </Panel>
          ) : loadingAnalysis ? (
            <Panel title={`Analysis: ${selectedColumnName}`} className="py-12 text-center">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-[var(--color-brand-blue)] animate-spin" />
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                  Loading analysis for "{selectedColumnName}"...
                </p>
              </div>
            </Panel>
          ) : analysisError ? (
            <Panel title={`Analysis: ${selectedColumnName}`}>
              <div className="p-4 bg-[var(--color-brand-red)]/10 border border-[var(--color-brand-red)]/20 rounded-lg text-xs font-mono text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{analysisError}</span>
              </div>
            </Panel>
          ) : analysis ? (
            <>
              {/* Selected Column Identity & Quality */}
              <Panel
                title={`Column Detail: ${analysis.summary.column_name}`}
              >
                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--color-border-subtle)]">
                  <span className="text-xs font-mono text-[var(--color-text-secondary)]">Detected Type</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-semibold border ${
                      getTypeBadge(analysis.summary.detected_type).className
                    }`}
                  >
                    {getTypeBadge(analysis.summary.detected_type).icon}
                    <span>{analysis.summary.detected_type}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                      Pandas Dtype
                    </span>
                    <span className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                      {analysis.summary.pandas_dtype}
                    </span>
                  </div>

                  <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                      Unique Count
                    </span>
                    <span className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                      {analysis.summary.unique_count.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                      Missing Count
                    </span>
                    <span className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                      {analysis.summary.missing_count.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                      Missing %
                    </span>
                    <span className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                      {analysis.summary.missing_percentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </Panel>

              {/* Numeric Statistics Section */}
              <Panel
                title="Numeric Statistics"
              >
                {analysis.statistics === null ? (
                  <div className="flex items-center gap-2 py-4 px-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded text-xs text-[var(--color-text-muted)]">
                    <Info className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" />
                    <span>Numeric statistics are not available for this column.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                      <span className="text-[10px] uppercase text-[var(--color-text-secondary)] block mb-1">
                        Minimum
                      </span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">
                        {formatStat(analysis.statistics.minimum)}
                      </span>
                    </div>

                    <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                      <span className="text-[10px] uppercase text-[var(--color-text-secondary)] block mb-1">
                        Maximum
                      </span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">
                        {formatStat(analysis.statistics.maximum)}
                      </span>
                    </div>

                    <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                      <span className="text-[10px] uppercase text-[var(--color-text-secondary)] block mb-1">
                        Mean
                      </span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">
                        {formatStat(analysis.statistics.mean)}
                      </span>
                    </div>

                    <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                      <span className="text-[10px] uppercase text-[var(--color-text-secondary)] block mb-1">
                        Median
                      </span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">
                        {formatStat(analysis.statistics.median)}
                      </span>
                    </div>

                    <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                      <span className="text-[10px] uppercase text-[var(--color-text-secondary)] block mb-1">
                        Std Deviation
                      </span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">
                        {formatStat(analysis.statistics.standard_deviation)}
                      </span>
                    </div>

                    <div className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                      <span className="text-[10px] uppercase text-[var(--color-text-secondary)] block mb-1">
                        Skewness
                      </span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">
                        {formatStat(analysis.statistics.skewness)}
                      </span>
                    </div>
                  </div>
                )}
              </Panel>

              {/* Sample Values Section */}
              <Panel title={`Sample Non-Missing Values (${analysis.sample_values.length})`}>
                {analysis.sample_values.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)] font-mono py-2">
                    No non-missing sample values available for this column.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                    {analysis.sample_values.map((val, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded text-xs"
                      >
                        {renderSampleValue(val)}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
