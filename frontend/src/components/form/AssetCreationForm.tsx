import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { AssetCreate } from '../../types/asset';
import { createAsset } from '../../services/assetService';
import { input, button, text } from '../../styles/theme';
import Toast from '../Toast';

interface AssetCreationFormProps {
  onSuccess?: (asset: any) => void;
}

export default function AssetCreationForm({ onSuccess }: AssetCreationFormProps) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [form, setForm] = useState<AssetCreate>({
    name: '', ticker: '', isin: '', currency: 'EUR', type: 'etf', theme: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() && !form.ticker?.trim()) {
      setToast({ message: 'Necesitas al menos nombre o ticker', type: 'error' }); return;
    }
    try {
      setLoading(true);
      const asset = await createAsset({ ...form, name: form.name || form.ticker || '', theme: form.theme || 'Otros' });
      setToast({ message: `${asset.ticker || asset.name} creado — el worker traerá precios`, type: 'success' });
      setForm({ name: '', ticker: '', isin: '', currency: 'EUR', type: 'etf', theme: '' });
      setTimeout(() => { if (onSuccess) onSuccess(asset) }, 800);
    } catch { setToast({ message: 'Error al crear activo', type: 'error' }) }
    finally { setLoading(false) }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Fila 1: Nombre */}
      <div>
        <label className={text.fieldLabel}>Nombre</label>
        <input type="text" placeholder="Ej: Vanguard S&P 500 ETF" value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          className={input.base} />
      </div>

      {/* Fila 2: ISIN | Ticker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={text.fieldLabel}>ISIN (fondos)</label>
          <input type="text" placeholder="Ej: IE00B3XXRP09" value={form.isin || ''}
            onChange={e => setForm(p => ({ ...p, isin: e.target.value.toUpperCase() }))}
            className={input.base + ' font-mono'} />
        </div>
        <div>
          <label className={text.fieldLabel}>Ticker (acciones)</label>
          <input type="text" placeholder="Ej: VUSA.L, MSFT" value={form.ticker || ''}
            onChange={e => setForm(p => ({ ...p, ticker: e.target.value.toUpperCase() }))}
            className={input.base + ' font-mono'} />
        </div>
      </div>

      {/* Fila 3: Tipo | Divisa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={text.fieldLabel}>Tipo</label>
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
            className={input.select}>
            <option value="etf">ETF</option>
            <option value="fund">Fondo indexado</option>
            <option value="stock">Acción</option>
            <option value="crypto">Crypto</option>
            <option value="bond">Bono</option>
            <option value="reit">REIT</option>
          </select>
        </div>
        <div>
          <label className={text.fieldLabel}>Divisa</label>
          <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
            className={input.select}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      {/* Fila 4: Temática | Crear activo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label className={text.fieldLabel}>Temática</label>
          <input type="text" placeholder="Otros" value={form.theme || ''}
            onChange={e => setForm(p => ({ ...p, theme: e.target.value }))}
            className={input.base} />
        </div>
        <div>
          <button type="submit" disabled={loading}
            className={button.primary + ' flex items-center justify-center gap-2'}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Crear activo</>}
          </button>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </form>
  );
}