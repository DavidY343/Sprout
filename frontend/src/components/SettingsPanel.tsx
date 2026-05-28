import { useState } from 'react';
import { X, Building2, TrendingUp, Globe } from 'lucide-react';
import AccountCreationForm from './form/AccountCreationForm';
import AssetCreationForm from './form/AssetCreationForm';
import { surface, text } from '../styles/theme';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [section, setSection] = useState<'accounts' | 'assets' | 'preferences'>('accounts');

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
            <div>
              <div className="mb-4">
                <h3 className={text.sectionTitle}>Activos</h3>
                <p className={text.sectionDesc}>Añade activos con su ticker de Yahoo Finance. El worker traerá precios automáticamente.</p>
              </div>
              <AssetCreationForm />
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
