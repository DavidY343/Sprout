import { useState, useEffect } from 'react';
import { UserCircle, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { logout, getUserEmail } from '../services/authService';
import { app, button } from '../styles/theme';
import { useTheme } from '../hooks/useTheme';
import SettingsPanel from './SettingsPanel';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TopBar({ activeTab, setActiveTab }: Props) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const tabs = [
    { id: 'portfolio', label: 'Dashboard' },
    { id: 'trades', label: 'Operaciones' },
    { id: 'transactions', label: 'Balances' }
  ];

  useEffect(() => {
    setUserEmail(getUserEmail());
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className={app.topBar}>
        <h1 className="text-xl font-semibold tracking-wide text-[var(--text-primary)]">
          Financial Hub
        </h1>

        <nav className="flex gap-10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-lg font-medium transition-all duration-200 relative cursor-pointer ${
                activeTab === tab.id
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute -bottom-5 left-0 right-0 h-0.5 bg-[var(--text-primary)]"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
            title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
            title="Configuración"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <UserCircle className="w-5 h-5 text-[var(--text-muted)]" />
            <span className="text-[var(--text-secondary)]">
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

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}