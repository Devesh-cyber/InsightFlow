import { useCallback, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileSpreadsheet, X } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Topbar } from '../components/layout/Topbar';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useDataset } from '../context/DatasetContext';
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES, uploadDataset } from '../lib/api/upload';
import { extractErrorMessage } from '../lib/errors';
import { formatBytes } from '../lib/format';

function isAllowedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setDataset } = useDataset();
  const navigate = useNavigate();

  const validateAndSetFile = useCallback((candidate: File) => {
    setError(null);
    if (!isAllowedFile(candidate)) {
      setError('Only .csv and .xlsx files are supported.');
      return;
    }
    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      setError('That file is larger than the 100 MB limit.');
      return;
    }
    if (candidate.size === 0) {
      setError('That file is empty.');
      return;
    }
    setFile(candidate);
  }, []);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  }

  async function handleUpload() {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setProgress(0);
    try {
      const res = await uploadDataset(file, setProgress);
      setDataset({
        datasetId: res.dataset_id,
        filename: res.filename,
        rows: res.rows,
        columns: res.columns,
      });
      navigate('/overview');
    } catch (err) {
      setError(extractErrorMessage(err, 'Upload failed. Please try again.'));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <AppShell>
      <Topbar title="Upload a dataset" subtitle="CSV or XLSX, up to 100 MB." />

      <div className="mt-6 max-w-2xl">
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-6 py-16 text-center transition-colors ${
              isDragging ? 'border-signal bg-signal-soft' : 'border-line-strong bg-surface hover:bg-surface-sunken'
            }`}
          >
            <UploadCloud className="h-8 w-8 text-signal" />
            <div>
              <p className="font-medium text-ink">Drag and drop a file here</p>
              <p className="mt-1 text-sm text-ink-soft">or click to browse — .csv, .xlsx</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) validateAndSetFile(selected);
              }}
            />
          </div>
        ) : (
          <div className="rounded-md border border-line bg-surface p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-signal" />
                <div>
                  <p className="font-medium text-ink">{file.name}</p>
                  <p className="text-xs text-ink-faint">{formatBytes(file.size / (1024 * 1024))}</p>
                </div>
              </div>
              {!isUploading && (
                <button
                  onClick={() => setFile(null)}
                  aria-label="Remove file"
                  className="rounded-md p-1.5 text-ink-faint hover:bg-surface-sunken hover:text-ink cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {isUploading && (
              <div className="mt-4">
                <ProgressBar value={progress} />
                <p className="mt-1 text-xs text-ink-soft">
                  {progress < 100 ? `Uploading… ${progress}%` : 'Processing dataset…'}
                </p>
              </div>
            )}

            <Button className="mt-5 w-full" onClick={() => void handleUpload()} isLoading={isUploading}>
              {isUploading ? 'Uploading' : 'Upload and analyze'}
            </Button>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red">{error}</p>}
      </div>
    </AppShell>
  );
}
