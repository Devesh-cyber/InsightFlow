import React from 'react';
import { useLocation } from 'react-router-dom';

interface PlaceholderProps {
  title: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded shadow-sm p-12 text-center max-w-2xl w-full">
        <h1 className="text-3xl font-sans mb-4 font-semibold">{title}</h1>
        <div className="bg-[#0f172a] p-4 rounded text-left border border-[var(--color-border-strong)] mt-8">
          <p className="font-mono text-[var(--color-text-secondary)] text-sm mb-2">
            ROUTE: {location.pathname}
          </p>
          <p className="font-mono text-[var(--color-text-secondary)] text-sm">
            STATUS: <span className="text-[var(--color-brand-amber)]">Placeholder Active</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Placeholder;
