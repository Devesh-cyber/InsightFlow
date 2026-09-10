import { useEffect, useState } from 'react';
import type { ElementType } from 'react';
import { AlertTriangle, Info, ShieldAlert, Sparkles } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useDataset } from '../context/DatasetContext';
import { getHealth } from '../lib/api/health';
import type { HealthResponse, AlertSeverity } from '../lib/types/health';
import { extractErrorMessage } from '../lib/errors';
import { formatNumber } from '../lib/format';

const qualityTone: Record<string, 'good' | 'warn' | 'bad'> = {
  excellent: 'good',
  good: 'good',
  fair: 'warn',
  poor: 'bad',
};

const severityIcon: Record<AlertSeverity, ElementType> = {
  info: Info,
  warning: AlertTriangle,
  critical: ShieldAlert,
};

const severityTone: Record<AlertSeverity, 'info' | 'warn' | 'bad'> = {
  info: 'info',
  warning: 'warn',
  critical: 'bad',
};

const priorityTone: Record<string, 'default' | 'warn' | 'bad'> = {
  low: 'default',
  medium: 'warn',
  high: 'bad',
};

export default function Health() {
  const { dataset } = useDataset();
  const [data, setData] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!dataset) return;
    setIsLoading(true);
    setError(null);
    getHealth(dataset.datasetId)
      .then(setData)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [dataset?.datasetId]);

  if (!dataset) return null;

  return (
    <AppShell>
      <Topbar title="Dataset health" subtitle={dataset.filename} />

      <div className="mt-6">
        {isLoading && <LoadingState label="Scoring dataset health…" />}
        {!isLoading && error && <ErrorState message={error} onRetry={load} />}
        {!isLoading && !error && data && (
          <div className="flex flex-col gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-soft">Health score</p>
                  <p className="mt-1 font-mono text-3xl font-semibold text-ink">
                    {formatNumber(data.health_score, 0)}
                    <span className="text-base text-ink-faint"> / 100</span>
                  </p>
                </div>
                <Badge tone={qualityTone[data.quality] ?? 'default'}>{data.quality}</Badge>
              </div>
              <div className="mt-4">
                <ProgressBar
                  value={data.health_score}
                  tone={data.health_score >= 80 ? 'signal' : data.health_score >= 50 ? 'amber' : 'red'}
                />
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card>
                <p className="text-xs text-ink-soft">Missing cells</p>
                <p className="mt-1 font-mono text-lg text-ink">{formatNumber(data.issues.missing_cells)}</p>
              </Card>
              <Card>
                <p className="text-xs text-ink-soft">Duplicate rows</p>
                <p className="mt-1 font-mono text-lg text-ink">{formatNumber(data.issues.duplicate_rows)}</p>
              </Card>
              <Card>
                <p className="text-xs text-ink-soft">Empty columns</p>
                <p className="mt-1 font-mono text-lg text-ink">{formatNumber(data.issues.empty_columns)}</p>
              </Card>
              <Card>
                <p className="text-xs text-ink-soft">Constant columns</p>
                <p className="mt-1 font-mono text-lg text-ink">{formatNumber(data.issues.constant_columns)}</p>
              </Card>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-medium text-ink-soft">Alerts</h2>
              {data.alerts.length === 0 ? (
                <p className="text-sm text-ink-faint">No alerts — nothing stands out.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.alerts.map((alert, i) => {
                    const Icon = severityIcon[alert.severity];
                    return (
                      <Card key={i} className="flex items-start gap-3 p-4">
                        <Icon
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            alert.severity === 'critical'
                              ? 'text-red'
                              : alert.severity === 'warning'
                                ? 'text-amber'
                                : 'text-blue'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-ink">{alert.title}</p>
                            <Badge tone={severityTone[alert.severity]}>{alert.severity}</Badge>
                          </div>
                          <p className="mt-0.5 text-sm text-ink-soft">{alert.message}</p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-sm font-medium text-ink-soft">Recommendations</h2>
              {data.recommendations.length === 0 ? (
                <p className="text-sm text-ink-faint">No recommendations right now.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.recommendations.map((rec, i) => (
                    <Card key={i} className="flex items-start gap-3 p-4">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink">{rec.title}</p>
                          <Badge tone={priorityTone[rec.priority] ?? 'default'}>{rec.priority} priority</Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-ink-soft">{rec.action}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
