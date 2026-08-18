import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({ children, title, className = '' }) => {
  return (
    <div className={`bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]">
          <h3 className="text-sm font-medium text-[var(--color-text-primary)] uppercase tracking-wider font-mono">
            {title}
          </h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};
