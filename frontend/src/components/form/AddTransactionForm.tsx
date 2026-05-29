import { useState, useEffect } from 'react';
import { Loader2, Check } from 'lucide-react';
import { createTransaction } from '../../services/transactionService';
import { getUserAccounts } from '../../services/accountService';
import { Account } from '../../types/account';
import { TransactionCreate } from '../../types/transaction';
import Toast from '../Toast';
import { surface } from '../../styles/theme';

export default function AddTransactionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  const [formData, setFormData] = useState<TransactionCreate>({
    account_id: 0, category: 'Depósito',
    date: new Date().toISOString().split('T')[0],
    amount: 0, type: 'income', description: ''
  });

  useEffect(() => {
    getUserAccounts().then(data => {
      setAccounts(data);
      if (data.length > 0) setFormData(p => ({ ...p, account_id: data[0].account_id }));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || formData.amount <= 0) { setToast({ message: 'Datos incompletos', type: 'error' }); return }
    try {
      setLoading(true);
      await createTransaction(formData);
      setToast({ message: 'Hecho', type: 'success' });
      setFormData(p => ({ ...p, amount: 0, description: '' }));
      setTimeout(() => { if (onSuccess) onSuccess() }, 800);
    } catch { setToast({ message: 'Error al registrar', type: 'error' }) }
    finally { setLoading(false) }
  };

  const isIncome = formData.type === 'income';

  return (
    <div className={surface.card}>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        {/* Tipo */}
        <button type="button" onClick={() => setFormData(p => ({ ...p, type: isIncome ? 'expense' : 'income' }))}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${isIncome ? 'bg-[var(--accent-green)]/15 text-[var(--accent-green)] border border-[var(--accent-green)]/30' : 'bg-[var(--accent-red)]/15 text-[var(--accent-red)] border border-[var(--accent-red)]/30'}`}>
          {isIncome ? 'Ingreso' : 'Gasto'}
        </button>

        <span className="text-[var(--text-placeholder)]">de</span>

        {/* Monto */}
        <span className="text-[var(--text-muted)]">€</span>
        <input type="number" min="0" step="any" value={formData.amount || ''}
          onChange={e => setFormData(p => ({ ...p, amount: Number(e.target.value) }))}
          placeholder="0.00"
          className="w-20 bg-transparent border-b border-[var(--border-input)] text-[var(--text-primary)] text-center font-mono focus:outline-none focus:border-[var(--accent-blue)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />

        <span className="text-[var(--text-placeholder)]">en</span>

        {/* Cuenta */}
        <select value={formData.account_id} onChange={e => setFormData(p => ({ ...p, account_id: Number(e.target.value) }))}
          className="bg-transparent border-b border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] cursor-pointer max-w-[140px] truncate">
          {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.name}</option>)}
        </select>

        <span className="text-[var(--text-placeholder)]">el</span>

        {/* Fecha */}
        <input type="date" value={formData.date}
          onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
          className="bg-transparent border-b border-[var(--border-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]" />

        {/* Nota opcional */}
        <input type="text" value={formData.description || ''} placeholder="nota..."
          onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
          className="ml-auto bg-transparent border-b border-[var(--border-input)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)] focus:text-[var(--text-primary)] w-24 placeholder-[var(--border-input)]" />

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="p-2 rounded-lg bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--bg-surface-alt)] transition disabled:opacity-50 cursor-pointer">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
      </form>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}