import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth/Auth';
import { Sidebar } from './components/Dashboard/Sidebar';
import { Scanner } from './components/Dashboard/Scanner';
import { History } from './components/Dashboard/History';
import { User, ViewState } from './types';
import { apiService } from './services/api';
import { Modal } from './components/UI/Modal';
import { FullScreenLoader } from './components/UI/Loader';
import { AlertTriangle, Power, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('home');
  const [initializing, setInitializing] = useState(true);
  
  // Logout States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('biswa_user');
    if (stored) {
        try {
            setUser(JSON.parse(stored));
        } catch (e) {
            localStorage.removeItem('biswa_user');
        }
    }
    setInitializing(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('biswa_user', JSON.stringify(userData));
    setView('home');
  };

  const initiateLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);

    const minWait = new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
        if (user) {
            await Promise.all([
                apiService.logout({ UserName: user.username, MobileNumber: user.mobileNumber }), 
                minWait
            ]);
        } else {
            await minWait;
        }
    } catch (e) {
        console.error("Logout warning", e);
    } finally {
        setUser(null);
        setView('home');
        localStorage.removeItem('biswa_user');
        setIsLoggingOut(false);
    }
  };

  if (initializing) return null;

  if (isLoggingOut) {
      return <FullScreenLoader text="LOGGING OUT..." />;
  }

  if (!user) {
    return <Auth onSuccess={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-[#05070a] text-gray-200 font-sans selection:bg-ai-cyan selection:text-black overflow-hidden">
      <Sidebar 
        user={user} 
        currentView={view} 
        setView={setView} 
        onLogout={initiateLogout} 
      />
      
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative bg-[#0b0e14]">
        {/* Top Banner */}
        <header className="px-6 py-5 border-b border-gray-800 bg-[#05070a]/95 backdrop-blur-sm z-10 shrink-0 flex justify-between items-center shadow-lg">
            <div>
                <h1 className="text-xl md:text-2xl font-bold font-oswald text-white tracking-tight flex items-center gap-2">
                    Welcome back, <span className="text-ai-cyan">{user.username}</span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <Zap size={12} className="text-emerald-500 fill-emerald-500" />
                    <p className="text-[11px] md:text-xs text-gray-400 font-mono tracking-wide">
                         Ready to track your nutrition today?
                    </p>
                </div>
            </div>
            <div className="md:hidden px-3 py-1 border border-ai-cyan/30 bg-ai-cyan/5 text-ai-cyan text-[10px] font-bold font-oswald tracking-widest rounded-md uppercase shadow-[0_0_10px_rgba(0,234,223,0.1)]">
                {view === 'home' ? 'SCANNER' : 'HISTORY'}
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8 relative">
            {view === 'home' ? (
                <Scanner key={`scanner-${user.username}-${Date.now()}`} user={user} />
            ) : (
                <History key={`history-${user.username}`} user={user} />
            )}
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-gray-800 bg-[#05070a] text-center text-[10px] text-gray-600 font-mono hidden md:block shrink-0">
            Biswa AI Sentinel • Secure Nutrition Analysis
        </footer>
      </main>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Confirm Logout">
          <div className="text-center p-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <Power size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white font-oswald tracking-wide mb-2">Signing Out?</h3>
              <p className="text-sm text-gray-400 font-mono mb-6">
                  Any unsaved scanning data will be cleared. Are you sure?
              </p>
              <div className="flex gap-3">
                  <button 
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 font-bold font-oswald tracking-wider text-xs transition"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={confirmLogout}
                    className="flex-1 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-800 text-white font-bold font-oswald tracking-wider text-xs hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition"
                  >
                    LOGOUT
                  </button>
              </div>
          </div>
      </Modal>
    </div>
  );
};

export default App;