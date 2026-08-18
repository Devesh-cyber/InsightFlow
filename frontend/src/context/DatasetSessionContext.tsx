/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, type ReactNode } from 'react';

export interface DatasetSession {
  datasetId: string;
  filename: string;
  rows: number;
  columns: number;
}

export interface DatasetSessionContextType {
  session: DatasetSession | null;
  setSession: (session: DatasetSession | null) => void;
  clearSession: () => void;
}

export const DatasetSessionContext = createContext<DatasetSessionContextType | undefined>(undefined);

export const DatasetSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<DatasetSession | null>(null);

  const clearSession = () => setSession(null);

  return (
    <DatasetSessionContext.Provider value={{ session, setSession, clearSession }}>
      {children}
    </DatasetSessionContext.Provider>
  );
};
