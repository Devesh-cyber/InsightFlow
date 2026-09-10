import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Couldn't load this", message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-line bg-surface py-16 text-center">
      <AlertTriangle className="h-6 w-6 text-red" />
      <div>
        <p className="font-medium text-ink">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-ink-soft">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
