import { useState, useEffect } from 'react'
import { TradeHistory } from '../types/trade'
import { getTradeHistory } from '../services/tradeService'
import { Plus } from 'lucide-react'
import AddTradeForm from '../components/form/AddTradeForm'
import { layout, surface, table } from '../styles/theme'

export default function TradesPage() {
  const [trades, setTrades] = useState<TradeHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchTradeHistory() }, [])

  const fetchTradeHistory = async () => {
    setLoading(true)
    try { setTrades(await getTradeHistory()) }
    catch { /* */ }
    finally { setLoading(false) }
  }

  if (loading) return <div className="flex justify-center items-center min-h-[60vh] text-[#8B8578]">Cargando...</div>

  return (
    <div className={layout.pageStack}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#2C2C2C]">Trades</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="p-2 rounded-lg bg-[#2C2C2C] hover:bg-[#3D3D3D] text-[#FAF7F0] transition cursor-pointer">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Form colapsable */}
      {showForm && (
        <AddTradeForm onSuccess={() => { fetchTradeHistory(); setShowForm(false) }} />
      )}

      {/* Tabla */}
      <div className={surface.tableContainer}>
        {trades.length === 0 ? (
          <div className="p-12 text-center text-[#8B8578]">Sin operaciones</div>
        ) : (
          <table className={table.wrapper}>
            <thead className={table.headRow}>
              <tr>
                <th className={table.headCell}>Fecha</th>
                <th className={table.headCell}>Activo</th>
                <th className={table.headCell + ' text-right'}>Cantidad</th>
                <th className={table.headCell + ' text-right'}>Precio</th>
                <th className={table.headCell + ' text-right'}>Total</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, i) => (
                <tr key={i} className={table.bodyRow}>
                  <td className={table.cell + ' text-sm text-[#8B8578]'}>
                    {new Date(trade.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className={table.cell}>
                    <span className={`text-sm font-medium ${trade.operation_type === 'buy' ? 'text-[#6B8F71]' : 'text-[#C25B3F]'}`}>
                      {trade.asset_name}
                    </span>
                    <span className="text-xs text-[#B0A99C] ml-2">{trade.ticker || ''}</span>
                  </td>
                  <td className={table.cell + ' text-right text-sm text-[#5A5549] font-mono'}>{trade.quantity}</td>
                  <td className={table.cell + ' text-right text-sm text-[#5A5549] font-mono'}>
                    €{trade.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={table.cell + ' text-right text-sm font-semibold text-[#2C2C2C] font-mono'}>
                    €{(trade.quantity * trade.price).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}