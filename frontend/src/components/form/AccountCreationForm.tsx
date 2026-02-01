import { useState } from 'react';
import { AccountCreate } from '../../types/account';
import { createAccount } from '../../services/accountService';

interface AccountCreationFormProps {
  onSuccess?: (account: any) => void;
  onCancel?: () => void;
  defaultCurrency?: string;
  setToast?: (toast: {message: string, type: 'error' | 'success'}) => void; // Nuevo prop
}

export default function AccountCreationForm({ 
  onSuccess, 
  onCancel,
  defaultCurrency = 'EUR',
  setToast
}: AccountCreationFormProps) {
  const [newAccount, setNewAccount] = useState<AccountCreate>({
    name: '',
    type: 'broker',
    currency: defaultCurrency
  });
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    if (!newAccount.name.trim()) {
      if (setToast) {
        setToast({ message: 'El nombre de la cuenta es requerido', type: 'error' });
      }
      return;
    }
    
    try {
      setLoading(true);
      const createdAccount = await createAccount(newAccount);
      
      setNewAccount({
        name: '',
        type: 'broker',
        currency: defaultCurrency
      });
      
      if (onSuccess) onSuccess(createdAccount);
      
      if (setToast) {
        setToast({ message: 'Cuenta creada exitosamente', type: 'success' });
      }
    } catch (error) {
      console.error('Error creating account:', error);
      if (setToast) {
        setToast({ message: 'Error al crear la cuenta', type: 'error' });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-3">
      <h3 className="text-lg font-medium text-white">Nueva Cuenta</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Nombre de la cuenta*"
          value={newAccount.name}
          onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        />
        <select
        value={newAccount.type}
        onChange={(e) => setNewAccount(prev => ({ ...prev, type: e.target.value }))}
        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
        <option value="neobroker">Neobroker (Trade Republic, Scalable)</option>
        <option value="broker">Broker Tradicional (Interactive Brokers, Saxo)</option>
        <option value="online_bank">Banco Digital (MyInvestor, Openbank)</option>
        <option value="bank">Banco Tradicional (BBVA, Santander)</option>
        <option value="crypto">Exchange Cripto (Binance, Coinbase)</option>
        <option value="other">Otro</option>
        </select>
        <select
          value={newAccount.currency}
          onChange={(e) => setNewAccount(prev => ({ ...prev, currency: e.target.value }))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
          <option value="JPY">JPY</option>
          <option value="CHF">CHF</option>
          <option value="CAD">CAD</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={handleCreateAccount}
          disabled={loading || !newAccount.name.trim()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Creando...' : 'Crear Cuenta'}
        </button>
      </div>
    </div>
  );
}