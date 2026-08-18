import { useContext } from 'react';
import { DatasetSessionContext } from '../context/DatasetSessionContext';

export const useDatasetSession = () => {
  const context = useContext(DatasetSessionContext);
  if (context === undefined) {
    throw new Error('useDatasetSession must be used within a DatasetSessionProvider');
  }
  return context;
};
