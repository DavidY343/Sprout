import { useState, useEffect } from 'react'
import { Transaction } from '../types/transaction'
import { getTransactions } from '../services/transactionService'
import { getUserAccounts } from '../services/accountService'
import { Account } from '../types/account'
import { Plus } from 'lucide-react'
import AddTransactionForm from '../components/form/AddTransactionForm'
import { layout, surface, table } from '../styles/theme'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Filter and sort states
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('date_desc')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    fetchHistory()
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const data = await getUserAccounts()
      setAccounts(data)
    } catch { /* */ }
  }

  const fetchHistory = async () => {
    setLoading(true)
    try { setTransactions(await getTransactions()) }
    catch { /* */ }
    finally { setLoading(false) }
  }

  const handleClearFilters = () => {
    setSelectedAccount('all')
    setStartDate('')
    setEndDate('')
    setSortBy('date_desc')
    setSearchQuery('')
  }

  const filteredTransactions = transactions
    .filter(t => {
      if (selectedAccount !== 'all' && t.account_name !== selectedAccount) {
        return false
      }
      if (startDate) {
        const txDate = new Date(t.date).toISOString().split('T')[0]
        if (txDate < startDate) return false
      }
      if (endDate) {
        const txDate = new Date(t.date).toISOString().split('T')[0]
        if (txDate > endDate) return false
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchDesc = t.description?.toLowerCase().includes(query)
        const matchCat = t.category?.toLowerCase().includes(query)
        const matchAccount = t.account_name?.toLowerCase().includes(query)
        if (!matchDesc && !matchCat && !matchAccount) return false
      }
      return true
    })
    .sort((a, b) => {
      const valA = a.amount
      const valB = b.amount
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

  if (loading) return <div className="flex justify-center p-20 text-[var(--text-muted)]">Cargando...</div>

  return (
    <div className={layout.pageStack}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Balances</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="p-2 rounded-lg bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--bg-surface-alt)] transition cursor-pointer">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Form colapsable */}
      {showForm && (
        <AddTransactionForm onSuccess={() => { fetchHistory(); setShowForm(false) }} />
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
            placeholder="Buscar por descripción, categoría..."
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
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)]">Sin movimientos</div>
        ) : (
          <table className={table.wrapper}>
            <thead className={table.headRow}>
              <tr>
                <th className={table.headCell}>Fecha</th>
                <th className={table.headCell}>Cuenta</th>
                <th className={table.headCell}>Descripción</th>
                <th className={table.headCell + ' text-right'}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => (
                <tr key={t.transaction_id} className={table.bodyRow}>
                  <td className={table.cell + ' text-sm text-[var(--text-muted)]'}>{new Date(t.date).toLocaleDateString('es-ES')}</td>
                  <td className={table.cell + ' text-sm text-[var(--text-secondary)]'}>{t.account_name}</td>
                  <td className={table.cell + ' text-sm text-[var(--text-primary)]'}>{t.description || t.category}</td>
                  <td className={table.cell + ' text-right'}>
                    <span className={`text-sm font-mono font-semibold ${t.type === 'income' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                      {t.type === 'income' ? '+' : '-'}€{t.amount.toLocaleString('es-ES')}
                    </span>
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