import { useState, useEffect } from 'react';
import { Plus, Loader2, Calendar } from 'lucide-react';
import { createTrade } from '../../services/tradeService';
import { getUserAssets } from '../../services/assetService';
import { getUserAccounts } from '../../services/accountService';
import { Asset } from '../../types/asset';
import { Account } from '../../types/account';
import { OperationCreate } from '../../types/trade';
import AssetCreationForm from './AssetCreationForm';
import AccountCreationForm from './AccountCreationForm';
import Toast from '../Toast';

interface AddTradeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddTradeForm({ onSuccess, onCancel }: AddTradeFormProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  // Datos del formulario principal
  const [formData, setFormData] = useState<OperationCreate>({
    asset_id: 0,
    account_id: 0,
    date: new Date().toISOString().split('T')[0],
    quantity: 1,
    price: 0,
    fees: 0,
    operation_type: 'buy'
  });

  // Efecto para auto-ocultar toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Cargar datos iniciales
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setLoadingData(true);
      const [userAssets, userAccounts] = await Promise.all([
        getUserAssets(),
        getUserAccounts()
      ]);
      setAssets(userAssets);
      setAccounts(userAccounts);
      
      // Seleccionar el primer asset y cuenta por defecto si existen
      if (userAssets.length > 0) {
        setFormData(prev => ({ ...prev, asset_id: userAssets[0].asset_id }));
      }
      if (userAccounts.length > 0) {
        setFormData(prev => ({ ...prev, account_id: userAccounts[0].account_id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.asset_id || !formData.account_id) {
      setToast({ message: 'Por favor selecciona un activo y una cuenta', type: 'error' });
      return;
    }
    
    if (formData.quantity <= 0 || formData.price <= 0) {
      setToast({ message: 'Cantidad y precio deben ser positivos', type: 'error' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const selectedDate = formData.date;
    
    if (selectedDate > today) {
      setToast({ message: 'La fecha no puede ser futura', type: 'error' });
      return;
    }
    try {
      setLoading(true);
      await createTrade(formData);
      
      // Resetear formulario
      setFormData({
        asset_id: assets.length > 0 ? assets[0].asset_id : 0,
        account_id: accounts.length > 0 ? accounts[0].account_id : 0,
        date: new Date().toISOString().split('T')[0],
        quantity: 1,
        price: 0,
        fees: 0,
        operation_type: 'buy'
      });
      
      // Recargar datos si es necesario
      await loadExistingData();
      
      // Notificar éxito
      if (onSuccess) onSuccess();
      setToast({ message: 'Operación creada', type: 'success' });
    } catch (error) {
      console.error('Error creating trade:', error);
      setToast({ message: 'Error al crear la operación', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssetCreated = (createdAsset: Asset) => {
    setAssets(prev => [...prev, createdAsset]);
    setFormData(prev => ({ ...prev, asset_id: createdAsset.asset_id }));
    setShowAssetForm(false);
    setToast({ message: 'Activo creado', type: 'success' });
  };

  const handleAccountCreated = (createdAccount: Account) => {
    setAccounts(prev => [...prev, createdAccount]);
    setFormData(prev => ({ ...prev, account_id: createdAccount.account_id }));
    setShowAccountForm(false);
    setToast({ message: 'Cuenta creada', type: 'success' });
  };

  if (loadingData) {
    return (
      <div className="rounded-xl bg-[#11162A] border border-white/10 p-6 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#11162A] border border-white/10 p-6 mb-6">
      <h2 className="text-xl font-semibold text-white mb-4">Añadir Nueva Operación</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fila 1: Asset, Cuenta y Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector de Asset */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Activo
            </label>
            <div className="flex gap-2">
              <select
                value={formData.asset_id}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  asset_id: parseInt(e.target.value) 
                }))}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={assets.length === 0}
              >
                {assets.length === 0 ? (
                  <option value="0">No hay activos disponibles</option>
                ) : (
                  <>
                    <option value="0">Seleccionar activo...</option>
                    {assets.map(asset => (
                      <option key={asset.asset_id} value={asset.asset_id}>
                        {asset.name} {asset.ticker ? `(${asset.ticker})` : ''}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <button
                type="button"
                onClick={() => setShowAssetForm(!showAssetForm)}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 text-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Nuevo</span>
              </button>
            </div>
          </div>

          {/* Selector de Cuenta */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cuenta
            </label>
            <div className="flex gap-2">
              <select
                value={formData.account_id}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  account_id: parseInt(e.target.value) 
                }))}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={accounts.length === 0}
              >
                {accounts.length === 0 ? (
                  <option value="0">No hay cuentas disponibles</option>
                ) : (
                  <>
                    <option value="0">Seleccionar cuenta...</option>
                    {accounts.map(account => (
                      <option key={account.account_id} value={account.account_id}>
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </>
                )}
              </select>
              <button
                type="button"
                onClick={() => setShowAccountForm(!showAccountForm)}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 text-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Nueva</span>
              </button>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 cursor-pointer">
              Fecha
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500
                          [color-scheme:dark] appearance-none cursor-pointer"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Formularios para crear nuevos elementos */}
        {showAssetForm && (
          <AssetCreationForm
            onSuccess={handleAssetCreated}
            onCancel={() => setShowAssetForm(false)}
            setToast={setToast} 
          />
        )}

        {showAccountForm && (
          <AccountCreationForm
            onSuccess={handleAccountCreated}
            onCancel={() => setShowAccountForm(false)}
            setToast={setToast} 
          />
        )}

        {/* Fila 2: Tipo de operación y detalles */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Selector de tipo de operación - MEJORADO */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo
            </label>
            <div className="flex border border-gray-700 rounded-lg overflow-hidden bg-gray-800">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, operation_type: 'buy' }))}
                className={`flex-1 py-2 px-3 text-center font-medium transition-colors ${
                  formData.operation_type === 'buy' 
                    ? 'bg-green-600/70 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Compra
              </button>
              <div className="w-px bg-gray-700"></div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, operation_type: 'sell' }))}
                className={`flex-1 py-2 px-3 text-center font-medium transition-colors ${
                  formData.operation_type === 'sell' 
                    ? 'bg-red-600/70 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Venta
              </button>
            </div>
          </div>

          {/* Cantidad */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cantidad
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500
               [&::-webkit-inner-spin-button]:appearance-none
               [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          
          {/* Precio por unidad */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Precio por unidad
            </label>
            <input
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500
               [&::-webkit-inner-spin-button]:appearance-none
               [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          
          {/* Comisiones */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Comisiones
            </label>
            <input
              type="number"
              min="0"
              value={formData.fees || 0}
              onChange={(e) => setFormData(prev => ({ ...prev, fees: parseFloat(e.target.value) }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500
               [&::-webkit-inner-spin-button]:appearance-none
               [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          {/* Botón de guardar */}
          <div className="md:col-span-1 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden md:inline">Guardando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline cursor-pointer">Guardar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      
      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}