import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, PhoneCall, Users, Settings, BriefcaseBusiness } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout() {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <Home className="w-5 h-5" /> },
    { label: 'AI Calling', path: '/call', icon: <PhoneCall className="w-5 h-5" /> },
    { label: 'Leads', path: '/leads', icon: <Users className="w-5 h-5" /> },
    { label: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <BriefcaseBusiness className="w-7 h-7 text-indigo-400" />
          <h1 className="font-semibold text-lg tracking-tight">Sofian Home Service</h1>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-indigo-600/20 text-indigo-400"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-8 flex items-center border-b border-slate-200 bg-white shadow-sm shrink-0">
          <h2 className="text-sm font-semibold text-slate-800">
             {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
          </h2>
        </header>
        <div className="flex-1 overflow-auto p-8">
            <Outlet />
        </div>
      </main>
    </div>
  );
}
