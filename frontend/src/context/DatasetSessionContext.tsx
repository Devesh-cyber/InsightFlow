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
  const [session, setSessionState] = useState<DatasetSession | null>(() => {
    try {
      const savedSession = localStorage.getItem('insightflow_active_session');
      return savedSession ? JSON.parse(savedSession) : null;
    } catch (e) {
      console.error('Failed to parse active session from localStorage', e);
      return null;
    }
  });

  const setSession = (newSession: DatasetSession | null) => {
    setSessionState(newSession);
    if (newSession) {
      localStorage.setItem('insightflow_active_session', JSON.stringify(newSession));
    } else {
      localStorage.removeItem('insightflow_active_session');
    }
  };

  const clearSession = () => {
    setSessionState(null);
    localStorage.removeItem('insightflow_active_session');
  };

  return (
    <DatasetSessionContext.Provider value={{ session, setSession, clearSession }}>
      {children}
    </DatasetSessionContext.Provider>
  );
};