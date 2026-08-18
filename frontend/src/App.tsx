import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Placeholder from './pages/Placeholder';
import Upload from './pages/Upload';
import { DatasetSessionProvider } from './context/DatasetSessionContext';

function App() {
  return (
    <DatasetSessionProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/upload" replace />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/overview" element={<Placeholder title="Dataset Overview" />} />
            <Route path="/health" element={<Placeholder title="Dataset Health" />} />
            <Route path="/columns" element={<Placeholder title="Column Explorer" />} />
            <Route path="/relationships" element={<Placeholder title="Feature Relationships" />} />
            <Route path="/visualizations" element={<Placeholder title="Visualizations" />} />
            <Route path="/cleaning" element={<Placeholder title="Cleaning" />} />
            <Route path="/cleaning/history" element={<Placeholder title="Cleaning History" />} />
            <Route path="/export" element={<Placeholder title="Export Dataset" />} />
            <Route path="*" element={<Placeholder title="404 - Not Found" />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </DatasetSessionProvider>
  );
}

export default App;
