import { useState, useEffect } from 'react'
import { TradeHistory, OperationUpdate } from '../types/trade'
import { getTradeHistory, updateTrade } from '../services/tradeService'
import { Plus, Check, X } from 'lucide-react'
import AddTradeForm from '../components/form/AddTradeForm'
import { layout, surface, table } from '../styles/theme'

export default function TradesPage() {
  const [trades, setTrades] = useState<TradeHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<OperationUpdate>({})

  useEffect(() => { fetchTradeHistory() }, [])

  const fetchTradeHistory = async () => {
    setLoading(true)
    try { setTrades(await getTradeHistory()) }
    catch { /* */ }
    finally { setLoading(false) }
  }

  const startEdit = (trade: TradeHistory) => {
    setEditingId(trade.operation_id)
    setEditData({
      date: trade.date.split('T')[0],
      quantity: trade.quantity,
      price: trade.price,
      fees: trade.fees,
      operation_type: trade.operation_type,
    })
  }

  const cancelEdit = () => { setEditingId(null); setEditData({}) }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      await updateTrade(editingId, editData)
      await fetchTradeHistory()
      setEditingId(null); setEditData({})
    } catch { /* */ }
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
              {trades.map((trade) => (
                editingId === trade.operation_id ? (
                  <tr key={trade.operation_id} className={table.bodyRow + ' bg-[#FAF7F0]'}>
                    <td className={table.cell}>
                      <input type="date" value={editData.date || ''}
                        onChange={e => setEditData(p => ({ ...p, date: e.target.value }))}
                        className="bg-transparent border-b border-[#4A6FA5] text-sm text-[#2C2C2C] focus:outline-none w-28" />
                    </td>
                    <td className={table.cell}>
                      <button type="button" onClick={() => setEditData(p => ({ ...p, operation_type: p.operation_type === 'buy' ? 'sell' : 'buy' }))}
                        className={`text-sm font-medium cursor-pointer ${editData.operation_type === 'buy' ? 'text-[#6B8F71]' : 'text-[#C25B3F]'}`}>
                        {trade.asset_name}
                      </button>
                    </td>
                    <td className={table.cell + ' text-right'}>
                      <input type="number" step="any" value={editData.quantity ?? ''}
                        onChange={e => setEditData(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))}
                        className="w-16 bg-transparent border-b border-[#4A6FA5] text-sm text-[#2C2C2C] font-mono text-right focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    </td>
                    <td className={table.cell + ' text-right'}>
                      <input type="number" step="any" value={editData.price ?? ''}
                        onChange={e => setEditData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                        className="w-20 bg-transparent border-b border-[#4A6FA5] text-sm text-[#2C2C2C] font-mono text-right focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    </td>
                    <td className={table.cell + ' text-right'}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={saveEdit} className="p-1 rounded hover:bg-[#6B8F71]/20 text-[#6B8F71] cursor-pointer"><Check className="w-4 h-4" /></button>
                        <button onClick={cancelEdit} className="p-1 rounded hover:bg-[#C25B3F]/20 text-[#C25B3F] cursor-pointer"><X className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={trade.operation_id} className={table.bodyRow + ' cursor-pointer hover:bg-[#FAF7F0]'} onClick={() => startEdit(trade)}>
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
                )
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}