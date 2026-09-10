import { NavLink } from 'react-router-dom';
import {
  UploadCloud,
  LayoutGrid,
  HeartPulse,
  Columns3,
  GitCompareArrows,
  BarChart3,
  SprayCan,
  History,
  Download,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDataset } from '../../context/DatasetContext';

const navItems = [
  { to: '/upload', label: 'Upload', icon: UploadCloud, requiresDataset: false },
  { to: '/overview', label: 'Overview', icon: LayoutGrid, requiresDataset: true },
  { to: '/health', label: 'Health', icon: HeartPulse, requiresDataset: true },
  { to: '/columns', label: 'Columns', icon: Columns3, requiresDataset: true },
  { to: '/relationships', label: 'Relationships', icon: GitCompareArrows, requiresDataset: true },
  { to: '/visualizations', label: 'Visualizations', icon: BarChart3, requiresDataset: true },
  { to: '/cleaning', label: 'Cleaning', icon: SprayCan, requiresDataset: true },
  { to: '/cleaning/history', label: 'Cleaning history', icon: History, requiresDataset: true },
  { to: '/export', label: 'Export', icon: Download, requiresDataset: true },
];

export function Sidebar() {
  const { userEmail, logout } = useAuth();
  const { dataset } = useDataset();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="border-b border-line px-5 py-5">
        <p className="text-lg font-semibold tracking-tight text-ink">InsightFlow</p>
        <p className="mt-0.5 text-xs text-ink-faint">Evidence-first data analysis</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ to, label, icon: Icon, requiresDataset }) => {
            const disabled = requiresDataset && !dataset;
            if (disabled) {
              return (
                <li key={to}>
                  <span className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-faint">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                </li>
              );
            }
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-signal-soft font-medium text-signal-strong'
                        : 'text-ink-soft hover:bg-surface-sunken hover:text-ink'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line px-4 py-4">
        {dataset && (
          <div className="mb-3 rounded-md bg-surface-sunken px-3 py-2">
            <p className="truncate text-xs font-medium text-ink" title={dataset.filename}>
              {dataset.filename}
            </p>
            <p className="mt-0.5 font-mono text-xs text-ink-faint">
              {dataset.rows.toLocaleString()} rows · {dataset.columns} cols
            </p>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-ink-soft" title={userEmail ?? undefined}>
            {userEmail}
          </p>
          <button
            onClick={() => void logout()}
            aria-label="Sign out"
            className="shrink-0 rounded-md p-1.5 text-ink-faint hover:bg-surface-sunken hover:text-ink cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
