import { useEffect, useState } from 'react'
import KPICard from '../components/KPICard'
import { getAccountsWithBalance } from '../services/accountService'
import { AccountWithBalance } from '../types/account'
import { PieChart, TrendingUp, Wallet, Menu, X, BarChart3, LayoutGrid } from 'lucide-react'
import AccountsDonut from '../components/donuts/AccountsDonut'
import AccountSelector from '../components/selectors/AccountSelector'
import AssetsDonut from '../components/donuts/AssetsDonut'
import GroupBySelector from '../components/selectors/GroupSelector'
import AssetsTable from '../components/tables/AssetsTable'
import AssetsTreemap from '../components/AssetTreemap'
import PortfolioHistoryChart from '../components/PortfolioHistoryChart'
import { getPerformanceMetrics } from '../services/performanceService'
import { PerformanceResponse } from '../types/performance'
import { layout, surface, glow, text, button } from '../styles/theme'
type View = 'resumen' | 'distribucion' | 'mapa'

const NAV_ITEMS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'resumen', label: 'Resumen', icon: <Wallet className="w-5 h-5" /> },
  { id: 'distribucion', label: 'Distribución', icon: <PieChart className="w-5 h-5" /> },
  { id: 'mapa', label: 'Mapa', icon: <LayoutGrid className="w-5 h-5" /> },
]

interface PortfolioPageProps {
  view: string
  setView: (v: string) => void
}

export default function PortfolioPage({ view, setView }: PortfolioPageProps) {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<number | 'all'>('all')
  const [selectedAssetAccountId, setSelectedAssetAccountId] = useState<number | 'all'>('all')
  const [groupBy, setGroupBy] = useState<'type' | 'theme' | 'asset'>('type')
  const [historyAccountId, setHistoryAccountId] = useState<number | 'all'>('all')
  const [metrics, setMetrics] = useState<PerformanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const totalPortfolio = accounts.reduce((s, a) => s + a.total_value, 0)
  const totalInvested = accounts.reduce((s, a) => s + a.invested_value, 0)
  const totalCash = accounts.reduce((s, a) => s + a.cash_balance, 0)
  const monthlyPerformance = metrics?.month?.pct || 0
  const ytdPerformance = metrics?.ytd?.pct || 0
  const totalPerformance = metrics?.total?.pct || 0
  const threeMonthsPerformance = metrics?.three_months?.pct || 0

  const handleNav = (v: View) => { setView(v); setSidebarOpen(false) }

  return (
    <div className="relative">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar drawer */}
      <div className={`fixed top-0 left-0 h-full w-56 bg-[var(--btn-primary-bg)] border-r border-[var(--btn-primary-hover)] z-50 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--btn-primary-hover)]">
          <span className="text-sm font-semibold text-[var(--bg-surface-alt)] tracking-wide">Dashboard</span>
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-[var(--text-placeholder)] hover:text-[var(--bg-surface-alt)] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition cursor-pointer ${view === item.id ? 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]' : 'text-[var(--text-placeholder)] hover:text-[var(--bg-surface-alt)] hover:bg-[var(--btn-primary-hover)]'}`}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className={layout.pageStack}>
        {/* Hamburger button */}
        <button onClick={() => setSidebarOpen(true)}
          className="self-start p-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-input)] transition cursor-pointer">
          <Menu className="w-5 h-5" />
        </button>

        {/* ============ VIEW: RESUMEN ============ */}
        {view === 'resumen' && (
          <>
            <div className={`${layout.pageStack} ${surface.heroPanel}`}>
              <div className={glow.orbTop}></div>
              <div className={glow.orbBottom}></div>
              <div className={layout.gridKpi3}>
                <KPICard title="Total Portfolio" value={`€ ${totalPortfolio.toFixed(2)}`} icon={<Wallet className="w-8 h-8" />} />
                <KPICard title="Total Invertido" value={`€ ${totalInvested.toFixed(2)}`} icon={<TrendingUp className="w-8 h-8" />} />
                <KPICard title="Efectivo" value={`€ ${totalCash.toFixed(2)}`} icon={<PieChart className="w-8 h-8" />} />
              </div>
              <div className={layout.gridKpi4}>
                <KPICard title="1 Mes"
                  value={`${monthlyPerformance > 0 ? '+' : ''}${monthlyPerformance.toFixed(2)}%`}
                  subtitle={`€ ${(metrics?.month?.abs ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  positive={monthlyPerformance > 0} />
                <KPICard title="3 Meses"
                  value={`${threeMonthsPerformance > 0 ? '+' : ''}${threeMonthsPerformance.toFixed(2)}%`}
                  subtitle={`€ ${(metrics?.three_months?.abs ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  positive={threeMonthsPerformance > 0} />
                <KPICard title="YTD"
                  value={`${ytdPerformance > 0 ? '+' : ''}${ytdPerformance.toFixed(2)}%`}
                  subtitle={`€ ${(metrics?.ytd?.abs ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  positive={ytdPerformance > 0} />
                <KPICard title="Total"
                  value={`${totalPerformance > 0 ? '+' : ''}${totalPerformance.toFixed(2)}%`}
                  subtitle={`€ ${(metrics?.total?.abs ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  positive={totalPerformance > 0} />
              </div>
            </div>

            {/* History chart */}
            <div className={surface.card}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className={text.sectionTitle}>Evolución del Patrimonio</h2>
                  <p className={text.sectionDesc}>Valor total de la cartera en el tiempo</p>
                </div>
                <div className="flex p-1 bg-[var(--bg-surface-alt)] rounded-lg border border-[var(--border)] self-start">
                  <button onClick={() => setHistoryAccountId('all')}
                    className={historyAccountId === 'all' ? button.tabActive : button.tabInactive}>General</button>
                  {accounts.map(acc => (
                    <button key={acc.account_id} onClick={() => setHistoryAccountId(acc.account_id)}
                      className={historyAccountId === acc.account_id ? button.tabActive : button.tabInactive}>{acc.name}</button>
                  ))}
                </div>
              </div>
              <div className="h-80 w-full">
                <PortfolioHistoryChart accountId={historyAccountId} />
              </div>
            </div>

            {/* Assets table */}
            <div className={surface.card}>
              <div className="mb-6">
                <h2 className={text.sectionTitle}>Listado de Activos</h2>
                <p className={text.sectionDesc}>Detalle individual, pesos de cartera y beneficio acumulado</p>
              </div>
              <AssetsTable />
            </div>
          </>
        )}

        {/* ============ VIEW: DISTRIBUCIÓN ============ */}
        {view === 'distribucion' && (
          <div className={layout.grid2}>
            <div className={surface.cardSm}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={text.sectionTitle}>Distribución de cuentas</h2>
                <AccountSelector accounts={accounts} selected={selectedAccountId} onChange={setSelectedAccountId} />
              </div>
              <div className="flex justify-center items-center">
                <AccountsDonut accounts={accounts} selectedAccountId={selectedAccountId} />
              </div>
            </div>
            <div className={surface.cardSm}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={text.sectionTitle}>Distribución de activos</h2>
                <div className="flex items-center gap-4">
                  <AccountSelector accounts={accounts} selected={selectedAssetAccountId} onChange={setSelectedAssetAccountId} />
                  <GroupBySelector value={groupBy} onChange={setGroupBy} />
                </div>
              </div>
              <div className="flex justify-center items-center">
                <AssetsDonut selectedAccountId={selectedAssetAccountId} groupBy={groupBy} />
              </div>
            </div>
          </div>
        )}

        {/* ============ VIEW: MAPA ============ */}
        {view === 'mapa' && (
          <div className={surface.card}>
            <div className="mb-6">
              <h2 className={text.sectionTitle}>Mapa de Activos</h2>
              <p className={text.sectionDesc}>Tamaño por valor total | Color por rendimiento</p>
            </div>
            <AssetsTreemap />
          </div>
        )}


      </div>
    </div>
  )
}
