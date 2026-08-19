import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Placeholder from './pages/Placeholder';
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

function App() {
  return (
    <DatasetSessionProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </DatasetSessionProvider>
  );
}

export default App;
