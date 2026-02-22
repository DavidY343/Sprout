import { useState, useEffect } from 'react';
import { Plus, Loader2, Calendar, CreditCard } from 'lucide-react';
import { createTransaction } from '../../services/transactionService';
import { getUserAccounts } from '../../services/accountService';
import { Account } from '../../types/account';
import { TransactionCreate } from '../../types/transaction';
import Toast from '../Toast';

export default function AddTransactionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  const [formData, setFormData] = useState<TransactionCreate>({
    account_id: 0,
    category: 'Depósito',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    type: 'income',
    description: ''
  });

  useEffect(() => {
    getUserAccounts().then(data => {
      setAccounts(data);
      if (data.length > 0) setFormData(prev => ({ ...prev, account_id: data[0].account_id }));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || formData.amount <= 0) {
      setToast({ message: 'Datos incompletos', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      await createTransaction(formData);
      setToast({ message: 'Transacción registrada', type: 'success' });
      setFormData({ ...formData, amount: 0, description: '' });
      setTimeout(() => {if (onSuccess) onSuccess()}, 1000);
    } catch (error) {
      setToast({ message: 'Error al registrar', type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-xl bg-[#11162A] border border-white/10 p-6">
      <h2 className="text-xl font-semibold mb-4">Registrar Movimiento</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Cuenta */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Cuenta</label>
            <select 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
              value={formData.account_id}
              onChange={e => setFormData({...formData, account_id: Number(e.target.value)})}
            >
              {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.name}</option>)}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Tipo</label>
            <div className="flex gap-2 bg-gray-800 p-1 rounded-lg border border-gray-700">
              <button type="button" onClick={() => setFormData({...formData, type: 'income'})}
                className={`flex-1 py-1 rounded transition-colors ${formData.type === 'income' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>Ingreso</button>
              <button type="button" onClick={() => setFormData({...formData, type: 'expense'})}
                className={`flex-1 py-1 rounded transition-colors ${formData.type === 'expense' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>Gasto</button>
            </div>
          </div>

          {/* Fecha (NUEVO) */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Fecha</label>
            <div className="relative">
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white [color-scheme:dark]"
              />
              <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Monto (€)</label>
            <input type="number" step="any" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
              value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Descripción */}
          <div className="md:col-span-3">
            <label className="block text-sm text-gray-400 mb-2">Descripción / Categoría</label>
            <input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white" placeholder="Ej: Ingreso ahorro mensual"
              value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          {/* Botón Guardar */}
          <div className="flex items-end">
            <button disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 p-2 rounded-lg flex justify-center items-center gap-2 text-white font-medium transition-all disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="animate-spin" /> : <Plus size={18} />} Guardar
            </button>
          </div>
        </div>
      </form>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}