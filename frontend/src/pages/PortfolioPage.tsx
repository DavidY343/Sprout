import { useEffect, useState } from 'react'
import KPICard from '../components/KPICard'
import { getAccountsWithBalance } from '../services/accountService'
import { AccountWithBalance } from '../types/account'
import { PieChart, TrendingUp, Wallet } from 'lucide-react'
import AccountsDonut from '../components/donuts/AccountsDonut'
import AssetsDonut from '../components/donuts/AssetsDonut'
import GroupBySelector from '../components/selectors/GroupSelector'
import AssetsTable from '../components/tables/AssetsTable'
import AssetsTreemap from '../components/AssetTreemap'
import PortfolioHistoryChart from '../components/PortfolioHistoryChart'
import { getPerformanceMetrics } from '../services/performanceService'
import { PerformanceResponse } from '../types/performance'
import { layout, surface, text, button } from '../styles/theme'

export default function PortfolioPage() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [activeTab, setActiveTab] = useState<number | 'global'>('global')
  const [groupBy, setGroupBy] = useState<'type' | 'theme' | 'asset'>('type')
  const [metrics, setMetrics] = useState<PerformanceResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAccounts() }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const data = await getAccountsWithBalance()
      setAccounts(data)
      const metricsData = await getPerformanceMetrics()
      setMetrics(metricsData)
    } catch {
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  // Derived values for KPI
  const filteredAccounts = activeTab === 'global' ? accounts : accounts.filter(a => a.account_id === activeTab)
  
  const totalPortfolio = filteredAccounts.reduce((s, a) => s + a.total_value, 0)
  const totalInvested = filteredAccounts.reduce((s, a) => s + a.invested_value, 0)
  const totalCash = filteredAccounts.reduce((s, a) => s + a.cash_balance, 0)
  
  // NOTE: Performance metrics in backend currently return global data. 
  // If activeTab is not global, we show 0 or an indicator that it's not filtered, 
  // until backend supports account_id filtering. For now we show global metrics if 'global' 
  // and zeroed if specific account to avoid misleading data.
  const monthlyPerformance = activeTab === 'global' ? metrics?.month?.pct || 0 : 0
  const ytdPerformance = activeTab === 'global' ? metrics?.ytd?.pct || 0 : 0
  const totalPerformance = activeTab === 'global' ? metrics?.total?.pct || 0 : 0
  const threeMonthsPerformance = activeTab === 'global' ? metrics?.three_months?.pct || 0 : 0

  if (loading) return <div className="p-12 text-center text-[var(--text-muted)] italic animate-pulse">Cargando dashboard...</div>

  return (
    <div className="relative">
      <div className="flex p-1 bg-[var(--bg-surface-alt)] rounded-lg border border-[var(--border)] self-start mb-6 inline-flex overflow-x-auto max-w-full">
        <button onClick={() => setActiveTab('global')}
          className={activeTab === 'global' ? button.tabActive : button.tabInactive}>Vista Global</button>
        {accounts.map(acc => (
          <button key={acc.account_id} onClick={() => setActiveTab(acc.account_id)}
            className={activeTab === acc.account_id ? button.tabActive : button.tabInactive}>{acc.name}</button>
        ))}
      </div>

      <div className={layout.pageStack}>
        {/* ============ RESUMEN ============ */}
        <div data-tour="view-resumen" className={`${layout.pageStack} ${surface.heroPanel}`}>
          <div className={layout.gridKpi3}>
            <KPICard title="Total Portfolio" value={`€ ${totalPortfolio.toFixed(2)}`} icon={<Wallet className="w-8 h-8" />} />
            <KPICard title="Total Invertido" value={`€ ${totalInvested.toFixed(2)}`} icon={<TrendingUp className="w-8 h-8" />} />
            <KPICard title="Efectivo" value={`€ ${totalCash.toFixed(2)}`} icon={<PieChart className="w-8 h-8" />} />
          </div>
          {activeTab === 'global' && (
            <div className={layout.gridKpi4}>
              <KPICard title="1 Mes" value={`${monthlyPerformance > 0 ? '+' : ''}${monthlyPerformance.toFixed(2)}%`} positive={monthlyPerformance > 0} />
              <KPICard title="3 Meses" value={`${threeMonthsPerformance > 0 ? '+' : ''}${threeMonthsPerformance.toFixed(2)}%`} positive={threeMonthsPerformance > 0} />
              <KPICard title="YTD" value={`${ytdPerformance > 0 ? '+' : ''}${ytdPerformance.toFixed(2)}%`} positive={ytdPerformance > 0} />
              <KPICard title="Total" value={`${totalPerformance > 0 ? '+' : ''}${totalPerformance.toFixed(2)}%`} positive={totalPerformance > 0} />
            </div>
          )}
        </div>

        {/* History chart */}
        <div className={surface.card}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className={text.sectionTitle}>Evolución del Patrimonio</h2>
              <p className={text.sectionDesc}>Valor total de la cartera en el tiempo</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <PortfolioHistoryChart accountId={activeTab === 'global' ? 'all' : activeTab} />
          </div>
        </div>

        {/* ============ DISTRIBUCIÓN ============ */}
        <div data-tour="view-distribucion" className={layout.grid2}>
          <div className={surface.cardSm}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={text.sectionTitle}>{activeTab === 'global' ? 'Distribución de cuentas' : 'Distribución de cuenta'}</h2>
            </div>
            <div className="flex justify-center items-center">
              <AccountsDonut accounts={accounts} selectedAccountId={activeTab === 'global' ? 'all' : activeTab} />
            </div>
          </div>
          <div className={surface.cardSm}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={text.sectionTitle}>Distribución de activos</h2>
              <div className="flex items-center gap-4">
                <GroupBySelector value={groupBy} onChange={setGroupBy} />
              </div>
            </div>
            <div className="flex justify-center items-center">
              <AssetsDonut selectedAccountId={activeTab === 'global' ? 'all' : activeTab} groupBy={groupBy} />
            </div>
          </div>
        </div>

        {/* ============ MAPA ============ */}
        <div data-tour="view-mapa" className={surface.card}>
          <div className="mb-6">
            <h2 className={text.sectionTitle}>Mapa de Activos</h2>
            <p className={text.sectionDesc}>Tamaño por valor total | Color por rendimiento</p>
          </div>
          <AssetsTreemap accountId={activeTab === 'global' ? 'all' : activeTab} />
        </div>

        {/* ============ TABLA DE ACTIVOS ============ */}
        <div className={surface.card}>
          <div className="mb-6">
            <h2 className={text.sectionTitle}>Listado de Activos</h2>
            <p className={text.sectionDesc}>Detalle individual, pesos de cartera y beneficio acumulado</p>
          </div>
          <AssetsTable accountId={activeTab === 'global' ? 'all' : activeTab} />
        </div>

      </div>
    </div>
  )
}
