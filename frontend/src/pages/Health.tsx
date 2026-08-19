import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileX,
  Info,
  Lightbulb,
  Loader2,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import axios from 'axios';

import { getDatasetHealth } from '../api/health';
import { PageContainer } from '../components/layout/PageContainer';
import { Panel } from '../components/layout/Panel';
import { SectionHeader } from '../components/layout/SectionHeader';
import { useDatasetSession } from '../hooks/useDatasetSession';
import type {
  AlertSeverity,
  HealthQuality,
  HealthResponse,
  RecommendationPriority,
} from '../types/health';

export default function Health() {
  const { session } = useDatasetSession();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);

  useEffect(() => {
    if (!session?.datasetId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getDatasetHealth(session.datasetId)
      .then((data) => {
        if (isMounted) {
          setHealthData(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          let errorMessage = 'Failed to load dataset health metrics. Please try again.';
          if (axios.isAxiosError(err)) {
            if (err.response?.status === 404) {
              errorMessage = 'Dataset session was not found or has expired. Please upload the dataset again.';
            } else if (err.response?.data?.message) {
              errorMessage = err.response.data.message;
            } else if (err.response?.data?.detail) {
              errorMessage =
                typeof err.response.data.detail === 'string'
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

  // Utility helpers for visual styling derived directly from backend contract values
  const getQualityBadge = (quality: HealthQuality) => {
    switch (quality) {
      case 'excellent':
        return {
          label: 'Excellent Quality',
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'good':
        return {
          label: 'Good Quality',
          className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        };
      case 'fair':
        return {
          label: 'Fair Quality',
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      case 'poor':
        return {
          label: 'Poor Quality',
          className: 'bg-red-500/10 text-red-400 border-red-500/30',
        };
    }
  };

  const getAlertStyle = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          containerClass: 'bg-red-500/5 border-red-500/20 text-red-300',
          icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
          badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
      case 'warning':
        return {
          containerClass: 'bg-amber-500/5 border-amber-500/20 text-amber-300',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        };
      case 'info':
        return {
          containerClass: 'bg-blue-500/5 border-blue-500/20 text-blue-300',
          icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
          badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        };
    }
  };

  const getPriorityBadge = (priority: RecommendationPriority) => {
    switch (priority) {
      case 'high':
        return {
          label: 'High Priority',
          className: 'bg-red-500/15 text-red-400 border-red-500/30',
        };
      case 'medium':
        return {
          label: 'Medium Priority',
          className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        };
      case 'low':
        return {
          label: 'Low Priority',
          className: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        };
    }
  };

  // State 1: No active session
  if (!session?.datasetId) {
    return (
      <PageContainer>
        <SectionHeader
          title="Dataset Health"
          description="Evaluate data quality, structural integrity, and detected issues."
        />
        <Panel className="max-w-2xl mx-auto py-12 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-[var(--color-bg-surface-hover)] rounded-full text-[var(--color-text-muted)] border border-[var(--color-border-strong)]">
              <Activity className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
              No Active Dataset Session
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
              You must upload a CSV or XLSX dataset before viewing dataset health diagnostics.
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
          title="Dataset Health"
          description="Calculating dataset health indicators..."
        />
        <Panel className="py-16 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              Analyzing dataset quality and integrity...
            </p>
          </div>
        </Panel>
      </PageContainer>
    );
  }

  // State 3: Error
  if (error || !healthData) {
    return (
      <PageContainer>
        <SectionHeader
          title="Dataset Health"
          description="Evaluate data quality, structural integrity, and detected issues."
        />
        <Panel className="max-w-2xl mx-auto py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[var(--color-brand-red)]/10 rounded-lg text-[var(--color-brand-red)] border border-[var(--color-brand-red)]/20 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                Failed to Load Health Report
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-mono mb-6">
                {error || 'An unexpected error occurred.'}
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

  const { health_score, quality, issues, alerts, recommendations } = healthData;
  const qualityBadge = getQualityBadge(quality);

  return (
    <PageContainer>
      <SectionHeader
        title="Dataset Health"
        description={`Active Dataset Session ID: ${session.datasetId}`}
      />

      {/* A. Health Score & Overall Quality Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Panel className="md:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">
                Health Score
              </span>
              <Activity className="w-5 h-5 text-[var(--color-brand-blue)]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold font-mono text-[var(--color-text-primary)] tracking-tight">
                {health_score.toFixed(1)}
              </span>
              <span className="text-xl font-mono text-[var(--color-text-muted)]">/ 100</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-secondary)]">Quality Classification</span>
            <span
              className={`px-2.5 py-1 rounded text-xs font-mono uppercase font-semibold border ${qualityBadge.className}`}
            >
              {qualityBadge.label}
            </span>
          </div>
        </Panel>

        {/* B. Issue Summary (4 Metrics Grid) */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {/* Missing Cells */}
          <Panel className="!p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">
                Missing Cells
              </span>
              <AlertTriangle
                className={`w-4 h-4 ${
                  issues.missing_cells > 0
                    ? 'text-[var(--color-brand-amber)]'
                    : 'text-[var(--color-text-muted)]'
                }`}
              />
            </div>
            <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-3">
              {issues.missing_cells.toLocaleString()}
            </p>
            <span className="text-[11px] text-[var(--color-text-muted)] mt-1 font-mono">
              Unfilled or NaN values
            </span>
          </Panel>

          {/* Duplicate Rows */}
          <Panel className="!p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">
                Duplicate Rows
              </span>
              <Copy
                className={`w-4 h-4 ${
                  issues.duplicate_rows > 0
                    ? 'text-[var(--color-brand-amber)]'
                    : 'text-[var(--color-text-muted)]'
                }`}
              />
            </div>
            <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-3">
              {issues.duplicate_rows.toLocaleString()}
            </p>
            <span className="text-[11px] text-[var(--color-text-muted)] mt-1 font-mono">
              Identical row records
            </span>
          </Panel>

          {/* Empty Columns */}
          <Panel className="!p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">
                Empty Columns
              </span>
              <FileX
                className={`w-4 h-4 ${
                  issues.empty_columns > 0
                    ? 'text-[var(--color-brand-red)]'
                    : 'text-[var(--color-text-muted)]'
                }`}
              />
            </div>
            <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-3">
              {issues.empty_columns.toLocaleString()}
            </p>
            <span className="text-[11px] text-[var(--color-text-muted)] mt-1 font-mono">
              Columns with 100% missing values
            </span>
          </Panel>

          {/* Constant Columns */}
          <Panel className="!p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">
                Constant Columns
              </span>
              <SlidersHorizontal
                className={`w-4 h-4 ${
                  issues.constant_columns > 0
                    ? 'text-blue-400'
                    : 'text-[var(--color-text-muted)]'
                }`}
              />
            </div>
            <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-3">
              {issues.constant_columns.toLocaleString()}
            </p>
            <span className="text-[11px] text-[var(--color-text-muted)] mt-1 font-mono">
              Columns with single unique value
            </span>
          </Panel>
        </div>
      </div>

      {/* C. Alerts Section */}
      <Panel title={`Quality Alerts (${alerts.length})`}>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-3 py-6 px-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-emerald-400">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">
              No quality alerts detected. The dataset structure meets baseline integrity criteria.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, index) => {
              const alertStyle = getAlertStyle(alert.severity);
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3.5 p-4 rounded-lg border ${alertStyle.containerClass} transition-colors`}
                >
                  {alertStyle.icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {alert.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${alertStyle.badgeClass}`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* D. Recommendations Section */}
      <Panel title={`Actionable Recommendations (${recommendations.length})`}>
        {recommendations.length === 0 ? (
          <div className="flex items-center gap-3 py-6 px-4 bg-blue-500/5 border border-blue-500/20 rounded-lg text-blue-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">
              No immediate dataset cleaning or transformation recommendations required.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, index) => {
              const priorityBadge = getPriorityBadge(rec.priority);
              return (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-[var(--color-bg-surface-hover)] border border-[var(--color-border-strong)] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-[var(--color-brand-amber)] shrink-0" />
                      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {rec.title}
                      </h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${priorityBadge.className}`}
                    >
                      {priorityBadge.label}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed pl-6">
                    {rec.action}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </PageContainer>
  );
}
