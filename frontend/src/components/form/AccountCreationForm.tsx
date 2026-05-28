import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { AccountCreate } from '../../types/account';
import { createAccount } from '../../services/accountService';
import { input, button, text } from '../../styles/theme';
import Toast from '../Toast';

interface AccountCreationFormProps {
  onSuccess?: (account: any) => void;
}

export default function AccountCreationForm({ onSuccess }: AccountCreationFormProps) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [form, setForm] = useState<AccountCreate>({
    name: '', type: 'neobroker', currency: 'EUR'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setToast({ message: 'Nombre requerido', type: 'error' }); return; }
    try {
      setLoading(true);
      const account = await createAccount(form);
      setToast({ message: `Cuenta "${account.name}" creada`, type: 'success' });
      setForm({ name: '', type: 'neobroker', currency: 'EUR' });
      setTimeout(() => { if (onSuccess) onSuccess(account) }, 800);
    } catch { setToast({ message: 'Error al crear cuenta', type: 'error' }) }
    finally { setLoading(false) }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className={text.fieldLabel}>Nombre</label>
          <input type="text" placeholder="Ej: Trade Republic" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className={input.base} />
        </div>
        <div>
          <label className={text.fieldLabel}>Tipo</label>
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
            className={input.select}>
            <option value="neobroker">Neobroker</option>
            <option value="broker">Broker tradicional</option>
            <option value="online_bank">Banco digital</option>
            <option value="bank">Banco tradicional</option>
            <option value="crypto">Exchange crypto</option>
            <option value="other">Otro</option>
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
        <div>
          <button type="submit" disabled={loading}
            className={button.primary + ' flex items-center justify-center gap-2'}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Crear cuenta</>}
          </button>
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </form>
  );
}