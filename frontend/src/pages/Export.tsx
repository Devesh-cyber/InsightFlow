import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react';
import axios from 'axios';

import { exportDataset } from '../api/export';
import { getOverview } from '../api/overview';
import { PageContainer } from '../components/layout/PageContainer';
import { Panel } from '../components/layout/Panel';
import { SectionHeader } from '../components/layout/SectionHeader';
import { useDatasetSession } from '../hooks/useDatasetSession';
import type { ExportFormat } from '../types/export';
import type { OverviewResponse } from '../types/overview';

export default function Export() {
  const { session } = useDatasetSession();
  const navigate = useNavigate();

  // Overview stats state
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Export controls state
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ filename: string; format: ExportFormat } | null>(
    null
  );

  const fetchOverviewData = useCallback(async () => {
    if (!session?.datasetId) return;

    setLoadingOverview(true);
    setOverviewError(null);

    try {
      const res = await getOverview(session.datasetId);
      setOverview(res);
    } catch (err: unknown) {
      let msg = 'Failed to fetch active dataset session information.';
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          msg = 'Dataset session was not found or has expired. Please upload the dataset again.';
        } else if (err.response?.data?.message) {
          msg = err.response.data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setOverviewError(msg);
    } finally {
      setLoadingOverview(false);
    }
  }, [session?.datasetId]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Handle Export Action
  const handleExport = async () => {
    if (!session?.datasetId) return;

    setExporting(true);
    setExportError(null);
    setSuccessInfo(null);

    try {
      const fallbackName = overview?.metadata.dataset_name
        ? overview.metadata.dataset_name.split('.')[0]
        : 'dataset';

      const result = await exportDataset(session.datasetId, selectedFormat, fallbackName);

      setSuccessInfo({
        filename: result.filename,
        format: selectedFormat,
      });
    } catch (err: unknown) {
      let msg = 'Failed to export dataset.';
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          msg = 'Dataset session not found on server.';
        } else if (err.response?.status === 400) {
          msg = 'Invalid export request or unsupported format.';
        } else if (err.response?.data?.message) {
          msg = err.response.data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setExportError(msg);
    } finally {
      setExporting(false);
    }
  };

  // 1. No Active Dataset Session
  if (!session?.datasetId) {
    return (
      <PageContainer>
        <SectionHeader
          title="Export Dataset"
          description="Download your cleaned and processed dataset in your preferred format."
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
              A dataset must be uploaded before an export file can be generated.
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

  // 2. Overview Loading State
  if (loadingOverview && !overview) {
    return (
      <PageContainer>
        <SectionHeader
          title="Export Dataset"
          description="Fetching dataset session information..."
        />
        <Panel className="py-16 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
            <p className="text-sm font-medium text-[var(--color-text-secondary)] font-mono">
              Loading active dataset state...
            </p>
          </div>
        </Panel>
      </PageContainer>
    );
  }

  // 3. Overview Error State
  if (overviewError && !overview) {
    return (
      <PageContainer>
        <SectionHeader
          title="Export Dataset"
          description="Download your cleaned and processed dataset in your preferred format."
        />
        <Panel className="max-w-2xl mx-auto py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[var(--color-brand-red)]/10 rounded-lg text-[var(--color-brand-red)] border border-[var(--color-brand-red)]/20 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                Failed to Access Dataset
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-mono mb-6">
                {overviewError}
              </p>
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
        title="Export Dataset"
        description="Download your active session dataset directly in CSV or Excel format."
      />

      {/* Success Notification Banner */}
      {successInfo && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-mono">
            <span className="font-semibold text-emerald-300 block mb-0.5">
              Export Ready — File Downloaded
            </span>
            <p className="text-emerald-200/90 text-xs">
              Successfully generated and downloaded{' '}
              <span className="font-bold text-white">"{successInfo.filename}"</span> in{' '}
              <span className="uppercase text-emerald-300 font-bold">{successInfo.format}</span>{' '}
              format.
            </p>
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {exportError && (
        <div className="mb-6 p-4 bg-[var(--color-brand-red)]/10 border border-[var(--color-brand-red)]/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--color-brand-red)] shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-mono">
            <span className="font-semibold text-[var(--color-brand-red)] block mb-0.5">
              Export Failed
            </span>
            <p className="text-[var(--color-text-secondary)] text-xs">{exportError}</p>
          </div>
        </div>
      )}

      {/* Active Dataset Information Panel */}
      {overview && (
        <Panel title="Active Dataset Session State">
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
                Completeness Score
              </span>
              <span className="font-semibold text-emerald-400">
                {overview.completeness_percentage}%
              </span>
            </div>
          </div>
        </Panel>
      )}

      {/* Export Format Selection & Action Panel */}
      <div className="mt-6">
        <Panel title="Select Export Format">
          <div className="space-y-6">
            <p className="text-xs font-mono text-[var(--color-text-secondary)]">
              Choose the target file format for exporting your active dataset session.
            </p>

            {/* Format Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CSV Option */}
              <div
                onClick={() => setSelectedFormat('csv')}
                className={`p-5 rounded border cursor-pointer transition-all font-mono flex items-start gap-4 ${
                  selectedFormat === 'csv'
                    ? 'bg-[var(--color-bg-surface-hover)] border-[var(--color-brand-blue)] ring-1 ring-[var(--color-brand-blue)]'
                    : 'bg-[var(--color-bg-base)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                <div
                  className={`p-3 rounded-lg ${
                    selectedFormat === 'csv'
                      ? 'bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)]'
                      : 'bg-[var(--color-bg-surface-hover)] text-[var(--color-text-muted)]'
                  }`}
                >
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[var(--color-text-primary)]">
                      CSV (.csv)
                    </span>
                    {selectedFormat === 'csv' && (
                      <span className="px-2 py-0.5 bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/30 rounded text-[10px] text-[var(--color-brand-blue)] uppercase font-semibold">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Standard comma-separated text file compatible with all data tools, Python, R, and databases.
                  </p>
                </div>
              </div>

              {/* XLSX Option */}
              <div
                onClick={() => setSelectedFormat('xlsx')}
                className={`p-5 rounded border cursor-pointer transition-all font-mono flex items-start gap-4 ${
                  selectedFormat === 'xlsx'
                    ? 'bg-[var(--color-bg-surface-hover)] border-[var(--color-brand-blue)] ring-1 ring-[var(--color-brand-blue)]'
                    : 'bg-[var(--color-bg-base)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                <div
                  className={`p-3 rounded-lg ${
                    selectedFormat === 'xlsx'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-[var(--color-bg-surface-hover)] text-[var(--color-text-muted)]'
                  }`}
                >
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[var(--color-text-primary)]">
                      Excel WorkBook (.xlsx)
                    </span>
                    {selectedFormat === 'xlsx' && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[10px] text-emerald-400 uppercase font-semibold">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Microsoft Excel Spreadsheet binary format preserving data types and column structures.
                  </p>
                </div>
              </div>
            </div>

            {/* Export Action Button Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
              <div className="text-xs font-mono text-[var(--color-text-muted)]">
                Selected Format:{' '}
                <span className="text-[var(--color-text-primary)] font-bold uppercase">
                  {selectedFormat}
                </span>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-brand-blue)] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium text-xs font-mono transition-colors"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Export...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export Dataset
                  </>
                )}
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </PageContainer>
  );
}
