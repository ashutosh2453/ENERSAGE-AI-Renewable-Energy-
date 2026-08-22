import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, TrendingUp, Zap, Bell, 
  Bot, Sliders, Upload, LogOut, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { alertsAPI } from '../../services/api';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { projects, currentProject, setCurrentProject } = useProject();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (currentProject) {
      alertsAPI.getAlerts(currentProject)
        .then(res => {
          const data = res.data;
          const count = Array.isArray(data) ? data.length : (data?.length || 0);
          setAlertCount(count);
        })
        .catch(err => console.error(err));
    }
  }, [currentProject]);


  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/forecast', icon: TrendingUp, label: 'Forecast' },
    { to: '/energy-flow', icon: Zap, label: 'Energy Flow' },
    { to: '/alerts', icon: Bell, label: 'Alerts', badge: alertCount },
    { to: '/copilot', icon: Bot, label: 'AI Copilot' },
    { to: '/simulator', icon: Sliders, label: 'Simulator' },
    { to: '/upload', icon: Upload, label: 'Upload Data' },
  ];

  return (
    <div className="flex h-screen bg-bg-space overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 glass border-y-0 border-l-0 rounded-none flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-energy-cyan/20 border border-energy-cyan flex items-center justify-center glow-cyan">
            <Zap size={18} className="text-energy-cyan" />
          </div>
          <span className="font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-energy-cyan to-blue-400">
            ENER SAGE AI
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-energy-cyan/10 text-energy-cyan border border-energy-cyan/30 glow-cyan'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-auto bg-energy-red/20 text-energy-red text-xs px-2 py-0.5 rounded-full border border-energy-red/50">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Topbar */}
        <header className="h-14 glass border-x-0 border-t-0 rounded-none flex items-center justify-between px-6 z-20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">PROJECT</span>
            {projects.length === 0 ? (
              <span className="text-slate-600 text-sm italic">No projects — launch demo first</span>
            ) : (
              <select
                value={currentProject || ''}
                onChange={(e) => setCurrentProject(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-energy-cyan/50 cursor-pointer"
              >
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-300 hidden sm:block">{user?.name}</div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>


        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
