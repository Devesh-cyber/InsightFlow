import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
  icon?: ReactNode;
}

const toneClasses: Record<string, string> = {
  default: 'text-ink',
  good: 'text-signal-strong',
  warn: 'text-amber',
  bad: 'text-red',
};

export function StatCard({ label, value, hint, tone = 'default', icon }: StatCardProps) {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-soft">{label}</span>
        {icon}
      </div>
      <p className={`mt-2 font-mono text-2xl font-medium ${toneClasses[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
