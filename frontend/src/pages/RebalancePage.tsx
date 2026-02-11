import { useState, useEffect } from 'react'
import { Scale, Save, AlertCircle, Info, Calculator, ArrowRight, Wallet, TrendingUp } from 'lucide-react'
import { RebalanceSetting } from '../types/rebalance'
import { AssetTableRow } from '../types/asset'
import { getRebalanceTable, saveRebalanceSettings } from '../services/rebalanceService'
import { getAllAssets } from '../services/assetService'
import KPICard from '../components/KPICard'
import Toast from '../components/Toast'

export default function RebalancePage() {
  const [rebalanceData, setRebalanceData] = useState<RebalanceSetting[]>([])
  const [portfolioAssets, setPortfolioAssets] = useState<AssetTableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dcaAmount, setDcaAmount] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [settings, assets] = await Promise.all([
        getRebalanceTable(),
        getAllAssets()
      ])
      setRebalanceData(settings)
      setPortfolioAssets(assets)
    } catch (err) {
      setToast({ message: 'Error al cargar datos del portafolio', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // --- LÓGICA DE CÁLCULO ---
  const assetAggregated = portfolioAssets.reduce((acc, curr) => {
    if (!acc[curr.asset_id]) {
      acc[curr.asset_id] = { total_value: 0, name: curr.name, identifier: curr.ticker || curr.isin || 'N/A' }
    }
    acc[curr.asset_id].total_value += curr.total_value
    return acc
  }, {} as Record<number, { total_value: number, name: string, identifier: string }>)

  const totalCurrentValue = Object.values(assetAggregated).reduce((sum, a) => sum + a.total_value, 0)
  const totalFutureValue = totalCurrentValue + dcaAmount

  const handlePercentageChange = (assetId: number, value: string) => {
    const numValue = parseFloat(value) || 0
    setRebalanceData(prev => prev.map(a => 
      a.asset_id === assetId ? { ...a, target_percentage: numValue } : a
    ))
    if (saveSuccess) setSaveSuccess(false)
  }

  const totalTargetPct = rebalanceData.reduce((sum, a) => sum + a.target_percentage, 0)
  const isPercentageValid = Math.abs(totalTargetPct - 100) < 0.01

  const handleSave = async () => {
    if (!isPercentageValid) return
    setIsSaving(true)
    try {
      const payload = rebalanceData.map(({ asset_id, target_percentage }) => ({ asset_id, target_percentage }))
      await saveRebalanceSettings(payload)
      setToast({ message: 'Configuración guardada correctamente', type: 'success' })
    } catch (err) {
      setToast({ message: 'Error al guardar configuración', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-[60vh] text-purple-400">Calculando pesos de cartera...</div>

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      {/* Header con gradiente */}
      <div className="relative rounded-2xl p-8 bg-gradient-to-br from-[#15102a] to-[#0f0a20] border border-purple-500/40 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-1/4 w-32 h-32 -translate-y-16 bg-purple-600/20 rounded-full blur-2xl -z-10"></div>
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Rebalanceo de Cartera</h1>
            <p className="text-gray-400">Distribuye tu capital actual y futuro estratégicamente</p>
          </div>
          <div className="text-right">
             <div className={`text-2xl font-mono font-bold ${isPercentageValid ? 'text-green-400' : 'text-red-400'}`}>
                {totalTargetPct.toFixed(2)}% / 100%
             </div>
             <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Suma Objetivo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard 
            title="Valor Portafolio" 
            value={`€ ${totalCurrentValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`} 
            icon={<Wallet className="text-purple-400" />} 
          />
          {/* KPI 2: Input de DCA */}
          <div className="
              relative rounded-xl p-6
              bg-gradient-to-br from-[#0a0e1f] to-[#070a18]
              border border-white/5
              shadow-2xl
              before:absolute before:inset-0 before:rounded-xl before:p-[1px] 
              before:bg-gradient-to-r 
              before:from-emerald-500/30 before:via-emerald-500/10 before:to-teal-500/30
              before:-z-10
              after:absolute after:inset-0 after:rounded-xl
              after:bg-gradient-to-br after:from-emerald-500/5 after:to-teal-500/3
              after:-z-20
              transition-all duration-300
              hover:shadow-emerald-900/10
            ">
              <div className="relative z-10">
                <p className="text-sm text-gray-400 mb-1">Monto DCA a Invertir</p>
                <div className="flex items-center gap-3">
                  <div className="text-2xl"><TrendingUp className="text-emerald-400" /></div>
                  <div className="flex items-center text-3xl font-bold text-white w-full">
                    <span className="text-emerald-400 mr-1">€</span>
                    <input 
                      type="number" 
                      className="bg-transparent text-white font-bold w-full focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={dcaAmount || ''}
                      placeholder="0.00"
                      onChange={(e) => setDcaAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Brillos decorativos del clon */}
              <div className="absolute top-0 left-0 w-20 h-20 -translate-x-10 -translate-y-10 bg-emerald-500/10 rounded-full blur-xl -z-10"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 translate-x-10 translate-y-10 bg-teal-500/10 rounded-full blur-xl -z-10"></div>
            </div>
          <KPICard 
            title="Total tras DCA" 
            value={`€ ${totalFutureValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
            icon={<Scale className="text-blue-400" />} 
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-[#11162A] border border-white/10 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#0B0F1A] border-b border-white/10 text-gray-400 text-xs uppercase tracking-widest ">
            <tr>
              <th className="p-4">Activo</th>
              <th className="p-4">Ticker / ISIN</th>
              <th className="p-4 text-right">Valor Actual</th>
              <th className="p-4 text-center">Peso Actual</th>
              <th className="p-4 text-center">Peso Objetivo</th>
              <th className="p-4 text-right">Compra Sugerida</th>
            </tr>
          </thead>
          <tbody>
            {rebalanceData.map((asset) => {
              const currentData = assetAggregated[asset.asset_id] || { total_value: 0, identifier: asset.ticker || 'N/A' }
              const currentWeight = totalCurrentValue > 0 ? (currentData.total_value / totalCurrentValue) * 100 : 0
              
              // Cálculo: Cuánto debería tener al final según el % objetivo
              const targetTotalValue = (totalFutureValue * asset.target_percentage) / 100
              // La compra es la diferencia entre lo que debería tener y lo que ya tengo
              const buyAmount = Math.max(0, targetTotalValue - currentData.total_value)

              return (
                <tr key={asset.asset_id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-semibold text-white">{asset.asset_name}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded bg-[#0B0F1A] border border-white/5 text-xs text-gray-400 font-mono">
                      {currentData.identifier}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono">
                    € {currentData.total_value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-gray-500 text-sm">{currentWeight.toFixed(2)}%</span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center items-center gap-2">
                      <input
                        type="number"
                        value={asset.target_percentage}
                        onChange={(e) => handlePercentageChange(asset.asset_id, e.target.value)}
                        className="w-16 px-2 py-1 bg-[#0B0F1A] border border-white/10 rounded text-center text-white focus:border-purple-500 outline-none font-bold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="text-gray-600 text-xs">%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-green-400 font-bold font-mono">
                      € {buyAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      <ArrowRight className="w-3 h-3 opacity-30" />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div className="p-6 bg-[#0B0F1A]/50 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info className="w-4 h-4" />
            <span>La compra sugerida prioriza alcanzar el peso objetivo usando el nuevo capital del DCA.</span>
          </div>
          
          <button
            onClick={handleSave}
            disabled={!isPercentageValid || isSaving}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all
              ${isPercentageValid && !isSaving 
                ? 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/20' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
            `}
          >
            {isSaving ? 'Guardando...' : saveSuccess ? '¡Guardado!' : 'Guardar Estrategia'}
            <Save className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}