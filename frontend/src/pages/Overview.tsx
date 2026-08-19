import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  Layers, 
  HardDrive, 
  AlertTriangle, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Upload, 
  Loader2, 
  AlertCircle,
  Table as TableIcon,
  Tag
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { Panel } from '../components/layout/Panel';
import { useDatasetSession } from '../hooks/useDatasetSession';
import { getOverview } from '../api/overview';
import type { OverviewResponse } from '../types/overview';
import axios from 'axios';

export default function Overview() {
  const { session } = useDatasetSession();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewResponse | null>(null);

  useEffect(() => {
    if (!session?.datasetId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getOverview(session.datasetId)
      .then((data) => {
        if (isMounted) {
          setOverviewData(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          let errorMessage = 'Failed to load dataset overview. Please try again.';
          if (axios.isAxiosError(err)) {
            if (err.response?.status === 404) {
              errorMessage = 'Dataset session was not found or has expired. Please upload the dataset again.';
            } else if (err.response?.data?.message) {
              errorMessage = err.response.data.message;
            } else if (err.response?.data?.detail) {
              errorMessage = typeof err.response.data.detail === 'string'
                ? err.response.data.detail
                : 'Server validation error.';
            }
          } else if (err instanceof Error) {
            errorMessage = err.message;
          }
          setError(errorMessage);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session?.datasetId]);

  const columnHeaders = useMemo(() => {
    if (!overviewData?.preview || overviewData.preview.length === 0) return [];
    const headersSet = new Set<string>();
    overviewData.preview.forEach((row) => {
      Object.keys(row).forEach((key) => headersSet.add(key));
    });
    return Array.from(headersSet);
  }, [overviewData?.preview]);

  const renderCellValue = (value: unknown) => {
    if (value === null || value === undefined) {
      return <span className="text-[var(--color-text-muted)] italic font-mono text-xs">null</span>;
    }
    if (typeof value === 'boolean') {
      return (
        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
          {value ? 'true' : 'false'}
        </span>
      );
    }
    if (typeof value === 'object') {
      return <span className="font-mono text-xs text-[var(--color-text-secondary)]">{JSON.stringify(value)}</span>;
    }
    return <span className="font-mono text-xs text-[var(--color-text-primary)]">{String(value)}</span>;
  };

  // State 1: No active session
  if (!session?.datasetId) {
    return (
      <PageContainer>
        <SectionHeader 
          title="Dataset Overview" 
          description="View metadata, metrics, and data preview for the active dataset."
        />
        <Panel className="max-w-2xl mx-auto py-12 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-[var(--color-bg-surface-hover)] rounded-full text-[var(--color-text-muted)] border border-[var(--color-border-strong)]">
              <Database className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No Active Dataset Session</h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
              You must upload a CSV or XLSX dataset before viewing the dataset overview.
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

  // State 2: Loading
  if (loading) {
    return (
      <PageContainer>
        <SectionHeader 
          title="Dataset Overview" 
          description="Fetching dataset statistics..."
        />
        <Panel className="py-16 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Loading dataset overview...</p>
          </div>
        </Panel>
      </PageContainer>
    );
  }

  // State 3: Error
  if (error || !overviewData) {
    return (
      <PageContainer>
        <SectionHeader 
          title="Dataset Overview" 
          description="View metadata, metrics, and data preview for the active dataset."
        />
        <Panel className="max-w-2xl mx-auto py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[var(--color-brand-red)]/10 rounded-lg text-[var(--color-brand-red)] border border-[var(--color-brand-red)]/20 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">Failed to Load Overview</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-mono mb-6">{error || 'An unexpected error occurred.'}</p>
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

  const { metadata, completeness_percentage, preview } = overviewData;

  const formattedDate = new Date(metadata.created_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });

  return (
    <PageContainer>
      <SectionHeader 
        title="Dataset Overview" 
        description={`Filename: ${metadata.dataset_name}`}
        action={
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-surface-hover)] px-3 py-1.5 rounded border border-[var(--color-border-strong)]">
            <Clock className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
            <span>Uploaded: {formattedDate}</span>
          </div>
        }
      />

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Rows */}
        <Panel className="!p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">Rows</span>
            <Database className="w-4 h-4 text-[var(--color-brand-blue)]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-2">
            {metadata.rows.toLocaleString()}
          </p>
        </Panel>

        {/* Columns */}
        <Panel className="!p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">Columns</span>
            <Layers className="w-4 h-4 text-[var(--color-brand-blue)]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-2">
            {metadata.columns.toLocaleString()}
          </p>
        </Panel>

        {/* Memory Usage */}
        <Panel className="!p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">Memory</span>
            <HardDrive className="w-4 h-4 text-[var(--color-brand-blue)]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-2">
            {metadata.memory_usage.toFixed(2)} <span className="text-sm font-normal text-[var(--color-text-muted)]">MB</span>
          </p>
        </Panel>

        {/* Missing Cells */}
        <Panel className="!p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">Missing Cells</span>
            <AlertTriangle className={`w-4 h-4 ${metadata.missing_cells > 0 ? 'text-[var(--color-brand-amber)]' : 'text-[var(--color-text-muted)]'}`} />
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-2">
            {metadata.missing_cells.toLocaleString()}
          </p>
        </Panel>

        {/* Duplicate Rows */}
        <Panel className="!p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">Duplicates</span>
            <Copy className={`w-4 h-4 ${metadata.duplicate_rows > 0 ? 'text-[var(--color-brand-amber)]' : 'text-[var(--color-text-muted)]'}`} />
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-2">
            {metadata.duplicate_rows.toLocaleString()}
          </p>
        </Panel>

        {/* Completeness */}
        <Panel className="!p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">Completeness</span>
            <CheckCircle2 className={`w-4 h-4 ${completeness_percentage >= 90 ? 'text-[var(--color-brand-green)]' : 'text-[var(--color-brand-amber)]'}`} />
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-2">
            {completeness_percentage.toFixed(2)}<span className="text-sm font-normal text-[var(--color-text-muted)]">%</span>
          </p>
        </Panel>
      </div>

      {/* Metadata & Structure */}
      <Panel title="Column Types Distribution">
        <div className="flex flex-wrap gap-3">
          {Object.keys(metadata.column_types || {}).length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No column type breakdown available.</p>
          ) : (
            Object.entries(metadata.column_types).map(([dtype, count]) => (
              <div 
                key={dtype} 
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-surface)] rounded border border-[var(--color-border-strong)] text-sm font-mono"
              >
                <Tag className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                <span className="text-[var(--color-text-primary)] font-medium">{dtype}</span>
                <span className="text-[var(--color-text-muted)]">({count} {count === 1 ? 'column' : 'columns'})</span>
              </div>
            ))
          )}
        </div>
      </Panel>

      {/* Dataset Preview */}
      <Panel 
        title={`Dataset Preview (${preview.length} ${preview.length === 1 ? 'row' : 'rows'})`}
      >
        {columnHeaders.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--color-text-muted)] font-mono">
            No dataset rows available to preview.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[var(--color-border-subtle)] rounded">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg-surface-hover)] border-b border-[var(--color-border-strong)]">
                  <th className="px-4 py-3 text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider w-12 text-center border-r border-[var(--color-border-subtle)]">
                    #
                  </th>
                  {columnHeaders.map((col) => (
                    <th 
                      key={col} 
                      className="px-4 py-3 text-xs font-mono font-medium text-[var(--color-text-primary)] whitespace-nowrap border-r border-[var(--color-border-subtle)] last:border-r-0"
                    >
                      <div className="flex items-center gap-1.5">
                        <TableIcon className="w-3 h-3 text-[var(--color-brand-blue)]" />
                        <span>{col}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-bg-base)]">
                {preview.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    className="hover:bg-[var(--color-bg-surface)]/50 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-xs font-mono text-[var(--color-text-muted)] text-center bg-[var(--color-bg-surface)]/30 border-r border-[var(--color-border-subtle)] select-none">
                      {rowIndex + 1}
                    </td>
                    {columnHeaders.map((col) => (
                      <td 
                        key={col} 
                        className="px-4 py-2.5 text-xs whitespace-nowrap border-r border-[var(--color-border-subtle)] last:border-r-0 max-w-xs truncate"
                      >
                        {renderCellValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </PageContainer>
  );
}
