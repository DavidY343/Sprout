import { useState, useEffect } from 'react';
import { UserCircle, LogOut, Settings, Sun, Moon, LayoutDashboard, LineChart, WalletCards, Users, Settings2 } from 'lucide-react';
import { logout, getUserEmail } from '../services/authService';
import { app, button } from '../styles/theme';
import { useTheme } from '../hooks/useTheme';
import SettingsPanel from './SettingsPanel';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  settingsSection?: 'friends' | 'preferences';
}

export default function Sidebar({ activeTab, setActiveTab, settingsOpen, setSettingsOpen, settingsSection }: Props) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const tabs = [
    { id: 'portfolio', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'trades', label: 'Operaciones', icon: <LineChart className="w-5 h-5" /> },
    { id: 'transactions', label: 'Balances', icon: <WalletCards className="w-5 h-5" /> },
    { id: 'friends', label: 'Amigos', icon: <Users className="w-5 h-5" /> },
    { id: 'management', label: 'Gestión', icon: <Settings2 className="w-5 h-5" /> },
  ];

  useEffect(() => {
    setUserEmail(getUserEmail());
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <aside className="w-64 bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col h-screen fixed left-0 top-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wide text-[var(--text-primary)]">
            Sprout
          </h1>
        </div>

        <nav className="flex flex-col gap-2 px-4 flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              data-tour={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border)] flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-sm truncate max-w-[150px]">
              <UserCircle className="w-6 h-6 text-[var(--text-muted)] flex-shrink-0" />
              <span className="text-[var(--text-secondary)] truncate">
                {userEmail || 'Usuario'}
              </span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
                title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <button
                data-tour="settings"
                onClick={() => setSettingsOpen(true)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
                title="Configuración"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`${button.danger} w-full justify-center`}
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} externalSection={settingsSection} />
    </>
  );
}
