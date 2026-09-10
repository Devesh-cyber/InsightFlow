import type { ReactNode } from 'react';

interface BadgeProps {
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'info';
  children: ReactNode;
}

const toneClasses: Record<string, string> = {
  default: 'bg-surface-sunken text-ink-soft',
  good: 'bg-signal-soft text-signal-strong',
  warn: 'bg-amber-soft text-amber',
  bad: 'bg-red-soft text-red',
  info: 'bg-blue-soft text-blue',
};

export function Badge({ tone = 'default', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
