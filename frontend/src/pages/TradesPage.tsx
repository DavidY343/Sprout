import { useState, useEffect } from 'react'
import { TradeHistory } from '../types/trade'
import { getTradeHistory } from '../services/tradeService'
import { Filter, Search, Download } from 'lucide-react'
import { Wallet, TrendingUp, PieChart } from 'lucide-react'
import KPICard from '../components/KPICard'
import AddTradeForm from '../components/form/AddTradeForm';

export default function TradesPage() {
  const [trades, setTrades] = useState<TradeHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState({
    ticker: '',
    account: '',
    operationType: 'all'
  })

  useEffect(() => {
    fetchTradeHistory()
  }, [])

  const fetchTradeHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTradeHistory()
      setTrades(data)
    } catch (err) {
      setError('Error al cargar el historial de operaciones')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar trades
  const filteredTrades = trades.filter(trade => {
    if (filter.ticker && trade.asset_name) {
        if (!trade.asset_name.toLowerCase().includes(filter.ticker.toLowerCase())) {
          return false
        }
      }
    
    if (filter.account && trade.account_name) {
      if (!trade.account_name.toLowerCase().includes(filter.account.toLowerCase())) {
        return false
      }
    }
    
    if (filter.operationType !== 'all' && trade.operation_type !== filter.operationType) {
      return false
    }
    
    return true
  })

  // Calcular métricas
  const totalBuys = filteredTrades.filter(t => t.operation_type === 'buy').length
  const totalSells = filteredTrades.filter(t => t.operation_type === 'sell').length
  const totalAmount = filteredTrades.reduce((sum, trade) => 
    sum + (trade.quantity * trade.price), 0
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-xl text-gray-400">Cargando operaciones...</div>
      </div>
    )
  }

  const handleExport = () => {
  if (filteredTrades.length === 0) return;

  // 1. Definir cabeceras
  const headers = ["Fecha,Ticker,Activo,Cantidad,Precio,Tipo,Cuenta,Total"];
  
  // 2. Formatear las filas
  const rows = filteredTrades.map(t => [
    new Date(t.date).toISOString(),
    t.ticker || t.isin ||'N/A',
    t.asset_name,
    t.quantity,
    t.price,
    t.operation_type,
    t.account_name,
    (t.quantity * t.price).toFixed(2)
  ].join(","));

  // 3. Crear el Blob y descargar
  const csvContent = headers.concat(rows).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", `trades_${new Date().getTime()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  return (
    <div className="space-y-8">
      {/* Header con gradiente */}
      <div className="
        space-y-8
        relative rounded-2xl p-8
        bg-gradient-to-br from-[#15102a] to-[#0f0a20]
        border border-purple-500/40
        shadow-lg
        before:absolute before:inset-0 before:rounded-2xl before:p-[1px]
        before:bg-gradient-to-r before:from-purple-600/60 before:to-violet-600/60
        before:-z-10
        after:absolute after:inset-0 after:rounded-2xl after:m-[0.5px]
        after:bg-gradient-to-br after:from-[#15102a] after:to-[#0f0a20]
        after:-z-20
      ">
        <div className="absolute top-0 left-1/4 w-32 h-32 -translate-y-16 bg-purple-600/20 rounded-full blur-2xl -z-10"></div>
        <div className="absolute bottom-0 right-1/4 w-32 h-32 translate-y-16 bg-violet-600/20 rounded-full blur-2xl -z-10"></div>

        {/* Título y Botón Exportar */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Historial de Operaciones</h1>
            <p className="text-gray-400">Control detallado de tus movimientos</p>
          </div>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 
              border border-purple-500/30 rounded-lg transition-all hover:border-purple-400/50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard
            title="Volumen Total"
            value={`€ ${totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
            icon={<Wallet className="text-purple-400 w-8 h-8" />}
          />
          <KPICard 
            title="Trades" 
            value={filteredTrades.length.toString()} 
          />
          <KPICard
            title="Compras"
            value={totalBuys.toString()}
            positive={true}
            icon={<TrendingUp className="text-green-400 w-8 h-8" />}
          />
          <KPICard
            title="Ventas"
            value={totalSells.toString()}
            positive={false} // Se verá rojo
            icon={<PieChart className="text-red-400 w-8 h-8" />}
          />
        </div>
      </div>
      <AddTradeForm 
        onSuccess={() => {
          fetchTradeHistory();
        }}
      />
      {/* Filtros */}
      <div className="rounded-xl bg-[#11162A] border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-semibold">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-base text-gray-400 mb-3 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Activo
            </label>
            <input
              type="text"
              placeholder="Apple Inc., Bitcoin..."
              className="w-full px-4 py-3 bg-[#0B0F1A] border border-white/10 
                rounded-lg focus:outline-none focus:border-purple-500 
                focus:ring-1 focus:ring-purple-500/30 transition-colors"
              value={filter.ticker}
              onChange={(e) => setFilter(prev => ({ ...prev, ticker: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-base text-gray-400 mb-3">Cuenta</label>
            <input
              type="text"
              placeholder="Broker Principal, Wallet Cripto..."
              className="w-full px-4 py-3 bg-[#0B0F1A] border border-white/10 
                rounded-lg focus:outline-none focus:border-purple-500 
                focus:ring-1 focus:ring-purple-500/30 transition-colors"
              value={filter.account}
              onChange={(e) => setFilter(prev => ({ ...prev, account: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-base text-gray-400 mb-3">Tipo de Operación</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter(prev => ({ ...prev, operationType: 'all' }))}
                className={`px-4 py-2 rounded-lg transition-all flex-1 ${
                  filter.operationType === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#0B0F1A] border border-white/10 hover:border-white/20'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter(prev => ({ ...prev, operationType: 'buy' }))}
                className={`px-4 py-2 rounded-lg transition-all flex-1 ${
                  filter.operationType === 'buy'
                    ? 'bg-green-600/30 text-green-400 border border-green-500/30'
                    : 'bg-[#0B0F1A] border border-white/10 hover:border-green-500/20 text-gray-400'
                }`}
              >
                Compras
              </button>
              <button
                onClick={() => setFilter(prev => ({ ...prev, operationType: 'sell' }))}
                className={`px-4 py-2 rounded-lg transition-all flex-1 ${
                  filter.operationType === 'sell'
                    ? 'bg-red-600/30 text-red-400 border border-red-500/30'
                    : 'bg-[#0B0F1A] border border-white/10 hover:border-red-500/20 text-gray-400'
                }`}
              >
                Ventas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de operaciones */}
      <div className="rounded-xl bg-[#11162A] border border-white/10 overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 inline-block">
              <div className="text-red-400 mb-2">❌ {error}</div>
              <button 
                onClick={fetchTradeHistory}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-lg mb-4">
              {trades.length === 0 
                ? 'No hay operaciones registradas' 
                : 'No se encontraron operaciones con los filtros aplicados'}
            </div>
            {trades.length > 0 && (
              <button
                onClick={() => setFilter({ ticker: '', account: '', operationType: 'all' })}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 
                  border border-purple-500/30 rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0B0F1A] border-b border-white/10">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Fecha</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Ticker/ISIN</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Activo</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Cantidad</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Precio</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Tipo</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Cuenta</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map((trade, index) => (
                    <tr 
                      key={index}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors
                        ${index % 2 === 0 ? 'bg-[#11162A]/50' : ''}`}
                    >
                      <td className="p-4">
                        <div className="font-medium">
                          {new Date(trade.date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(trade.date).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={` px-3 py-1 rounded-lg inline-block
                          ${(trade.ticker || trade.isin) 
                            ? 'bg-purple-600/10 text-purple-300 border border-purple-500/20' 
                            : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                          }`}>
                          {trade.ticker || trade.isin || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{trade.asset_name}</div>
                        <div className="text-sm text-gray-500">{trade.currency}</div>
                      </td>
                      <td className="p-4  font-medium">
                        {trade.quantity.toFixed(6)}
                      </td>
                      <td className="p-4 ">
                        {trade.price.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6
                        })}
                      </td>
                      <td className="p-4">
                        <span className={`w-22 justify-center px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-1.5
                          ${trade.operation_type === 'buy' 
                            ? 'bg-green-600/15 text-green-400 border border-green-500/30' 
                            : 'bg-red-600/15 text-red-400 border border-red-500/30'
                          }`}>
                          {trade.operation_type === 'buy' ? 'COMPRA' : 'VENTA '}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-300">{trade.account_name}</div>
                      </td>
                      <td className="p-4">
                        <div className=" font-bold text-lg">
                          € {(trade.quantity * trade.price).toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                        {trade.fees > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Comisiones: € {trade.fees.toFixed(2)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Footer info */}
      <div className="text-center text-gray-500 text-sm">
        Las operaciones se actualizan automáticamente. Última actualización: {new Date().toLocaleDateString('es-ES')}
      </div>
    </div>
  )
}