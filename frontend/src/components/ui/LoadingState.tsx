import { Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-line bg-surface py-16 text-ink-soft">
      <Loader2 className="h-6 w-6 animate-spin text-signal" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
