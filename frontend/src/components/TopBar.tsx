import { useState, useEffect } from 'react';
import { UserCircle, LogOut } from 'lucide-react';
import { isAuthenticated, logout, getUserEmail } from '../services/authService';
import { app, button } from '../styles/theme';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TopBar({ activeTab, setActiveTab }: Props) {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const tabs = [
    { id: 'portfolio', label: 'Dashboard' },
    { id: 'trades', label: 'Trades' },
    { id: 'transactions', label: 'Cash Flow' }
  ];

  useEffect(() => {
    setUserEmail(getUserEmail());
  }, []);

  const handleLogout = () => {
    logout();
    window.location.reload(); // Recargar para volver al login
  };

  return (
    <header className={app.topBar}>
      <h1 className="text-xl font-semibold tracking-wide text-[#2C2C2C]">
        Financial Hub
      </h1>

      <nav className="flex gap-10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-lg font-medium transition-all duration-200 relative cursor-pointer ${
              activeTab === tab.id
                ? 'text-[#2C2C2C]'
                : 'text-[#8B8578] hover:text-[#5A5549]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute -bottom-5 left-0 right-0 h-0.5 bg-[#2C2C2C]"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <UserCircle className="w-5 h-5 text-[#8B8578]" />
          <span className="text-[#5A5549]">
            {userEmail || 'Usuario'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className={button.danger}
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}