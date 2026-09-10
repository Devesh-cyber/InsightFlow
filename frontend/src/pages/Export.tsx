import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Topbar } from '../components/layout/Topbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useDataset } from '../context/DatasetContext';
import { exportDataset } from '../lib/api/exportDataset';
import type { ExportFormat } from '../lib/types/export';
import { extractErrorMessage } from '../lib/errors';

const FORMATS: { format: ExportFormat; label: string; description: string; icon: typeof FileText }[] = [
  { format: 'csv', label: 'CSV', description: 'Plain-text, comma-separated. Works everywhere.', icon: FileText },
  { format: 'xlsx', label: 'XLSX', description: 'Excel workbook, preserves types and formatting.', icon: FileSpreadsheet },
];

export default function Export() {
  const { dataset } = useDataset();
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!dataset) return null;

  async function handleExport(format: ExportFormat) {
    if (!dataset) return;
    setBusy(format);
    setError(null);
    try {
      const { blob, filename } = await exportDataset(dataset.datasetId, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(extractErrorMessage(err, 'Export failed. Please try again.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <Topbar title="Export" subtitle={dataset.filename} />

      <div className="mt-6 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {FORMATS.map(({ format, label, description, icon: Icon }) => (
          <Card key={format} className="flex flex-col gap-3">
            <Icon className="h-6 w-6 text-signal" />
            <div>
              <p className="font-medium text-ink">{label}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{description}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => void handleExport(format)}
              isLoading={busy === format}
              className="mt-1"
            >
              <Download className="h-4 w-4" />
              Download .{format}
            </Button>
          </Card>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red">{error}</p>}

      <p className="mt-6 max-w-2xl text-xs text-ink-faint">
        Exports reflect the current state of your dataset in this session, including any cleaning
        operations you've applied.
      </p>
    </AppShell>
  );
}
