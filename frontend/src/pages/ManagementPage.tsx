import { useState, useEffect } from 'react';
import { Building2, TrendingUp, Check, Trash2, Pencil } from 'lucide-react';
import AccountCreationForm from '../components/form/AccountCreationForm';
import AssetCreationForm from '../components/form/AssetCreationForm';
import { text, surface } from '../styles/theme';
import { getAssetsWithPrices, AssetWithPrice, removeAsset, updateAsset } from '../services/assetService';
import { getUserAccounts, removeAccount, updateAccount } from '../services/accountService';
import { Account } from '../types/account';

const TYPE_LABELS: Record<string, string> = {
  etf: 'ETF', fund: 'Fondo', money_market: 'F. Monetario', stock: 'Acción', crypto: 'Crypto', bond: 'Bono', reit: 'REIT',
};

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'assets'>('accounts');
  const [userAssets, setUserAssets] = useState<AssetWithPrice[]>([]);
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [removing, setRemoving] = useState<number | null>(null);
  const [editingAsset, setEditingAsset] = useState<number | null>(null);
  const [editingAccount, setEditingAccount] = useState<number | null>(null);
  
  // Asset edit state
  const [editType, setEditType] = useState('');
  const [editTheme, setEditTheme] = useState('');

  // Account edit state
  const [editAccountName, setEditAccountName] = useState('');
  const [editAccountType, setEditAccountType] = useState('');

  useEffect(() => {
    if (activeTab === 'assets') loadAssets();
    if (activeTab === 'accounts') loadAccounts();
  }, [activeTab]);

  const loadAssets = async () => {
    try { setUserAssets(await getAssetsWithPrices()); } catch { /* */ }
  };

  const loadAccounts = async () => {
    try { setUserAccounts(await getUserAccounts()); } catch { /* */ }
  };

  const handleRemoveAsset = async (assetId: number, name: string) => {
    if (!confirm(`¿Eliminar "${name}" y todas sus operaciones/transacciones? Esta acción no se puede deshacer.`)) return;
    setRemoving(assetId);
    try {
      await removeAsset(assetId);
      setUserAssets(prev => prev.filter(a => a.asset_id !== assetId));
    } catch { /* */ }
    finally { setRemoving(null); }
  };

  const handleRemoveAccount = async (accountId: number, name: string) => {
    if (!confirm(`¿Eliminar la cuenta "${name}" y TODAS las operaciones y transacciones asociadas en cascada? Esta acción no se puede deshacer.`)) return;
    setRemoving(accountId);
    try {
      await removeAccount(accountId);
      setUserAccounts(prev => prev.filter(a => a.account_id !== accountId));
    } catch { /* */ }
    finally { setRemoving(null); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Gestión</h1>
        <p className="text-[var(--text-muted)] mt-2">Crea y administra tus cuentas de inversión y los activos que componen tu cartera.</p>
      </div>

      <div className="flex gap-4 border-b border-[var(--border)] mb-6">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'accounts' ? 'border-[var(--accent-blue)] text-[var(--accent-blue)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Building2 className="w-5 h-5" />
          Cuentas
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'assets' ? 'border-[var(--accent-blue)] text-[var(--accent-blue)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          Activos
        </button>
      </div>

      <div className={surface.card}>
        {activeTab === 'accounts' && (
          <div className="space-y-8">
            <div>
              <div className="mb-6">
                <h3 className={text.sectionTitle}>Cuentas de inversión</h3>
                <p className={text.sectionDesc}>Añade tus brokers y cuentas (Trade Republic, MyInvestor, etc.)</p>
              </div>
              <AccountCreationForm onSuccess={() => loadAccounts()} />
            </div>

            {userAccounts.length > 0 && (
              <div className="pt-6 border-t border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Tus cuentas</h4>
                <div className="space-y-2">
                  {userAccounts.map(a => (
                    <div key={a.account_id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)]">
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{a.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]">{a.type}</span>
                            <span className="text-xs text-[var(--text-muted)] font-mono">{a.currency}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingAccount(editingAccount === a.account_id ? null : a.account_id); setEditAccountName(a.name); setEditAccountType(a.type); }}
                            className="p-2 rounded text-[var(--text-muted)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 transition cursor-pointer"
                            title="Editar nombre y tipo"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveAccount(a.account_id, a.name)}
                            disabled={removing === a.account_id}
                            className="p-2 rounded text-[var(--text-muted)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition cursor-pointer disabled:opacity-40"
                            title="Eliminar cuenta y todas sus operaciones"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {editingAccount === a.account_id && (
                        <div className="px-4 pb-4 pt-2 border-t border-[var(--border)] flex flex-wrap gap-4 items-end">
                          <div className="flex-1 min-w-[150px]">
                            <label className="text-xs text-[var(--text-muted)] mb-1 block">Nombre</label>
                            <input type="text" value={editAccountName} onChange={e => setEditAccountName(e.target.value)}
                              className="w-full bg-[var(--bg-surface)] border border-[var(--border-input)] rounded px-3 py-2 text-sm text-[var(--text-primary)]" />
                          </div>
                          <div className="flex-1 min-w-[150px]">
                            <label className="text-xs text-[var(--text-muted)] mb-1 block">Tipo</label>
                            <select value={editAccountType} onChange={e => setEditAccountType(e.target.value)}
                              className="w-full bg-[var(--bg-surface)] border border-[var(--border-input)] rounded px-3 py-2 text-sm text-[var(--text-primary)]">
                              <option value="broker">Broker</option>
                              <option value="neobroker">NeoBroker</option>
                              <option value="bank">Banco Tradicional</option>
                              <option value="online_bank">Banco Online</option>
                              <option value="crypto">Exchange Crypto</option>
                              <option value="other">Otro</option>
                            </select>
                          </div>
                          <button
                            onClick={async () => {
                              if (!editAccountName.trim()) return;
                              try {
                                await updateAccount(a.account_id, { name: editAccountName.trim(), type: editAccountType });
                                setUserAccounts(prev => prev.map(x => x.account_id === a.account_id ? { ...x, name: editAccountName.trim(), type: editAccountType } : x));
                                setEditingAccount(null);
                              } catch { /* */ }
                            }}
                            className="px-4 py-2 rounded bg-[var(--accent-blue)] text-white text-sm font-medium hover:opacity-90 transition cursor-pointer flex-shrink-0"
                          >
                            Guardar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-8">
            <div>
              <div className="mb-6">
                <h3 className={text.sectionTitle}>Activos</h3>
                <p className={text.sectionDesc}>
                  Añade activos con su ticker <strong>exacto de Yahoo Finance</strong>, incluyendo la extensión de la bolsa donde cotiza.
                  Ejemplos: <code className="text-xs bg-[var(--bg-surface-hover)] px-1 py-0.5 rounded">NXT.MC</code> (Madrid),
                  <code className="text-xs bg-[var(--bg-surface-hover)] px-1 py-0.5 rounded">VUSA.L</code> (Londres),
                  <code className="text-xs bg-[var(--bg-surface-hover)] px-1 py-0.5 rounded">MSFT</code> (NASDAQ, sin extensión).
                  El worker usa el ticker tal cual para traer precios automáticamente.
                </p>
              </div>
              <AssetCreationForm onSuccess={() => loadAssets()} />
            </div>

            {/* User's assets list with edit/delete */}
            {userAssets.length > 0 && (
              <div className="pt-6 border-t border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Tus activos</h4>
                <div className="space-y-2">
                  {userAssets.map(a => (
                    <div key={a.asset_id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)]">
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{a.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[var(--text-muted)] font-mono">{a.ticker || a.isin || '—'}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]">{TYPE_LABELS[a.type] || a.type}</span>
                            {a.theme && <span className="text-xs text-[var(--text-muted)]">{a.theme}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingAsset(editingAsset === a.asset_id ? null : a.asset_id); setEditType(a.type); setEditTheme(a.theme || ''); }}
                            className="p-2 rounded text-[var(--text-muted)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 transition cursor-pointer"
                            title="Editar tipo y temática"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveAsset(a.asset_id, a.name)}
                            disabled={removing === a.asset_id}
                            className="p-2 rounded text-[var(--text-muted)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition cursor-pointer disabled:opacity-40"
                            title="Eliminar activo y todas sus operaciones"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Inline edit panel */}
                      {editingAsset === a.asset_id && (
                        <div className="px-4 pb-4 pt-2 border-t border-[var(--border)] flex flex-wrap gap-4 items-end">
                          <div className="flex-1 min-w-[150px]">
                            <label className="text-xs text-[var(--text-muted)] mb-1 block">Tipo</label>
                            <select value={editType} onChange={e => setEditType(e.target.value)}
                              className="w-full bg-[var(--bg-surface)] border border-[var(--border-input)] rounded px-3 py-2 text-sm text-[var(--text-primary)]">
                              <option value="etf">ETF</option>
                              <option value="fund">Fondo indexado</option>
                              <option value="money_market">Fondo monetario</option>
                              <option value="stock">Acción</option>
                              <option value="crypto">Crypto</option>
                              <option value="bond">Bono</option>
                              <option value="reit">REIT</option>
                            </select>
                          </div>
                          <div className="flex-1 min-w-[150px]">
                            <label className="text-xs text-[var(--text-muted)] mb-1 block">Temática</label>
                            <input type="text" value={editTheme} onChange={e => setEditTheme(e.target.value)}
                              placeholder="Ej: Tecnología"
                              className="w-full bg-[var(--bg-surface)] border border-[var(--border-input)] rounded px-3 py-2 text-sm text-[var(--text-primary)]" />
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                await updateAsset(a.asset_id, { type: editType, theme: editTheme || undefined });
                                setUserAssets(prev => prev.map(x => x.asset_id === a.asset_id ? { ...x, type: editType, theme: editTheme || null } : x));
                                setEditingAsset(null);
                              } catch { /* */ }
                            }}
                            className="px-4 py-2 rounded bg-[var(--accent-blue)] text-white text-sm font-medium hover:opacity-90 transition cursor-pointer flex-shrink-0"
                          >
                            Guardar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
