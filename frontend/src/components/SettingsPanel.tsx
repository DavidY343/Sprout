import { useState, useEffect } from 'react';
import { X, Building2, TrendingUp, Globe, Trash2 } from 'lucide-react';
import AccountCreationForm from './form/AccountCreationForm';
import AssetCreationForm from './form/AssetCreationForm';
import { surface, text } from '../styles/theme';
import { getAssetsWithPrices, AssetWithPrice, removeAsset } from '../services/assetService';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [section, setSection] = useState<'accounts' | 'assets' | 'preferences'>('accounts');
  const [userAssets, setUserAssets] = useState<AssetWithPrice[]>([]);
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => {
    if (open && section === 'assets') loadAssets();
  }, [open, section]);

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
    { id: 'preferences' as const, label: 'Preferencias', icon: <Globe className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Panel (slide from right) */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#E5DED3] z-50 shadow-xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DED3]">
          <h2 className="text-lg font-semibold text-[#2C2C2C]">Configuración</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B8578] hover:text-[#2C2C2C] hover:bg-[#F0EBE3] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-[#E5DED3] px-6 gap-1">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer ${
                section === s.id
                  ? 'border-[#2C2C2C] text-[#2C2C2C]'
                  : 'border-transparent text-[#8B8578] hover:text-[#5A5549]'
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
                  Ejemplos: <code className="text-xs bg-[#F0EBE3] px-1 py-0.5 rounded">NXT.MC</code> (Madrid),
                  <code className="text-xs bg-[#F0EBE3] px-1 py-0.5 rounded">VUSA.L</code> (Londres),
                  <code className="text-xs bg-[#F0EBE3] px-1 py-0.5 rounded">MSFT</code> (NASDAQ, sin extensión).
                  El worker usa el ticker tal cual para traer precios automáticamente.
                </p>
              </div>
              <AssetCreationForm onSuccess={() => loadAssets()} />

              {/* User's assets list with delete */}
              {userAssets.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#5A5549] mb-2">Tus activos</h4>
                  <div className="space-y-1">
                    {userAssets.map(a => (
                      <div key={a.asset_id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#E5DED3] bg-[#FAFAF8]">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#2C2C2C]">{a.name}</span>
                          <span className="text-xs text-[#8B8578] font-mono">{a.ticker || a.isin || '—'}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveAsset(a.asset_id, a.name)}
                          disabled={removing === a.asset_id}
                          className="p-1.5 rounded text-[#8B8578] hover:text-[#C25B3F] hover:bg-[#C25B3F]/10 transition cursor-pointer disabled:opacity-40"
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

          {section === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className={text.sectionTitle}>Preferencias</h3>
                <p className={text.sectionDesc}>Ajustes generales de la aplicación</p>
              </div>

              {/* Currency display */}
              <div className={surface.creatorPanel}>
                <label className="block text-sm font-medium text-[#5A5549]">Moneda principal</label>
                <select
                  className="w-full bg-white border border-[#D5CEC2] rounded-lg px-4 py-2 text-[#2C2C2C] text-sm"
                  defaultValue="EUR"
                >
                  <option value="EUR">€ Euro (EUR)</option>
                  <option value="USD">$ Dólar (USD)</option>
                  <option value="GBP">£ Libra (GBP)</option>
                </select>
                <p className="text-xs text-[#8B8578]">Moneda en la que se muestran los totales</p>
              </div>

              {/* Default view */}
              <div className={surface.creatorPanel}>
                <label className="block text-sm font-medium text-[#5A5549]">Vista por defecto</label>
                <select
                  className="w-full bg-white border border-[#D5CEC2] rounded-lg px-4 py-2 text-[#2C2C2C] text-sm"
                  defaultValue="resumen"
                >
                  <option value="resumen">Resumen</option>
                  <option value="distribucion">Distribución</option>
                  <option value="mapa">Mapa de activos</option>
                </select>
                <p className="text-xs text-[#8B8578]">Vista inicial al abrir el Dashboard</p>
              </div>

              {/* Number format */}
              <div className={surface.creatorPanel}>
                <label className="block text-sm font-medium text-[#5A5549]">Formato numérico</label>
                <select
                  className="w-full bg-white border border-[#D5CEC2] rounded-lg px-4 py-2 text-[#2C2C2C] text-sm"
                  defaultValue="es-ES"
                >
                  <option value="es-ES">1.234,56 (España)</option>
                  <option value="en-US">1,234.56 (US/UK)</option>
                </select>
                <p className="text-xs text-[#8B8578]">Separador de miles y decimales</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
