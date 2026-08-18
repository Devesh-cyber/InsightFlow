import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-strong)] pb-4 mb-2">
      <div>
        <h2 className="text-xl font-sans font-semibold text-[var(--color-text-primary)]">
          {title}
        </h2>
        {description && (
          <p className="text-sm font-sans text-[var(--color-text-secondary)] mt-1">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
