import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DatasetProvider, useDataset } from './context/DatasetContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { RequiresDataset } from './components/layout/RequiresDataset';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Overview from './pages/Overview';
import Health from './pages/Health';
import Columns from './pages/Columns';
import Relationships from './pages/Relationships';
import Visualizations from './pages/Visualizations';
import Cleaning from './pages/Cleaning';
import CleaningHistory from './pages/CleaningHistory';
import Export from './pages/Export';

function IndexRedirect() {
  const { dataset } = useDataset();
  return <Navigate to={dataset ? '/overview' : '/upload'} replace />;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DatasetProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<IndexRedirect />} />
              <Route path="/upload" element={<Upload />} />
              <Route
                path="/overview"
                element={
                  <RequiresDataset>
                    <Overview />
                  </RequiresDataset>
                }
              />
              <Route
                path="/health"
                element={
                  <RequiresDataset>
                    <Health />
                  </RequiresDataset>
                }
              />
              <Route
                path="/columns"
                element={
                  <RequiresDataset>
                    <Columns />
                  </RequiresDataset>
                }
              />
              <Route
                path="/relationships"
                element={
                  <RequiresDataset>
                    <Relationships />
                  </RequiresDataset>
                }
              />
              <Route
                path="/visualizations"
                element={
                  <RequiresDataset>
                    <Visualizations />
                  </RequiresDataset>
                }
              />
              <Route
                path="/cleaning"
                element={
                  <RequiresDataset>
                    <Cleaning />
                  </RequiresDataset>
                }
              />
              <Route
                path="/cleaning/history"
                element={
                  <RequiresDataset>
                    <CleaningHistory />
                  </RequiresDataset>
                }
              />
              <Route
                path="/export"
                element={
                  <RequiresDataset>
                    <Export />
                  </RequiresDataset>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DatasetProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
