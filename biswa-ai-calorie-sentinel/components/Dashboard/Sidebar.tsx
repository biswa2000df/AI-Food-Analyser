import React, { useState } from 'react';
import { User, ScanLine, History, LogOut, ChevronRight, ChevronLeft, Hexagon, LayoutDashboard } from 'lucide-react';
import { ViewState } from '../../types';

interface SidebarProps {
  user: { username: string } | null;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, currentView, setView, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col border-r border-gray-800 bg-[#05070a] h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-40 shadow-[5px_0_30px_rgba(0,0,0,0.5)]
        ${isCollapsed ? 'w-[88px]' : 'w-[280px]'}`}
      >
        {/* Toggle Button - Slim Design */}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-12 bg-[#0f131a] border border-gray-700 text-gray-400 hover:text-ai-cyan rounded-full p-1 transition-all duration-300 z-50 shadow-lg hover:scale-110 group"
            aria-label="Toggle Sidebar"
        >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo / Profile Section */}
        <div className={`h-24 border-b border-gray-800 flex items-center overflow-hidden transition-all duration-500 relative ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
            <div className="flex items-center gap-4 relative z-10">
                <div className="relative w-10 h-10 flex-shrink-0 cursor-pointer group" onClick={() => setIsCollapsed(!isCollapsed)}>
                    <div className="absolute inset-0 bg-ai-cyan rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                    <div className="relative w-10 h-10 bg-gray-900 border border-ai-cyan/50 rounded-lg flex items-center justify-center overflow-hidden">
                        {/* Continuous Spin Animation */}
                        <Hexagon size={24} className="text-ai-cyan animate-spin-slow" />
                    </div>
                </div>

                <div className={`transition-all duration-300 flex flex-col justify-center ${isCollapsed ? 'opacity-0 w-0 translate-x-[-20px]' : 'opacity-100 w-auto translate-x-0'}`}>
                    <h2 className="text-lg font-oswald font-bold tracking-widest text-white whitespace-nowrap">
                        BISWA <span className="text-ai-cyan">AI</span>
                    </h2>
                    <span className="text-[10px] text-gray-500 font-mono">Calorie Sentinel</span>
                </div>
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-3 mt-4 overflow-y-auto custom-scrollbar">
          <NavButton 
            active={currentView === 'home'} 
            collapsed={isCollapsed}
            onClick={() => setView('home')}
            icon={<ScanLine size={24} />}
            label="Smart Scanner"
            subLabel="Analyze Food"
          />
          <NavButton 
            active={currentView === 'history'} 
            collapsed={isCollapsed}
            onClick={() => setView('history')}
            icon={<History size={24} />}
            label="History Logs"
            subLabel="Past Scans"
          />
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800 bg-gradient-to-t from-red-900/5 to-transparent">
          <button 
            onClick={onLogout}
            className={`w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 transition-all duration-300 flex items-center gap-3 group overflow-hidden relative
            ${isCollapsed ? 'justify-center' : 'px-4'}`}
            title="Logout"
          >
            <div className="relative z-10 flex items-center gap-3">
                <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                <span className={`font-bold text-sm tracking-wider font-oswald whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    Logout
                </span>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-[#0f131a]/95 backdrop-blur-xl border border-gray-700 rounded-2xl flex justify-around p-2 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <MobileNavBtn active={currentView === 'home'} onClick={() => setView('home')} icon={<ScanLine size={20} />} label="Scan" />
        <MobileNavBtn active={currentView === 'history'} onClick={() => setView('history')} icon={<History size={20} />} label="History" />
        <MobileNavBtn active={false} onClick={onLogout} icon={<LogOut size={20} />} label="Exit" isDanger />
      </div>
    </>
  );
};

const NavButton = ({ active, collapsed, onClick, icon, label, subLabel }: any) => (
  <button 
    onClick={onClick}
    className={`relative w-full rounded-xl flex items-center transition-all duration-300 group overflow-hidden
      ${collapsed ? 'h-14 justify-center' : 'h-16 px-4 gap-4'}
      ${active 
        ? 'bg-ai-cyan/10 text-ai-cyan border border-ai-cyan/30 shadow-[0_0_15px_rgba(0,234,223,0.1)]' 
        : 'text-gray-500 hover:bg-white/5 hover:text-gray-200 hover:border-gray-700 border border-transparent'}
    `}
  >
    <span className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
    </span>
    
    <div className={`flex flex-col items-start transition-all duration-300 ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
        <span className="font-bold font-oswald tracking-wider text-sm">
            {label}
        </span>
        <span className="text-[10px] text-gray-500 font-mono">
            {subLabel}
        </span>
    </div>
    
    {/* Active Indicator Bar */}
    {active && !collapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-ai-cyan rounded-r-full shadow-[0_0_10px_#00EADF]"></div>
    )}

    {/* Tooltip for collapsed state */}
    {collapsed && (
        <div className="absolute left-[80px] bg-[#1a1f29] text-white px-4 py-2 rounded-lg border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl translate-x-2 group-hover:translate-x-0 duration-300 flex flex-col items-start">
            <span className="font-bold text-xs font-oswald">{label}</span>
        </div>
    )}
  </button>
);

const MobileNavBtn = ({ active, onClick, icon, label, isDanger }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-200 ${active ? 'bg-white/5' : ''}`}
  >
    <div className={`${active ? 'text-ai-cyan scale-110' : isDanger ? 'text-red-400' : 'text-gray-500'} transition-transform duration-200 mb-1`}>
        {icon}
    </div>
    <span className={`text-[9px] font-bold font-mono tracking-wider ${active ? 'text-ai-cyan' : isDanger ? 'text-red-400' : 'text-gray-600'}`}>
        {label}
    </span>
  </button>
);