import React from 'react';
import { Database } from 'lucide-react';
import { useDatasetSession } from '../hooks/useDatasetSession';

const Topbar: React.FC = () => {
  const { session } = useDatasetSession();

  return (
    <header className="h-14 bg-[var(--color-bg-base)] border-b border-[var(--color-border-strong)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10 flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded text-sm">
          <Database className={`w-4 h-4 ${session ? 'text-[var(--color-brand-blue)]' : 'text-[var(--color-text-muted)]'}`} />
          <span className={`font-mono truncate max-w-[300px] ${session ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
            {session ? session.filename : 'No Dataset Loaded'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
