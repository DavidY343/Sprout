import { useState } from 'react';
import { AssetCreate } from '../../types/asset';
import { createAsset } from '../../services/assetService';

interface AssetCreationFormProps {
  onSuccess?: (asset: any) => void;
  onCancel?: () => void;
  defaultCurrency?: string;
  setToast?: (toast: {message: string, type: 'error' | 'success'}) => void;
}

export default function AssetCreationForm({ 
  onSuccess, 
  onCancel,
  defaultCurrency = 'EUR',
  setToast
}: AssetCreationFormProps) {
  const [newAsset, setNewAsset] = useState<AssetCreate>({
    name: '',
    currency: defaultCurrency,
    type: 'stock'
  });
  const [loading, setLoading] = useState(false);

  const handleCreateAsset = async () => {
    if (!newAsset.name.trim()) {
      if (setToast) {
        setToast({ message: 'El nombre del activo es requerido', type: 'error' });
      }
      return;
    }
    
    try {
      setLoading(true);
      const createdAsset = await createAsset(newAsset);
      
      setNewAsset({
        name: '',
        currency: defaultCurrency,
        type: 'stock'
      });
      
      if (onSuccess) onSuccess(createdAsset);
      
      if (setToast) {
        setToast({ message: 'Activo creado exitosamente', type: 'success' });
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      if (setToast) {
        setToast({ message: 'Error al crear el activo', type: 'error' });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-3">
      <h3 className="text-lg font-medium text-white">Nuevo Activo</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Nombre del activo*"
          value={newAsset.name}
          onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        />
        <input
          type="text"
          placeholder="Ticker (opcional)"
          value={newAsset.ticker || ''}
          onChange={(e) => setNewAsset(prev => ({ ...prev, ticker: e.target.value }))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        />
        <input
          type="text"
          placeholder="ISIN (opcional)"
          value={newAsset.isin || ''}
          onChange={(e) => setNewAsset(prev => ({ ...prev, isin: e.target.value }))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        />
        <select
          value={newAsset.currency}
          onChange={(e) => setNewAsset(prev => ({ ...prev, currency: e.target.value }))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
          <option value="JPY">JPY</option>
          <option value="CHF">CHF</option>
          <option value="CAD">CAD</option>
          <option value="AUD">AUD</option>
          <option value="CNY">CNY</option>
        </select>
        <select
          value={newAsset.type}
          onChange={(e) => setNewAsset(prev => ({ ...prev, type: e.target.value }))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          <optgroup label="Activos Financieros Tradicionales">
            <option value="stock">Stock (Acciones)</option>
            <option value="bond">Bond (Bonos)</option>
            <option value="etf">ETF (Fondo Cotizado)</option>
            <option value="fund">Fondo Indexado</option>
            <option value="reit">REIT (Bienes Raíces)</option>
          </optgroup>
          
          <optgroup label="Activos Digitales">
            <option value="crypto">Crypto (Criptomoneda)</option>
          </optgroup>
          
          <optgroup label="Activos Reales/Tangibles">
            <option value="real_estate">Real Estate (Propiedad)</option>
            <option value="commodity">Commodity (Materia Prima Física)</option>
            <option value="collectible">Collectible (Coleccionable)</option>
          </optgroup>
          
          <optgroup label="Activos de Liquidez y Alternativos">
            <option value="cash">Cash (Efectivo/Depósitos)</option>
            <option value="private">Private (Inversiones Privadas)</option>
            <option value="derivative">Derivative (Opciones/Futuros)</option>
          </optgroup>
        </select>
        <input
          type="text"
          placeholder="Theme (opcional)"
          value={newAsset.theme || ''}
          onChange={(e) => setNewAsset(prev => ({ ...prev, theme: e.target.value }))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        />
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
          onClick={handleCreateAsset}
          disabled={loading || !newAsset.name.trim()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Creando...' : 'Crear Activo'}
        </button>
      </div>
    </div>
  );
}