import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeftRight,
  GitCompare,
  Loader2,
  Table,
  Upload,
} from 'lucide-react';
import axios from 'axios';

import { getRelationship, getRelationshipColumns } from '../api/relationship';
import { PageContainer } from '../components/layout/PageContainer';
import { Panel } from '../components/layout/Panel';
import { SectionHeader } from '../components/layout/SectionHeader';
import { useDatasetSession } from '../hooks/useDatasetSession';
import type { ColumnSummary } from '../types/column';
import type { RelationshipResult } from '../types/relationship';

export default function Relationships() {
  const { session } = useDatasetSession();
  const navigate = useNavigate();

  // Column selectors state
  const [columns, setColumns] = useState<ColumnSummary[] | null>(null);
  const [loadingColumns, setLoadingColumns] = useState<boolean>(true);
  const [columnsError, setColumnsError] = useState<string | null>(null);

  const [selectedColumnA, setSelectedColumnA] = useState<string>('');
  const [selectedColumnB, setSelectedColumnB] = useState<string>('');

  // Relationship analysis state
  const [result, setResult] = useState<RelationshipResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Load available columns on session change
  useEffect(() => {
    if (!session?.datasetId) {
      setLoadingColumns(false);
      return;
    }

    let isMounted = true;
    setLoadingColumns(true);
    setColumnsError(null);

    getRelationshipColumns(session.datasetId)
      .then((data) => {
        if (isMounted) {
          setColumns(data);
          setLoadingColumns(false);
          // Set default selections if dataset has >= 2 columns
          if (data.length >= 2) {
            setSelectedColumnA(data[0].column_name);
            setSelectedColumnB(data[1].column_name);
          } else if (data.length === 1) {
            setSelectedColumnA(data[0].column_name);
          }
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          let msg = 'Failed to load dataset columns.';
          if (axios.isAxiosError(err)) {
            if (err.response?.status === 404) {
              msg = 'Dataset session was not found or has expired. Please upload the dataset again.';
            } else if (err.response?.data?.message) {
              msg = err.response.data.message;
            }
          } else if (err instanceof Error) {
            msg = err.message;
          }
          setColumnsError(msg);
          setLoadingColumns(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session?.datasetId]);

  // Handle relationship analysis execution
  const handleAnalyze = () => {
    if (!session?.datasetId || !selectedColumnA || !selectedColumnB) return;

    setLoadingAnalysis(true);
    setAnalysisError(null);
    setResult(null);

    getRelationship(session.datasetId, selectedColumnA, selectedColumnB)
      .then((data) => {
        setResult(data);
        setLoadingAnalysis(false);
      })
      .catch((err: unknown) => {
        let msg = 'Failed to perform relationship analysis.';
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            msg = 'Dataset session was not found or has expired. Please upload the dataset again.';
          } else if (err.response?.data?.message) {
            msg = err.response.data.message;
          }
        } else if (err instanceof Error) {
          msg = err.message;
        }
        setAnalysisError(msg);
        setLoadingAnalysis(false);
      });
  };

  // Helper formatting for analysis type title
  const formatAnalysisType = (type: string) => {
    switch (type) {
      case 'numeric_numeric':
        return 'Numeric ↔ Numeric (Pearson Correlation)';
      case 'categorical_categorical':
        return "Categorical ↔ Categorical (Cramer's V Association)";
      case 'numeric_categorical':
        return 'Numeric ↔ Categorical (Correlation Ratio / Eta η)';
      default:
        return type;
    }
  };

  // 1. No Active Session State
  if (!session?.datasetId) {
    return (
      <PageContainer>
        <SectionHeader
          title="Relationship Explorer"
          description="Analyze correlations and associations between dataset columns."
        />
        <Panel className="max-w-2xl mx-auto py-12 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-[var(--color-bg-surface-hover)] rounded-full text-[var(--color-text-muted)] border border-[var(--color-border-strong)]">
              <GitCompare className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
              No Active Dataset Session
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
              A dataset must be uploaded before relationships can be analyzed.
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

  // 2. Loading Columns State
  if (loadingColumns) {
    return (
      <PageContainer>
        <SectionHeader
          title="Relationship Explorer"
          description="Loading dataset columns for relationship analysis..."
        />
        <Panel className="py-16 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              Loading available columns...
            </p>
          </div>
        </Panel>
      </PageContainer>
    );
  }

  // 3. Failed Columns Request State
  if (columnsError || !columns) {
    return (
      <PageContainer>
        <SectionHeader
          title="Relationship Explorer"
          description="Analyze correlations and associations between dataset columns."
        />
        <Panel className="max-w-2xl mx-auto py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[var(--color-brand-red)]/10 rounded-lg text-[var(--color-brand-red)] border border-[var(--color-brand-red)]/20 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                Failed to Load Columns
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-mono mb-6">
                {columnsError || 'An unexpected error occurred.'}
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
        title="Relationship Explorer"
        description="Select two columns to inspect their relationship, strength, and association."
      />

      {/* Column Selectors Panel */}
      <Panel title="Select Columns to Analyze">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Column A Dropdown */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
              Column A
            </label>
            <select
              value={selectedColumnA}
              onChange={(e) => setSelectedColumnA(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] rounded text-sm text-[var(--color-text-primary)] font-mono focus:outline-none focus:border-[var(--color-brand-blue)]"
            >
              <option value="" disabled>
                Select Column A
              </option>
              {columns.map((col) => (
                <option
                  key={col.column_name}
                  value={col.column_name}
                  disabled={col.column_name === selectedColumnB}
                >
                  {col.column_name} ({col.detected_type})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Icon / Separator */}
          <div className="md:col-span-2 flex justify-center py-2 md:py-0">
            <div className="p-2 bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-subtle)] rounded-full text-[var(--color-text-muted)]">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>

          {/* Column B Dropdown */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
              Column B
            </label>
            <select
              value={selectedColumnB}
              onChange={(e) => setSelectedColumnB(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] rounded text-sm text-[var(--color-text-primary)] font-mono focus:outline-none focus:border-[var(--color-brand-blue)]"
            >
              <option value="" disabled>
                Select Column B
              </option>
              {columns.map((col) => (
                <option
                  key={col.column_name}
                  value={col.column_name}
                  disabled={col.column_name === selectedColumnA}
                >
                  {col.column_name} ({col.detected_type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={
              !selectedColumnA ||
              !selectedColumnB ||
              selectedColumnA === selectedColumnB ||
              loadingAnalysis
            }
            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-brand-blue)] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium text-sm transition-colors"
          >
            {loadingAnalysis ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                Analyze Relationship
              </>
            )}
          </button>
        </div>
      </Panel>

      {/* Results Section */}
      <div className="mt-6">
        {loadingAnalysis ? (
          <Panel className="py-16 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
              <p className="text-sm font-medium text-[var(--color-text-secondary)] font-mono">
                Computing relationship between "{selectedColumnA}" and "{selectedColumnB}"...
              </p>
            </div>
          </Panel>
        ) : analysisError ? (
          <Panel title="Relationship Analysis Error">
            <div className="p-4 bg-[var(--color-brand-red)]/10 border border-[var(--color-brand-red)]/20 rounded-lg text-sm font-mono text-red-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1">Analysis Failed</span>
                <span>{analysisError}</span>
              </div>
            </div>
          </Panel>
        ) : !result ? (
          <Panel className="py-12 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <Table className="w-8 h-8 text-[var(--color-text-muted)]" />
              <p className="text-sm font-mono text-[var(--color-text-secondary)]">
                Select two columns above and click "Analyze Relationship".
              </p>
            </div>
          </Panel>
        ) : (
          <div className="space-y-6">
            {/* Primary Analysis Summary Panel */}
            <Panel title={`Analysis Result: ${result.column_a} ↔ ${result.column_b}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                    Column A
                  </span>
                  <span className="text-sm font-mono font-bold text-[var(--color-text-primary)] block truncate">
                    {result.column_a}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                    Type: {result.column_a_type}
                  </span>
                </div>

                <div className="p-3.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                    Column B
                  </span>
                  <span className="text-sm font-mono font-bold text-[var(--color-text-primary)] block truncate">
                    {result.column_b}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                    Type: {result.column_b_type}
                  </span>
                </div>

                <div className="p-3.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                    Sample Size
                  </span>
                  <span className="text-sm font-mono font-bold text-[var(--color-text-primary)] block">
                    {result.sample_size.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                    valid rows
                  </span>
                </div>

                <div className="p-3.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                    Strength
                  </span>
                  <span className="text-sm font-mono font-bold text-[var(--color-brand-blue)] capitalize block">
                    {result.strength ? result.strength : '—'}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                    {result.direction ? `Direction: ${result.direction}` : 'Direction: —'}
                  </span>
                </div>
              </div>

              {/* Specific Metric Breakdown */}
              <div className="p-4 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded space-y-3">
                <div className="text-xs font-mono font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  {formatAnalysisType(result.analysis_type)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  {result.analysis_type === 'numeric_numeric' && (
                    <>
                      <div>
                        <span className="text-[var(--color-text-secondary)] block mb-0.5">Correlation Coefficient</span>
                        <span className="text-lg font-bold text-[var(--color-text-primary)]">
                          {result.correlation !== null ? result.correlation.toFixed(4) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-secondary)] block mb-0.5">Direction</span>
                        <span className="text-sm font-semibold capitalize text-[var(--color-text-primary)]">
                          {result.direction ? result.direction : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-secondary)] block mb-0.5">Strength</span>
                        <span className="text-sm font-semibold capitalize text-[var(--color-text-primary)]">
                          {result.strength ? result.strength : '—'}
                        </span>
                      </div>
                    </>
                  )}

                  {result.analysis_type === 'categorical_categorical' && (
                    <>
                      <div>
                        <span className="text-[var(--color-text-secondary)] block mb-0.5">Cramer's V Association</span>
                        <span className="text-lg font-bold text-[var(--color-text-primary)]">
                          {result.association !== null ? result.association.toFixed(4) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-secondary)] block mb-0.5">Direction</span>
                        <span className="text-sm font-semibold text-[var(--color-text-muted)]">
                          — (N/A for categorical)
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-secondary)] block mb-0.5">Strength</span>
                        <span className="text-sm font-semibold capitalize text-[var(--color-text-primary)]">
                          {result.strength ? result.strength : '—'}
                        </span>
                      </div>
                    </>
                  )}

                  {result.analysis_type === 'numeric_categorical' && (
                    <>
                      <div>
                        <span className="text-[var(--color-text-secondary)] block mb-0.5">Eta (η) Association</span>
                        <span className="text-lg font-bold text-[var(--color-text-primary)]">
                          {result.association !== null ? result.association.toFixed(4) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-secondary)] block mb-0.5">Direction</span>
                        <span className="text-sm font-semibold text-[var(--color-text-muted)]">
                          — (N/A for non-linear)
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-secondary)] block mb-0.5">Strength</span>
                        <span className="text-sm font-semibold capitalize text-[var(--color-text-primary)]">
                          {result.strength ? result.strength : '—'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Panel>

            {/* Detailed Result Breakdown Object */}
            {/* 1. Categorical ↔ Categorical Contingency Table */}
            {result.analysis_type === 'categorical_categorical' && Boolean(result.result?.contingency_table) && (
              <Panel title="Contingency Table (Frequency Distribution)">
                <div className="overflow-x-auto border border-[var(--color-border-subtle)] rounded">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-[var(--color-bg-surface-hover)] border-b border-[var(--color-border-strong)]">
                        <th className="px-3.5 py-2.5 font-medium text-[var(--color-text-secondary)]">
                          {result.column_a} \ {result.column_b}
                        </th>
                        {Object.keys(
                          Object.values(
                            result.result.contingency_table as Record<string, Record<string, number>>
                          )[0] || {}
                        ).map((colHeader) => (
                          <th
                            key={colHeader}
                            className="px-3.5 py-2.5 font-medium text-[var(--color-text-secondary)] text-right"
                          >
                            {colHeader}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-bg-base)]">
                      {Object.entries(
                        result.result.contingency_table as Record<string, Record<string, number>>
                      ).map(([rowKey, rowData]) => (
                        <tr key={rowKey} className="hover:bg-[var(--color-bg-surface-hover)]/40">
                          <td className="px-3.5 py-2.5 font-semibold text-[var(--color-text-primary)]">
                            {rowKey}
                          </td>
                          {Object.values(rowData).map((val, idx) => (
                            <td key={idx} className="px-3.5 py-2.5 text-right text-[var(--color-text-primary)]">
                              {typeof val === 'number' ? val.toLocaleString() : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {/* 2. Numeric ↔ Categorical Grouped Statistics Table */}
            {result.analysis_type === 'numeric_categorical' && Boolean(result.result?.grouped_statistics) && (
              <Panel title="Grouped Numeric Statistics by Category">
                <div className="overflow-x-auto border border-[var(--color-border-subtle)] rounded">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-[var(--color-bg-surface-hover)] border-b border-[var(--color-border-strong)]">
                        <th className="px-3.5 py-2.5 font-medium text-[var(--color-text-secondary)]">
                          Category
                        </th>
                        <th className="px-3.5 py-2.5 font-medium text-[var(--color-text-secondary)] text-right">
                          Count
                        </th>
                        <th className="px-3.5 py-2.5 font-medium text-[var(--color-text-secondary)] text-right">
                          Mean
                        </th>
                        <th className="px-3.5 py-2.5 font-medium text-[var(--color-text-secondary)] text-right">
                          Median
                        </th>
                        <th className="px-3.5 py-2.5 font-medium text-[var(--color-text-secondary)] text-right">
                          Minimum
                        </th>
                        <th className="px-3.5 py-2.5 font-medium text-[var(--color-text-secondary)] text-right">
                          Maximum
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-bg-base)]">
                      {Object.entries(
                        result.result.grouped_statistics as Record<
                          string,
                          { count?: number; mean?: number; median?: number; minimum?: number; maximum?: number }
                        >
                      ).map(([catKey, stats]) => (
                        <tr key={catKey} className="hover:bg-[var(--color-bg-surface-hover)]/40">
                          <td className="px-3.5 py-2.5 font-semibold text-[var(--color-text-primary)]">
                            {catKey}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-[var(--color-text-primary)]">
                            {stats.count !== undefined ? stats.count.toLocaleString() : '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-[var(--color-text-primary)] font-bold">
                            {stats.mean !== undefined ? stats.mean.toLocaleString() : '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-[var(--color-text-primary)]">
                            {stats.median !== undefined ? stats.median.toLocaleString() : '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-[var(--color-text-secondary)]">
                            {stats.minimum !== undefined ? stats.minimum.toLocaleString() : '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-[var(--color-text-secondary)]">
                            {stats.maximum !== undefined ? stats.maximum.toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
