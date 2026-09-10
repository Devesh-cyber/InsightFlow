import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useDataset } from '../../context/DatasetContext';

/**
 * Guards analysis pages that need an active dataset. If none is loaded
 * (e.g. deep link after a refresh with nothing uploaded yet, or after the
 * session was cleared), send the user back to Upload instead of showing
 * a broken/empty analysis page.
 */
export function RequiresDataset({ children }: { children: ReactNode }) {
  const { dataset } = useDataset();
  if (!dataset) {
    return <Navigate to="/upload" replace />;
  }
  return <>{children}</>;
}
