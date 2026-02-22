import { useState, useEffect } from 'react'
import { Transaction } from '../types/transaction'
import { getTransactions } from '../services/transactionService'
import { Filter, Search, Download, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import KPICard from '../components/KPICard'
import AddTransactionForm from '../components/form/AddTransactionForm'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState({ description: '', type: 'all' })

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const data = await getTransactions()
      setTransactions(data)
    } catch (err) {
      setError('Error al cargar transacciones')
    } finally { setLoading(false) }
  }

  const filtered = transactions.filter(t => {
    const matchDesc = t.description?.toLowerCase().includes(filter.description.toLowerCase()) || true
    const matchType = filter.type === 'all' || t.type === filter.type
    return matchDesc && matchType
  })

  const totalIn = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalOut = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  if (loading) return <div className="flex justify-center p-20 text-gray-400">Cargando caja...</div>

  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl p-8 bg-gradient-to-br from-[#15102a] to-[#0f0a20] border border-purple-500/40 shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">Movimientos de Efectivo</h1>
            <p className="text-gray-400">Gestiona tus entradas y salidas de capital</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard title="Saldo Neto" value={`€ ${(totalIn - totalOut).toLocaleString()}`} icon={<Wallet className="text-purple-400 w-8 h-8" />} />
          <KPICard title="Ingresos" value={`€ ${totalIn.toLocaleString()}`} positive icon={<ArrowUpCircle className="text-green-400 w-8 h-8" />} />
          <KPICard title="Gastos" value={`€ ${totalOut.toLocaleString()}`} positive={false} icon={<ArrowDownCircle className="text-red-400 w-8 h-8" />} />
        </div>
      </div>

      <AddTransactionForm onSuccess={fetchHistory} />

      <div className="rounded-xl bg-[#11162A] border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0B0F1A] border-b border-white/10">
            <tr>
              <th className="text-left p-4 text-gray-400 text-sm uppercase">Fecha</th>
              <th className="text-left p-4 text-gray-400 text-sm uppercase">Categoría</th>
              <th className="text-left p-4 text-gray-400 text-sm uppercase">Descripción</th>
              <th className="text-left p-4 text-gray-400 text-sm uppercase">Tipo</th>
              <th className="text-left p-4 text-gray-400 text-sm uppercase">Monto</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.transaction_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4">{new Date(t.date).toLocaleDateString()}</td>
                <td className="p-4"><span className="px-2 py-1 bg-gray-800 rounded text-xs">{t.category}</span></td>
                <td className="p-4 text-gray-300">{t.description || '-'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'income' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                    {t.type === 'income' ? 'INGRESO' : 'GASTO'}
                  </span>
                </td>
                <td className="p-4 font-bold">€ {t.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}