import { useState, useEffect } from 'react';
import { Loader2, Check } from 'lucide-react';
import { createTrade } from '../../services/tradeService';
import { getAssetsWithPrices, AssetWithPrice } from '../../services/assetService';
import { getUserAccounts } from '../../services/accountService';
import { Account } from '../../types/account';
import { OperationCreate } from '../../types/trade';
import Toast from '../Toast';
import { surface } from '../../styles/theme';

interface AddTradeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddTradeForm({ onSuccess }: AddTradeFormProps) {
  const [assets, setAssets] = useState<AssetWithPrice[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  const [formData, setFormData] = useState<OperationCreate>({
    asset_id: 0, account_id: 0,
    date: new Date().toISOString().split('T')[0],
    quantity: 1, price: 0, fees: 0, operation_type: 'buy'
  });

  useEffect(() => { loadData() }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [a, c] = await Promise.all([getAssetsWithPrices(), getUserAccounts()]);
      setAssets(a); setAccounts(c);
      if (a.length > 0) setFormData(p => ({ ...p, asset_id: a[0].asset_id, price: a[0].current_price }));
      if (c.length > 0) setFormData(p => ({ ...p, account_id: c[0].account_id }));
    } catch { /* */ }
    finally { setLoadingData(false) }
  };

  const handleAssetChange = (id: number) => {
    const asset = assets.find(a => a.asset_id === id);
    setFormData(p => ({ ...p, asset_id: id, price: asset?.current_price || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asset_id || !formData.account_id || formData.quantity <= 0 || formData.price <= 0) {
      setToast({ message: 'Completa todos los campos', type: 'error' }); return;
    }
    try {
      setLoading(true);
      await createTrade(formData);
      setToast({ message: 'Hecho', type: 'success' });
      setFormData(p => ({ ...p, quantity: 1, date: new Date().toISOString().split('T')[0] }));
      setTimeout(() => { if (onSuccess) onSuccess() }, 800);
    } catch { setToast({ message: 'Error al registrar', type: 'error' }) }
    finally { setLoading(false) }
  };

  if (loadingData) return <div className={surface.card + ' flex justify-center py-4'}><Loader2 className="w-5 h-5 animate-spin text-[#4A6FA5]" /></div>;

  const total = formData.quantity * formData.price;
  const isBuy = formData.operation_type === 'buy';

  return (
    <div className={surface.card}>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 text-sm text-[#5A5549]">
        {/* Tipo */}
        <button type="button" onClick={() => setFormData(p => ({ ...p, operation_type: isBuy ? 'sell' : 'buy' }))}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${isBuy ? 'bg-[#6B8F71]/15 text-[#6B8F71] border border-[#6B8F71]/30' : 'bg-[#C25B3F]/15 text-[#C25B3F] border border-[#C25B3F]/30'}`}>
          {isBuy ? 'Comprar' : 'Vender'}
        </button>

        {/* Cantidad */}
        <input type="number" min="0" step="any" value={formData.quantity}
          onChange={e => setFormData(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))}
          className="w-16 bg-transparent border-b border-[#D5CEC2] text-[#2C2C2C] text-center font-mono focus:outline-none focus:border-[#4A6FA5] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />

        <span className="text-[#B0A99C]">×</span>

        {/* Activo */}
        <select value={formData.asset_id} onChange={e => handleAssetChange(parseInt(e.target.value))}
          className="bg-transparent border-b border-[#D5CEC2] text-[#2C2C2C] font-medium focus:outline-none focus:border-[#4A6FA5] cursor-pointer max-w-[160px] truncate">
          {assets.map(a => <option key={a.asset_id} value={a.asset_id}>{a.ticker || a.name}</option>)}
        </select>

        <span className="text-[#B0A99C]">en</span>

        {/* Cuenta */}
        <select value={formData.account_id} onChange={e => setFormData(p => ({ ...p, account_id: parseInt(e.target.value) }))}
          className="bg-transparent border-b border-[#D5CEC2] text-[#2C2C2C] focus:outline-none focus:border-[#4A6FA5] cursor-pointer max-w-[140px] truncate">
          {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.name}</option>)}
        </select>

        <span className="text-[#B0A99C]">el</span>

        {/* Fecha */}
        <input type="date" value={formData.date}
          onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
          className="bg-transparent border-b border-[#D5CEC2] text-[#2C2C2C] focus:outline-none focus:border-[#4A6FA5]" />

        {/* Separador + precio/total */}
        <span className="text-[#B0A99C] ml-auto">a</span>
        <div className="relative flex items-center">
          <span className="absolute left-1 text-[#8B8578] font-mono text-sm pointer-events-none">€</span>
          <input type="number" min="0" step="any" value={formData.price || ''}
            onChange={e => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
            placeholder="Precio"
            className="w-24 pl-4 bg-transparent border-b border-[#D5CEC2] text-[#2C2C2C] font-mono text-right focus:outline-none focus:border-[#4A6FA5] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        </div>
        <span className="text-[#B0A99C]">→</span>
        <span className="text-[#2C2C2C] font-mono font-semibold">€{total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="ml-2 p-2 rounded-lg bg-[#2C2C2C] hover:bg-[#3D3D3D] text-[#FAF7F0] transition disabled:opacity-50 cursor-pointer">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
      </form>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}