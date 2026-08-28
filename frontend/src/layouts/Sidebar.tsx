import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
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
  LogOut,
  Loader2,
  AlertCircle
} from 'lucide-react';

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
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      setError(null);
      await signOut();
      navigate('/auth');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to sign out. Please try again.');
      } else {
        setError('Failed to sign out. Please try again.');
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-[var(--color-bg-base)] border-r border-[var(--color-border-strong)] flex flex-col hidden md:flex">
      <div className="h-14 flex items-center px-6 border-b border-[var(--color-border-subtle)]">
        <h1 className="font-sans font-bold text-lg text-[var(--color-text-primary)] tracking-tight">
          Insight<span className="text-[var(--color-brand-blue)]">Flow</span>
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
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

      <div className="p-4 border-t border-[var(--color-border-strong)] bg-[var(--color-bg-base)]">
        <div className="mb-4 px-2">
          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate" title={user?.email || 'Authenticated User'}>
            {user?.email || 'Authenticated User'}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Workspace Member</p>
        </div>
        
        {error && (
          <div className="mb-3 p-2 bg-[var(--color-brand-red)]/10 border border-[var(--color-brand-red)]/20 rounded flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[var(--color-brand-red)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--color-brand-red)] font-medium leading-relaxed">{error}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)] disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-[var(--color-border-subtle)]"
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span className="font-sans font-medium">{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
