import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, File as FileIcon, X, AlertCircle, Loader2 } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { Panel } from '../components/layout/Panel';
import { uploadDataset } from '../api/upload';
import { useDatasetSession } from '../hooks/useDatasetSession';
import axios from 'axios';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setSession } = useDatasetSession();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    const validExtensions = ['.csv', '.xlsx'];
    const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(extension)) {
      setError('Unsupported file type. Only CSV and XLSX files are allowed.');
      return;
    }
    
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File size exceeds the maximum limit of 100 MB.');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const response = await uploadDataset(file);
      
      setSession({
        datasetId: response.dataset_id,
        filename: response.filename,
        rows: response.rows,
        columns: response.columns
      });
      
      navigate('/overview');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        // Handle FastAPI HTTPException structure
        const detail = err.response.data.detail;
        setError(typeof detail === 'string' ? detail : 'Validation failed on the server.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during upload.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PageContainer>
      <SectionHeader 
        title="Upload Dataset" 
        description="Select a CSV or XLSX file to begin a new analytical session. Maximum file size is 100 MB."
      />

      <Panel className="max-w-3xl">
        <div 
          className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-colors ${
            isDragging 
              ? 'border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/5' 
              : 'border-[var(--color-border-strong)] hover:border-[var(--color-text-muted)] bg-[var(--color-bg-surface)]'
          } ${file ? 'hidden' : 'flex'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadIcon className="w-12 h-12 text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Drag and drop your dataset</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 font-mono text-center">
            Supports .csv and .xlsx
          </p>
          
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-[var(--color-bg-surface-hover)] hover:bg-[var(--color-border-strong)] text-[var(--color-text-primary)] rounded font-medium text-sm transition-colors border border-[var(--color-border-strong)]"
          >
            Browse Files
          </button>
        </div>

        {file && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between p-4 bg-[var(--color-bg-surface-hover)] rounded border border-[var(--color-border-strong)]">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="p-2 bg-[var(--color-bg-base)] rounded text-[var(--color-brand-blue)] shrink-0">
                  <FileIcon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs font-mono text-[var(--color-text-secondary)] mt-0.5">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button 
                onClick={clearFile}
                disabled={isUploading}
                className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-base)] rounded shrink-0 transition-colors disabled:opacity-50"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-2 bg-[var(--color-brand-blue)] hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4" />
                    Process Dataset
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-[var(--color-brand-red)]/10 border border-[var(--color-brand-red)]/20 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--color-brand-red)] shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--color-brand-red)]">
              <p className="font-medium mb-1">Upload Failed</p>
              <p className="opacity-90 font-mono text-xs">{error}</p>
            </div>
          </div>
        )}
      </Panel>
    </PageContainer>
  );
}
