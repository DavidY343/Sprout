import { useEffect, useState } from 'react'
import { ArrowLeft, Wallet, TrendingUp, PieChart, ChevronUp, ChevronDown } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import KPICard from '../components/KPICard'
import { AccountWithBalance } from '../types/account'
import { AssetTableRow } from '../types/asset'
import { PerformanceResponse } from '../types/performance'
import { ChartDataPoint } from '../types/history_chart'
import { getFriendAccounts, getFriendPerformance, getFriendHistory, getFriendAllAssets } from '../services/friendService'
import { layout, surface, glow, text, table } from '../styles/theme'

interface Props {
  friendId: number
  friendEmail: string
  onBack: () => void
}

interface AssetWithExtras extends AssetTableRow {
  weight: number
  profit: number
}

export default function FriendDashboard({ friendId, friendEmail, onBack }: Props) {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [metrics, setMetrics] = useState<PerformanceResponse | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [assets, setAssets] = useState<AssetTableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<keyof AssetWithExtras>('total_value')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => { load() }, [friendId])

  const load = async () => {
    setLoading(true)
    try {
      const [accs, perf, hist, assetData] = await Promise.all([
        getFriendAccounts(friendId),
        getFriendPerformance(friendId),
        getFriendHistory(friendId),
        getFriendAllAssets(friendId),
      ])
      setAccounts(accs)
      setMetrics(perf)
      setAssets(assetData || [])

      const formatted: ChartDataPoint[] = (hist.history || []).map((point: any) => {
        const totalValue = parseFloat(point.total_value)
        const capital = parseFloat(point.capital_invertido)
        return {
          day: point.date,
          total_value: totalValue,
          capital_invertido: capital,
          profit: totalValue - capital,
          displayDate: new Date(point.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        }
      })
      setChartData(formatted)
    } catch {
      setAccounts([])
      setMetrics(null)
    } finally { setLoading(false) }
  }

  const totalPortfolio = accounts.reduce((s, a) => s + a.total_value, 0)
  const totalInvested = accounts.reduce((s, a) => s + a.invested_value, 0)
  const totalCash = accounts.reduce((s, a) => s + a.cash_balance, 0)

  const totalAssetValue = assets.reduce((sum, a) => sum + (a.total_value || 0), 0)
  const assetsWithExtras: AssetWithExtras[] = assets.map(a => ({
    ...a,
    weight: totalAssetValue > 0 ? (a.total_value / totalAssetValue) * 100 : 0,
    profit: (a.total_value || 0) - (a.invested_value || 0),
  }))

  const handleSort = (field: keyof AssetWithExtras) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDirection('desc') }
  }

  const sortedAssets = [...assetsWithExtras].sort((a, b) => {
    const aV = a[sortField] ?? 0
    const bV = b[sortField] ?? 0
    return sortDirection === 'asc' ? (aV > bV ? 1 : -1) : (aV < bV ? 1 : -1)
  })

  const formatCurrency = (v?: number) => v?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) || '-'
  const formatPct = (v?: number) => v ? `${v > 0 ? '+' : ''}${v.toFixed(2)}%` : '-'

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

      {/* History chart */}
      {chartData.length > 0 && (
        <div className={surface.card}>
          <div className="mb-6">
            <h2 className={text.sectionTitle}>Evolución del Patrimonio</h2>
            <p className={text.sectionDesc}>Valor total de la cartera en el tiempo</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="friendColorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A6FA5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4A6FA5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="friendColorCapital" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B0A99C" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#B0A99C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} minTickGap={40} />
                <YAxis hide={true} domain={['dataMin - 100', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number | any) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)}
                />
                <Area type="stepAfter" dataKey="capital_invertido" name="Capital invertido" stroke="#B0A99C" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#friendColorCapital)" />
                <Area type="monotone" dataKey="total_value" name="Valor total" stroke="#4A6FA5" strokeWidth={2} fill="url(#friendColorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Assets table */}
      {assets.length > 0 && (
        <div className={surface.card}>
          <div className="mb-6">
            <h2 className={text.sectionTitle}>Listado de Activos</h2>
            <p className={text.sectionDesc}>Detalle individual, pesos de cartera y beneficio acumulado</p>
          </div>
          <div className="overflow-x-auto">
            <table className={table.wrapper}>
              <thead>
                <tr className={table.headRow}>
                  <SortTh label="Activo" field="name" current={sortField} dir={sortDirection} onSort={handleSort} />
                  <SortTh label="Cuenta" field="account_name" current={sortField} dir={sortDirection} onSort={handleSort} />
                  <SortTh label="Peso" field="weight" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
                  <SortTh label="Cantidad" field="quantity" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
                  <SortTh label="Invertido" field="invested_value" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
                  <SortTh label="Valor Total" field="total_value" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
                  <SortTh label="Rendimiento" field="profit" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bg-surface-hover)]">
                {sortedAssets.map(asset => (
                  <tr key={`${asset.asset_id}-${asset.account_id}`} className="hover:bg-[var(--bg-surface-alt)]/60 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="font-medium text-[var(--text-primary)] text-sm">{asset.name}</div>
                      <div className="text-[10px] text-[var(--text-placeholder)] font-medium uppercase">{asset.ticker || asset.isin} • {asset.type}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">{asset.account_name}</td>
                    <td className="py-3 px-4 text-right text-sm text-[var(--text-secondary)]">{asset.weight.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right text-sm text-[var(--text-secondary)]">{asset.quantity.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right text-sm text-[var(--text-secondary)]">{formatCurrency(asset.invested_value)}</td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-[var(--text-primary)]">{formatCurrency(asset.total_value)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium ${asset.profit >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                        {formatCurrency(asset.profit)}
                      </span>
                      <div className={`text-[10px] ${asset.performance >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                        {formatPct(asset.performance)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function SortTh({ label, field, current, dir, onSort, align = 'left' }: {
  label: string; field: string; current: string; dir: string; onSort: (f: any) => void; align?: string
}) {
  const active = current === field
  return (
    <th className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] cursor-pointer select-none text-${align}`} onClick={() => onSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </th>
  )
}
