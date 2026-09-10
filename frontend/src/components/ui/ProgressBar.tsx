export function ProgressBar({ value, tone = 'signal' }: { value: number; tone?: 'signal' | 'amber' | 'red' }) {
  const barColor = tone === 'amber' ? 'bg-amber' : tone === 'red' ? 'bg-red' : 'bg-signal';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
      <div
        className={`h-full rounded-full ${barColor} transition-all`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
