import { createContext, useContext, useState, type ReactNode } from 'react';

interface ActiveDataset {
  datasetId: string;
  filename: string;
  rows: number;
  columns: number;
}

interface DatasetContextValue {
  dataset: ActiveDataset | null;
  setDataset: (dataset: ActiveDataset) => void;
  clearDataset: () => void;
}

const DatasetContext = createContext<DatasetContextValue | undefined>(undefined);

const STORAGE_KEY = 'insightflow_active_dataset';

function readStored(): ActiveDataset | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActiveDataset) : null;
  } catch {
    return null;
  }
}

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [dataset, setDatasetState] = useState<ActiveDataset | null>(readStored);

  const setDataset = (next: ActiveDataset) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setDatasetState(next);
  };

  const clearDataset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDatasetState(null);
  };

  return (
    <DatasetContext.Provider value={{ dataset, setDataset, clearDataset }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset(): DatasetContextValue {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error('useDataset must be used within a DatasetProvider');
  return ctx;
}
