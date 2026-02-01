// components/layout/TopBar.tsx
import { useState, useEffect } from 'react';
import { UserCircle, LogOut } from 'lucide-react';
import { isAuthenticated, logout, getUserEmail } from '../services/authService';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TopBar({ activeTab, setActiveTab }: Props) {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const tabs = [
    { id: 'portfolio', label: 'Dashboard' },
    { id: 'trades', label: 'Trade Logs' },
    { id: 'rebalance', label: 'Rebalanceo' }
  ];

  useEffect(() => {
    setUserEmail(getUserEmail());
  }, []);

  const handleLogout = () => {
    logout();
    window.location.reload(); // Recargar para volver al login
  };

  return (
    <header className="flex items-center justify-between px-8 py-5 bg-[#0B0F1A] border-b border-white/10">
      <h1 className="text-xl font-semibold tracking-wide">
        Financial Hub
      </h1>

      <nav className="flex gap-10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-lg font-medium transition-all duration-200 relative cursor-pointer ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
            {/* Indicador activo */}
            {activeTab === tab.id && (
              <div className="absolute -bottom-5 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <UserCircle className="w-5 h-5 text-gray-300" />
          <span className="text-gray-300">
            {userEmail || 'Usuario'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 transition text-sm font-medium cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}