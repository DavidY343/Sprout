import { useState, useEffect } from 'react';
import { X, Building2, TrendingUp, Globe, Trash2, Users, UserPlus, Check, XCircle } from 'lucide-react';
import AccountCreationForm from './form/AccountCreationForm';
import AssetCreationForm from './form/AssetCreationForm';
import { surface, text } from '../styles/theme';
import { getAssetsWithPrices, AssetWithPrice, removeAsset } from '../services/assetService';
import { getFriends, sendFriendRequest, acceptFriendRequest, removeFriend } from '../services/friendService';
import { Friendship } from '../types/friendship';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [section, setSection] = useState<'accounts' | 'assets' | 'friends' | 'preferences'>('accounts');
  const [userAssets, setUserAssets] = useState<AssetWithPrice[]>([]);
  const [removing, setRemoving] = useState<number | null>(null);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [friendLoading, setFriendLoading] = useState(false);
  const [friendError, setFriendError] = useState('');

  useEffect(() => {
    if (open && section === 'assets') loadAssets();
    if (open && section === 'friends') loadFriends();
  }, [open, section]);

  const loadFriends = async () => {
    try { setFriends(await getFriends()); } catch { /* */ }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail.trim()) return;
    setFriendLoading(true);
    setFriendError('');
    try {
      const f = await sendFriendRequest(friendEmail.trim());
      setFriends(prev => [...prev, f]);
      setFriendEmail('');
    } catch (err: any) {
      setFriendError(err.message || 'Error al enviar solicitud');
    } finally { setFriendLoading(false); }
  };

  const handleAccept = async (id: number) => {
    try {
      const updated = await acceptFriendRequest(id);
      setFriends(prev => prev.map(f => f.friendship_id === id ? updated : f));
    } catch { /* */ }
  };

  const handleRemoveFriend = async (id: number) => {
    try {
      await removeFriend(id);
      setFriends(prev => prev.filter(f => f.friendship_id !== id));
    } catch { /* */ }
  };

  const loadAssets = async () => {
    try { setUserAssets(await getAssetsWithPrices()); } catch { /* */ }
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

  if (!open) return null;

  const sections = [
    { id: 'accounts' as const, label: 'Cuentas', icon: <Building2 className="w-4 h-4" /> },
    { id: 'assets' as const, label: 'Activos', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'friends' as const, label: 'Amigos', icon: <Users className="w-4 h-4" /> },
    { id: 'preferences' as const, label: 'Preferencias', icon: <Globe className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Panel (slide from right) */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--bg-surface)] border-l border-[var(--border)] z-50 shadow-xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Configuración</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-[var(--border)] px-6 gap-1">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer ${
                section === s.id
                  ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {section === 'accounts' && (
            <div>
              <div className="mb-4">
                <h3 className={text.sectionTitle}>Cuentas de inversión</h3>
                <p className={text.sectionDesc}>Añade tus brokers y cuentas (Trade Republic, MyInvestor, etc.)</p>
              </div>
              <AccountCreationForm />
            </div>
          )}

          {section === 'assets' && (
            <div className="space-y-6">
              <div className="mb-4">
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

              {/* User's assets list with delete */}
              {userAssets.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Tus activos</h4>
                  <div className="space-y-1">
                    {userAssets.map(a => (
                      <div key={a.asset_id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-[#FAFAF8]">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{a.name}</span>
                          <span className="text-xs text-[var(--text-muted)] font-mono">{a.ticker || a.isin || '—'}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveAsset(a.asset_id, a.name)}
                          disabled={removing === a.asset_id}
                          className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition cursor-pointer disabled:opacity-40"
                          title="Eliminar activo y todas sus operaciones"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {section === 'friends' && (
            <div className="space-y-6">
              <div className="mb-4">
                <h3 className={text.sectionTitle}>Amigos</h3>
                <p className={text.sectionDesc}>Añade amigos para ver sus carteras (solo lectura)</p>
              </div>

              {/* Add friend form */}
              <form onSubmit={handleAddFriend} className="flex gap-2">
                <input
                  type="email"
                  value={friendEmail}
                  onChange={e => { setFriendEmail(e.target.value); setFriendError(''); }}
                  placeholder="Email del amigo"
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:border-[var(--border-focus)]"
                />
                <button
                  type="submit"
                  disabled={friendLoading || !friendEmail.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[var(--btn-primary-bg)] text-white text-sm font-medium rounded-lg hover:bg-[var(--btn-primary-hover)] transition disabled:opacity-40 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Añadir
                </button>
              </form>
              {friendError && <p className="text-xs text-[var(--accent-red)]">{friendError}</p>}

              {/* Pending received */}
              {friends.filter(f => f.status === 'pending' && f.direction === 'received').length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Solicitudes recibidas</h4>
                  <div className="space-y-1">
                    {friends.filter(f => f.status === 'pending' && f.direction === 'received').map(f => (
                      <div key={f.friendship_id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)]">
                        <span className="text-sm text-[var(--text-primary)]">{f.friend_email}</span>
                        <div className="flex gap-1">
                          <button onClick={() => handleAccept(f.friendship_id)} className="p-1.5 rounded text-[var(--accent-green)] hover:bg-[var(--accent-green)]/10 transition cursor-pointer" title="Aceptar">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRemoveFriend(f.friendship_id)} className="p-1.5 rounded text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition cursor-pointer" title="Rechazar">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending sent */}
              {friends.filter(f => f.status === 'pending' && f.direction === 'sent').length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Solicitudes enviadas</h4>
                  <div className="space-y-1">
                    {friends.filter(f => f.status === 'pending' && f.direction === 'sent').map(f => (
                      <div key={f.friendship_id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)]">
                        <span className="text-sm text-[var(--text-primary)]">{f.friend_email}</span>
                        <span className="text-xs text-[var(--text-muted)]">Pendiente</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted friends */}
              {friends.filter(f => f.status === 'accepted').length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Amigos</h4>
                  <div className="space-y-1">
                    {friends.filter(f => f.status === 'accepted').map(f => (
                      <div key={f.friendship_id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)]">
                        <span className="text-sm text-[var(--text-primary)]">{f.friend_email}</span>
                        <button onClick={() => handleRemoveFriend(f.friendship_id)} className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition cursor-pointer" title="Eliminar amigo">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {friends.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">No tienes amigos añadidos aún</p>
              )}
            </div>
          )}

          {section === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className={text.sectionTitle}>Preferencias</h3>
                <p className={text.sectionDesc}>Ajustes generales de la aplicación</p>
              </div>

              {/* Currency display */}
              <div className={surface.creatorPanel}>
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Moneda principal</label>
                <select
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-[var(--text-primary)] text-sm"
                  defaultValue="EUR"
                >
                  <option value="EUR">€ Euro (EUR)</option>
                  <option value="USD">$ Dólar (USD)</option>
                  <option value="GBP">£ Libra (GBP)</option>
                </select>
                <p className="text-xs text-[var(--text-muted)]">Moneda en la que se muestran los totales</p>
              </div>

              {/* Default view */}
              <div className={surface.creatorPanel}>
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Vista por defecto</label>
                <select
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-[var(--text-primary)] text-sm"
                  defaultValue="resumen"
                >
                  <option value="resumen">Resumen</option>
                  <option value="distribucion">Distribución</option>
                  <option value="mapa">Mapa de activos</option>
                </select>
                <p className="text-xs text-[var(--text-muted)]">Vista inicial al abrir el Dashboard</p>
              </div>

              {/* Number format */}
              <div className={surface.creatorPanel}>
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Formato numérico</label>
                <select
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-[var(--text-primary)] text-sm"
                  defaultValue="es-ES"
                >
                  <option value="es-ES">1.234,56 (España)</option>
                  <option value="en-US">1,234.56 (US/UK)</option>
                </select>
                <p className="text-xs text-[var(--text-muted)]">Separador de miles y decimales</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
