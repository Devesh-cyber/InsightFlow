import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Placeholder from './pages/Placeholder';
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
import { DatasetSessionProvider } from './context/DatasetSessionContext';
import { supabase } from './api/client';

function App() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        localStorage.setItem('supabase_access_token', session.access_token);
        localStorage.setItem('supabase_user_email', session.user?.email || '');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        localStorage.setItem('supabase_access_token', session.access_token);
        localStorage.setItem('supabase_user_email', session.user?.email || '');
      } else {
        localStorage.removeItem('supabase_access_token');
        localStorage.removeItem('supabase_user_email');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <DatasetSessionProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes (Rendered outside AppLayout if they don't need the sidebar) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected App Routes wrapped in AppLayout */}
          <Route
            path="/*"
            element={
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/upload" replace />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/overview" element={<Overview />} />
                  <Route path="/health" element={<Health />} />
                  <Route path="/columns" element={<Columns />} />
                  <Route path="/relationships" element={<Relationships />} />
                  <Route path="/visualizations" element={<Visualizations />} />
                  <Route path="/cleaning" element={<Cleaning />} />
                  <Route path="/cleaning/history" element={<CleaningHistory />} />
                  <Route path="/export" element={<Export />} />
                  <Route path="*" element={<Placeholder title="404 - Not Found" />} />
                </Routes>
              </AppLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </DatasetSessionProvider>
  );
}

export default App;