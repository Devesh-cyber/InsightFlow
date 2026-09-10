import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, message, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-line-strong bg-surface py-16 text-center">
      {icon ?? <Inbox className="h-6 w-6 text-ink-faint" />}
      <div>
        <p className="font-medium text-ink">{title}</p>
        {message && <p className="mt-1 max-w-sm text-sm text-ink-soft">{message}</p>}
      </div>
      {action}
    </div>
  );
}
