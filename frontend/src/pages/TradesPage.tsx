import { useState, useEffect } from 'react'
import { TradeHistory, OperationUpdate } from '../types/trade'
import { getTradeHistory, updateTrade, deleteTrade } from '../services/tradeService'
import { getUserAccounts } from '../services/accountService'
import { Account } from '../types/account'
import { Plus, Check, X, Trash2 } from 'lucide-react'
import AddTradeForm from '../components/form/AddTradeForm'
import { layout, surface, table } from '../styles/theme'

export default function TradesPage() {
  const [trades, setTrades] = useState<TradeHistory[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<OperationUpdate>({})
  const [editError, setEditError] = useState<string | null>(null)

  // Filter and sort states
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('date_desc')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    fetchTradeHistory()
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const data = await getUserAccounts()
      setAccounts(data)
    } catch { /* */ }
  }

  const fetchTradeHistory = async () => {
    setLoading(true)
    try { setTrades(await getTradeHistory()) }
    catch { /* */ }
    finally { setLoading(false) }
  }

  const startEdit = (trade: TradeHistory) => {
    setEditingId(trade.operation_id)
    setEditError(null)
    setEditData({
      date: trade.date.split('T')[0],
      quantity: trade.quantity,
      price: trade.price,
      fees: trade.fees,
      operation_type: trade.operation_type,
    })
  }

  const cancelEdit = () => { setEditingId(null); setEditData({}); setEditError(null) }

  const handleDelete = async (trade: TradeHistory) => {
    if (!confirm(`¿Eliminar operación de ${trade.asset_name}?`)) return
    try {
      await deleteTrade(trade.operation_id)
      await fetchTradeHistory()
    } catch { /* */ }
  }

  const saveEdit = async () => {
    if (!editingId) return
    setEditError(null)
    try {
      await updateTrade(editingId, editData)
      await fetchTradeHistory()
      setEditingId(null); setEditData({})
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al actualizar la operación'
      setEditError(msg)
    }
  }

  const handleClearFilters = () => {
    setSelectedAccount('all')
    setStartDate('')
    setEndDate('')
    setSortBy('date_desc')
    setSearchQuery('')
  }

  const filteredTrades = trades
    .filter(trade => {
      if (selectedAccount !== 'all' && trade.account_name !== selectedAccount) {
        return false
      }
      if (startDate) {
        const tradeDate = new Date(trade.date).toISOString().split('T')[0]
        if (tradeDate < startDate) return false
      }
      if (endDate) {
        const tradeDate = new Date(trade.date).toISOString().split('T')[0]
        if (tradeDate > endDate) return false
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchAsset = trade.asset_name?.toLowerCase().includes(query)
        const matchTicker = trade.ticker?.toLowerCase().includes(query)
        const matchAccount = trade.account_name?.toLowerCase().includes(query)
        if (!matchAsset && !matchTicker && !matchAccount) return false
      }
      return true
    })
    .sort((a, b) => {
      const valA = a.quantity * a.price
      const valB = b.quantity * b.price
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()

      if (sortBy === 'date_desc') {
        return dateB - dateA
      } else if (sortBy === 'date_asc') {
        return dateA - dateB
      } else if (sortBy === 'amount_desc') {
        return valB - valA
      } else if (sortBy === 'amount_asc') {
        return valA - valB
      }
      return 0
    })

  if (loading) return <div className="flex justify-center items-center min-h-[60vh] text-[var(--text-muted)]">Cargando...</div>

  return (
    <div className={layout.pageStack}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Operaciones</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="p-2 rounded-lg bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--bg-surface-alt)] transition cursor-pointer">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Form colapsable */}
      {showForm && (
        <AddTradeForm onSuccess={() => { fetchTradeHistory(); setShowForm(false) }} />
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 bg-[var(--bg-surface-alt)] p-4 rounded-lg border border-[var(--border)] mb-4">
        {/* Cuenta */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">Cuenta</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="bg-[var(--bg-surface)] text-[var(--text-primary)] px-3 py-1.5 rounded-lg border border-[var(--border-input)] text-sm focus:outline-none focus:border-[var(--border-focus)] transition-colors"
          >
            <option value="all">Todas las cuentas</option>
            {accounts.map(acc => (
              <option key={acc.account_id} value={acc.name}>{acc.name}</option>
            ))}
          </select>
        </div>

        {/* Fecha Desde */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[var(--bg-surface)] text-[var(--text-primary)] px-3 py-1.5 rounded-lg border border-[var(--border-input)] text-sm focus:outline-none focus:border-[var(--border-focus)] transition-colors"
          />
        </div>

        {/* Fecha Hasta */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[var(--bg-surface)] text-[var(--text-primary)] px-3 py-1.5 rounded-lg border border-[var(--border-input)] text-sm focus:outline-none focus:border-[var(--border-focus)] transition-colors"
          />
        </div>

        {/* Ordenar por */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">Ordenar por</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[var(--bg-surface)] text-[var(--text-primary)] px-3 py-1.5 rounded-lg border border-[var(--border-input)] text-sm focus:outline-none focus:border-[var(--border-focus)] transition-colors"
          >
            <option value="date_desc">Fecha: Recientes primero</option>
            <option value="date_asc">Fecha: Antiguas primero</option>
            <option value="amount_desc">Importe: Mayor a menor</option>
            <option value="amount_asc">Importe: Menor a mayor</option>
          </select>
        </div>

        {/* Búsqueda */}
        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">Buscar</label>
          <input
            type="text"
            placeholder="Buscar por activo, ticker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[var(--bg-surface)] text-[var(--text-primary)] px-3 py-1.5 rounded-lg border border-[var(--border-input)] text-sm focus:outline-none focus:border-[var(--border-focus)] transition-colors"
          />
        </div>

        {/* Limpiar */}
        <div className="flex items-end h-[50px]">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-xs bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] rounded-lg text-[var(--text-primary)] font-medium transition cursor-pointer"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className={surface.tableContainer}>
        {filteredTrades.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)]">Sin operaciones</div>
        ) : (
          <table className={table.wrapper}>
            <thead className={table.headRow}>
              <tr>
                <th className={table.headCell}>Fecha</th>
                <th className={table.headCell}>Activo</th>
                <th className={table.headCell}>Cuenta</th>
                <th className={table.headCell + ' text-right'}>Cantidad</th>
                <th className={table.headCell + ' text-right'}>Precio</th>
                <th className={table.headCell + ' text-right'}>Total</th>
                <th className={table.headCell + ' w-10'}></th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade) => (
                editingId === trade.operation_id ? (
                  <tr key={trade.operation_id} className={table.bodyRow + ' bg-[var(--bg-surface-alt)]'}>
                    <td className={table.cell}>
                      <input type="date" value={editData.date || ''}
                        onChange={e => setEditData(p => ({ ...p, date: e.target.value }))}
                        className="bg-transparent border-b border-[var(--accent-blue)] text-sm text-[var(--text-primary)] focus:outline-none w-28" />
                    </td>
                    <td className={table.cell}>
                      <button type="button" onClick={() => setEditData(p => ({ ...p, operation_type: p.operation_type === 'buy' ? 'sell' : 'buy' }))}
                        className={`text-sm font-medium cursor-pointer ${editData.operation_type === 'buy' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                        {trade.asset_name}
                      </button>
                    </td>
                    <td className={table.cell + ' text-sm text-[var(--text-muted)]'}>{trade.account_name}</td>
                    <td className={table.cell + ' text-right'}>
                      <input type="number" step="any" value={editData.quantity ?? ''}
                        onChange={e => setEditData(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))}
                        className="w-16 bg-transparent border-b border-[var(--accent-blue)] text-sm text-[var(--text-primary)] font-mono text-right focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    </td>
                    <td className={table.cell + ' text-right'}>
                      <input type="number" step="any" value={editData.price ?? ''}
                        onChange={e => setEditData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                        className="w-20 bg-transparent border-b border-[var(--accent-blue)] text-sm text-[var(--text-primary)] font-mono text-right focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    </td>
                    <td className={table.cell + ' text-right'}>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <button onClick={saveEdit} className="p-1 rounded hover:bg-[var(--accent-green)]/20 text-[var(--accent-green)] cursor-pointer"><Check className="w-4 h-4" /></button>
                          <button onClick={cancelEdit} className="p-1 rounded hover:bg-[var(--accent-red)]/20 text-[var(--accent-red)] cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        {editError && <span className="text-xs text-[var(--accent-red)] max-w-[180px] text-right">{editError}</span>}
                      </div>
                    </td>
                    <td className={table.cell}></td>
                  </tr>
                ) : (
                  <tr key={trade.operation_id} className={table.bodyRow + ' cursor-pointer hover:bg-[var(--bg-surface-alt)]'} onClick={() => startEdit(trade)}>
                    <td className={table.cell + ' text-sm text-[var(--text-muted)]'}>
                      {new Date(trade.date).toLocaleDateString('es-ES')}
                    </td>
                    <td className={table.cell}>
                      <span className={`text-sm font-medium ${trade.operation_type === 'buy' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                        {trade.asset_name}
                      </span>
                      <span className="text-xs text-[var(--text-placeholder)] ml-2">{trade.ticker || ''}</span>
                    </td>
                    <td className={table.cell + ' text-sm text-[var(--text-muted)]'}>{trade.account_name}</td>
                    <td className={table.cell + ' text-right text-sm text-[var(--text-secondary)] font-mono'}>{trade.quantity}</td>
                    <td className={table.cell + ' text-right text-sm text-[var(--text-secondary)] font-mono'}>
                      €{trade.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={table.cell + ' text-right text-sm font-semibold text-[var(--text-primary)] font-mono'}>
                      €{(trade.quantity * trade.price).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={table.cell + ' text-center'}>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(trade) }}
                        className="p-1 rounded hover:bg-[var(--accent-red)]/20 text-[var(--text-muted)] hover:text-[var(--accent-red)] cursor-pointer transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
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