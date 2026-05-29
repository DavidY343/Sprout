import { useState, useEffect } from 'react'
import { Transaction } from '../types/transaction'
import { getTransactions } from '../services/transactionService'
import { Plus } from 'lucide-react'
import AddTransactionForm from '../components/form/AddTransactionForm'
import { layout, surface, table } from '../styles/theme'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try { setTransactions(await getTransactions()) }
    catch { /* */ }
    finally { setLoading(false) }
  }

  if (loading) return <div className="flex justify-center p-20 text-[#8B8578]">Cargando...</div>

  return (
    <div className={layout.pageStack}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#2C2C2C]">Cash Flow</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="p-2 rounded-lg bg-[#2C2C2C] hover:bg-[#3D3D3D] text-[#FAF7F0] transition cursor-pointer">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Form colapsable */}
      {showForm && (
        <AddTransactionForm onSuccess={() => { fetchHistory(); setShowForm(false) }} />
      )}

      {/* Tabla */}
      <div className={surface.tableContainer}>
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-[#8B8578]">Sin movimientos</div>
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
              {transactions.map(t => (
                <tr key={t.transaction_id} className={table.bodyRow}>
                  <td className={table.cell + ' text-sm text-[#8B8578]'}>{new Date(t.date).toLocaleDateString('es-ES')}</td>
                  <td className={table.cell + ' text-sm text-[#5A5549]'}>{t.account_name}</td>
                  <td className={table.cell + ' text-sm text-[#2C2C2C]'}>{t.description || t.category}</td>
                  <td className={table.cell + ' text-right'}>
                    <span className={`text-sm font-mono font-semibold ${t.type === 'income' ? 'text-[#6B8F71]' : 'text-[#C25B3F]'}`}>
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