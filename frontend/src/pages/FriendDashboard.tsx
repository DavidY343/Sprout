import { useEffect, useState } from 'react'
import { ArrowLeft, Wallet, TrendingUp, PieChart } from 'lucide-react'
import KPICard from '../components/KPICard'
import { AccountWithBalance } from '../types/account'
import { PerformanceResponse } from '../types/performance'
import { getFriendAccounts, getFriendPerformance } from '../services/friendService'
import { layout, surface, glow, text } from '../styles/theme'

interface Props {
  friendId: number
  friendEmail: string
  onBack: () => void
}

export default function FriendDashboard({ friendId, friendEmail, onBack }: Props) {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [metrics, setMetrics] = useState<PerformanceResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [friendId])

  const load = async () => {
    setLoading(true)
    try {
      const [accs, perf] = await Promise.all([
        getFriendAccounts(friendId),
        getFriendPerformance(friendId),
      ])
      setAccounts(accs)
      setMetrics(perf)
    } catch {
      setAccounts([])
      setMetrics(null)
    } finally { setLoading(false) }
  }

  const totalPortfolio = accounts.reduce((s, a) => s + a.total_value, 0)
  const totalInvested = accounts.reduce((s, a) => s + a.invested_value, 0)
  const totalCash = accounts.reduce((s, a) => s + a.cash_balance, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)]" />
      </div>
    )
  }

  return (
    <div className={layout.pageStack}>
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-input)] transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Cartera de {friendEmail}</h2>
          <p className="text-sm text-[var(--text-muted)]">Solo lectura</p>
        </div>
      </div>

      {/* KPIs */}
      <div className={`${layout.pageStack} ${surface.heroPanel}`}>
        <div className={glow.orbTop}></div>
        <div className={glow.orbBottom}></div>
        <div className={layout.gridKpi3}>
          <KPICard title="Total Portfolio" value={`€ ${totalPortfolio.toFixed(2)}`} icon={<Wallet className="w-8 h-8" />} />
          <KPICard title="Total Invertido" value={`€ ${totalInvested.toFixed(2)}`} icon={<TrendingUp className="w-8 h-8" />} />
          <KPICard title="Efectivo" value={`€ ${totalCash.toFixed(2)}`} icon={<PieChart className="w-8 h-8" />} />
        </div>
        {metrics && (
          <div className={layout.gridKpi4}>
            <KPICard title="1 Mes"
              value={`${metrics.month.pct > 0 ? '+' : ''}${metrics.month.pct.toFixed(2)}%`}
              subtitle={`€ ${metrics.month.abs.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              positive={metrics.month.pct > 0} />
            <KPICard title="3 Meses"
              value={`${metrics.three_months.pct > 0 ? '+' : ''}${metrics.three_months.pct.toFixed(2)}%`}
              subtitle={`€ ${metrics.three_months.abs.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              positive={metrics.three_months.pct > 0} />
            <KPICard title="YTD"
              value={`${metrics.ytd.pct > 0 ? '+' : ''}${metrics.ytd.pct.toFixed(2)}%`}
              subtitle={`€ ${metrics.ytd.abs.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              positive={metrics.ytd.pct > 0} />
            <KPICard title="Total"
              value={`${metrics.total.pct > 0 ? '+' : ''}${metrics.total.pct.toFixed(2)}%`}
              subtitle={`€ ${metrics.total.abs.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              positive={metrics.total.pct > 0} />
          </div>
        )}
      </div>

      {/* Accounts breakdown */}
      {accounts.length > 0 && (
        <div className={surface.card}>
          <div className="mb-4">
            <h3 className={text.sectionTitle}>Cuentas</h3>
          </div>
          <div className="space-y-2">
            {accounts.map(acc => (
              <div key={acc.account_id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)]">
                <div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{acc.name}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">{acc.type}</span>
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">€ {acc.total_value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
