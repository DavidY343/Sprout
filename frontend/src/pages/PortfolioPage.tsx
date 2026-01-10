import { useEffect, useState } from 'react'
import KPICard from '../components/KPICard'
import { getAccountsWithBalance } from '../services/accountService'
import { AccountWithBalance } from '../types/account'
import { PieChart, TrendingUp, Wallet } from 'lucide-react'



export default function PortfolioPage() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userId = 1 // temporal

  useEffect(() => {
    getAccountsWithBalance(userId)
      .then(setAccounts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p>Cargando datos...</p>
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>
  }

  const totalPortfolio = accounts.reduce(
    (sum, acc) => sum + acc.total_value,
    0
  )

  const totalInvested = accounts.reduce(
    (sum, acc) => sum + acc.invested_value,
    0
  )

  const totalCash = accounts.reduce(
    (sum, acc) => sum + acc.cash_balance,
    0
  )

  // Calcular rendimiento (ejemplo)
  const monthlyPerformance = 3.34
  const ytdPerformance = 0.69
  const totalPerformance = 7.63

  return (
    <div className="space-y-8">
      <div className="
      space-y-8
      relative rounded-2xl p-8
      bg-gradient-to-br from-[#15102a] to-[#0f0a20]  /* Más oscuro */
      border border-purple-500/40  /* Borde muy sutil */
      shadow-lg
      before:absolute before:inset-0 before:rounded-2xl before:p-[1px]  /* Línea muy fina */
      before:bg-gradient-to-r 
      before:from-purple-600/60 before:to-violet-600/60  /* Colores tenues con transparencia */
      before:-z-10
      after:absolute after:inset-0 after:rounded-2xl after:m-[0.5px]
      after:bg-gradient-to-br after:from-[#15102a] after:to-[#0f0a20]
      after:-z-20
    ">
      <div className="absolute top-0 left-1/4 w-32 h-32 -translate-y-16 
        bg-purple-600/20 rounded-full blur-2xl -z-10"></div>
      <div className="absolute bottom-0 right-1/4 w-32 h-32 translate-y-16 
        bg-violet-600/20 rounded-full blur-2xl -z-10"></div>

        {/* MAIN KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="Total Portfolio"
            value={`€ ${totalPortfolio.toFixed(2)}`}
            icon={<Wallet className="w-8 h-8" />}
            
          />
          <KPICard
            title="Total Invertido"
            value={`€ ${totalInvested.toFixed(2)}`}
            icon={<TrendingUp className="w-8 h-8" />}
          />
          <KPICard
            title="Efectivo"
            value={`€ ${totalCash.toFixed(2)}`}
            icon={<PieChart className="w-8 h-8" />}
          />
        </div>
        {/* Performance KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard 
            title="1 Mes" 
            value={`${monthlyPerformance > 0 ? '+' : ''}${monthlyPerformance.toFixed(2)}%`}
            subtitle={`€ ${(monthlyPerformance * totalInvested / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            positive={monthlyPerformance > 0}
          />
          <KPICard title="3 Meses" value="-" />
          <KPICard 
            title="YTD" 
            value={`${ytdPerformance > 0 ? '+' : ''}${ytdPerformance.toFixed(2)}%`}
            subtitle={`€ ${(ytdPerformance * totalInvested / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            positive={ytdPerformance > 0}
          />
          <KPICard 
            title="Total" 
            value={`${totalPerformance > 0 ? '+' : ''}${totalPerformance.toFixed(2)}%`}
            subtitle={`€ ${(totalPerformance * totalInvested / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            positive={totalPerformance > 0}
          />
        </div>
      </div>
      {/* Donuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 rounded-xl bg-[#11162A]/50 border border-white/10 flex items-center justify-center">
          Donut izquierda (allocation)
        </div>
        <div className="h-64 rounded-xl bg-[#11162A]/50 border border-white/10 flex items-center justify-center">
          Donut derecha (allocation)
        </div>
      </div>


      {/* Line chart */}
      <div className="h-80 rounded-xl bg-[#11162A] border border-white/10 flex items-center justify-center">
        Gráfico de rentabilidad temporal
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-[#11162A] border border-white/10 p-6">
        <p className="font-bold mb-4 text-white">Detalle por activo</p>
        <p className="text-sm text-gray-400">Tabla en construcción</p>
      </div>

    </div>
  )
}
