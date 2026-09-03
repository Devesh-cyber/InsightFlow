import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  LayoutDashboard, 
  Activity, 
  Columns, 
  Network, 
  BarChart2, 
  Wand2, 
  History, 
  Download,
  LogOut
} from 'lucide-react';
import { logoutUser } from '../api/auth';

const navItems = [
  { path: '/upload', label: 'Upload', icon: Upload },
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/health', label: 'Health', icon: Activity },
  { path: '/columns', label: 'Columns', icon: Columns },
  { path: '/relationships', label: 'Relationships', icon: Network },
  { path: '/visualizations', label: 'Visualizations', icon: BarChart2 },
  { path: '/cleaning', label: 'Cleaning', icon: Wand2 },
  { path: '/cleaning/history', label: 'History', icon: History },
  { path: '/export', label: 'Export', icon: Download },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser(); // Clears 'supabase_access_token' from localStorage
    navigate('/login');
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-[var(--color-bg-base)] border-r border-[var(--color-border-strong)] flex flex-col hidden md:flex">
      <div className="h-14 flex items-center px-6 border-b border-[var(--color-border-subtle)]">
        <h1 className="font-sans font-bold text-lg text-[var(--color-text-primary)] tracking-tight">
          Insight<span className="text-[var(--color-brand-blue)]">Flow</span>
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 flex flex-col justify-between">
        <div>
          <div className="px-4 mb-2">
            <p className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-wider">Main</p>
          </div>
          <nav className="flex flex-col gap-1 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-brand-blue)] ${
                    isActive
                      ? 'bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] border-l-2 border-[var(--color-brand-blue)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)] border-l-2 border-transparent'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="font-sans font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sign Out Action at Bottom */}
        <div className="px-3 pt-4 border-t border-[var(--color-border-subtle)]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-red)]/10 hover:text-[var(--color-brand-red)] transition-colors focus:outline-none"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-sans font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;