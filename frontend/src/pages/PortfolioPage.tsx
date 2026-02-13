import { useEffect, useState } from 'react'
import KPICard from '../components/KPICard'
import { getAccountsWithBalance } from '../services/accountService'
import { AccountWithBalance } from '../types/account'
import { PieChart, TrendingUp, Wallet } from 'lucide-react'
import AccountsDonut from '../components/donuts/AccountsDonut'
import AccountSelector from '../components/selectors/AccountSelector'
import AssetsDonut from '../components/donuts/AssetsDonut'
import GroupBySelector from '../components/selectors/GroupSelector'
import AssetsTable from '../components/tables/AssetsTable'


export default function PortfolioPage() {

  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<number | 'all'>('all')
  const [selectedAssetAccountId, setSelectedAssetAccountId] = useState<number | 'all'>('all')
  const [groupBy, setGroupBy] = useState<'type' | 'theme' | 'asset'>('type')

  const [loading, setLoading] = useState(true)

  useEffect(() => {
      loadAccounts()
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const data = await getAccountsWithBalance()
      setAccounts(data)
    } catch (error) {
      console.error('Error al obtener cuentas:', error)
      setAccounts([])
    } finally {
      setLoading(false)
    }
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

        {/* Donut izquierda */}
        <div className="rounded-xl bg-[#11162A] border border-white/10 p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Distribución de cuentas
            </h2>
            <div className="flex items-center">
              <AccountSelector
                accounts={accounts}
                selected={selectedAccountId}
                onChange={setSelectedAccountId}
              />
            </div>
          </div>
          <div className="flex justify-center items-center">
            <AccountsDonut
              accounts={accounts}
              selectedAccountId={selectedAccountId}
            />
          </div>
        </div>

        {/* Donut derecha */}
        <div className="rounded-xl bg-[#11162A] border border-white/10 p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Distribución de activos
            </h2>
            <div className="flex items-center gap-4">
              <AccountSelector
                accounts={accounts}
                selected={selectedAssetAccountId}
                onChange={setSelectedAssetAccountId}
              />
              
              <GroupBySelector
                value={groupBy}
                onChange={setGroupBy}
              />
            </div>
          </div>
          <div className="flex justify-center items-center">
            <AssetsDonut
              selectedAccountId={selectedAssetAccountId}
              groupBy={groupBy}
            />
          </div>
        </div>
      </div>
      {/* Line chart */}
      <div className="h-80 rounded-xl bg-[#11162A] border border-white/10 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="text-7xl mb-8">🚧</div>
          <h1 className="text-3xl font-bold mb-4">Grafico de rentabilidad</h1>
          <p className="text-xl text-gray-400">Próximamente disponible</p>
    </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-[#11162A] border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Listado de Activos</h2>
            <p className="text-sm text-gray-400">Detalle individual, pesos de cartera y beneficio acumulado</p>
          </div>
        </div>
        <AssetsTable />
      </div>

    </div>
  )
}
