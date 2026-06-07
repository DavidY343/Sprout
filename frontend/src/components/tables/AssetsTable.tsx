import { useEffect, useState } from 'react'
import { AssetTableRow } from '../../types/asset'
import { getAllAssets } from '../../services/assetService'
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react'
import { surface, table } from '../../styles/theme'

interface AssetWithExtras extends AssetTableRow {
  weight: number
  profit: number
}

interface AssetsTableProps {
  accountId?: number | 'all'
}

export default function AssetsTable({ accountId = 'all' }: AssetsTableProps) {
  const [assets, setAssets] = useState<AssetTableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<keyof AssetWithExtras>('total_value')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => { loadAssets() }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const data = await getAllAssets()
      setAssets(data || [])
    } catch (error) {
      console.error('Error:', error)
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  const filteredAssets = accountId === 'all' ? assets : assets.filter(a => a.account_id === accountId)
  
  const totalPortfolioValue = filteredAssets.reduce((sum, asset) => sum + (asset.total_value || 0), 0)

  const assetsWithExtras: AssetWithExtras[] = filteredAssets.map(asset => ({
    ...asset,
    weight: totalPortfolioValue > 0 ? (asset.total_value / totalPortfolioValue) * 100 : 0,
    profit: (asset.total_value || 0) - (asset.invested_value || 0)
  }))

  const formatCurrency = (v?: number) => v?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) || '-'
  const formatNumber = (v?: number) => v?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'
  const formatPct = (v?: number) => v ? `${v > 0 ? '+' : ''}${v.toFixed(2)}%` : '-'

  const handleSort = (field: keyof AssetWithExtras) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDirection('desc'); }
  }

  const sortedAssets = [...assetsWithExtras].sort((a, b) => {
    let aV = a[sortField] ?? 0;
    let bV = b[sortField] ?? 0;
    return sortDirection === 'asc' ? (aV > bV ? 1 : -1) : (aV < bV ? 1 : -1)
  })

  if (loading) return <div className="p-12 text-center text-[var(--text-muted)] italic animate-pulse">Cargando activos...</div>
  if (assets.length === 0) return <div className="p-12 text-center text-[var(--text-muted)]">No hay datos</div>

  return (
    <div className={surface.tableContainer}>
      <div className="overflow-x-auto">
        <table className={table.wrapper}>
          <thead>
            <tr className={table.headRow}>
              <Th label="Activo" field="name" current={sortField} dir={sortDirection} onSort={handleSort} />
              <Th label="Cuenta" field="account_name" current={sortField} dir={sortDirection} onSort={handleSort} />
              <Th label="Peso" field="weight" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
              <Th label="Cantidad" field="quantity" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
              <Th label="Invertido" field="invested_value" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
              <Th label="Valor Total" field="total_value" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
              <Th label="Rendimiento" field="profit" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--bg-surface-hover)]">
            {sortedAssets.map((asset) => (
              <tr key={`${asset.asset_id}-${asset.account_id}`} className="hover:bg-[var(--bg-surface-alt)]/60 transition-colors group">
                <td className="py-3 px-4">
                  <div className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors text-sm">{asset.name}</div>
                  <div className="text-[10px] text-[var(--text-placeholder)] font-medium uppercase tracking-tight">{asset.ticker || asset.isin} • {asset.type}</div>
                </td>
                <td className="py-3 px-4 text-sm text-[var(--text-muted)] italic font-medium">{asset.account_name}</td>
                <td className="py-3 px-4 text-sm text-right text-[var(--accent-blue)] font-medium">{asset.weight.toFixed(2)}%</td>
                <td className="py-3 px-4 text-sm text-right text-[var(--text-secondary)] font-medium">{formatNumber(asset.quantity)}</td>
                <td className="py-3 px-4 text-sm text-right text-[var(--text-muted)] font-medium">{formatCurrency(asset.invested_value)}</td>
                <td className="py-3 px-4 text-sm text-right text-[var(--text-primary)] font-bold font-medium">{formatCurrency(asset.total_value)}</td>
                
                {/* Dinero arriba (sm), Porcentaje abajo (xs) */} 
                <td className={`py-3 px-4 text-right ${asset.profit >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-bold flex items-center gap-1 font-mono">
                      {asset.profit >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {formatCurrency(asset.profit)}
                    </div>
                    <div className="text-[11px] font-medium opacity-70">
                      {formatPct(asset.performance)}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ label, field, current, dir, onSort, align = 'left' }: any) {
  const isActive = current === field
  return (
    <th 
      onClick={() => onSort(field)}
      className={`py-4 px-4 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)] transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        <div className="w-4 flex justify-center">
          {isActive ? (dir === 'asc' ? <ChevronUp size={14} className="text-[var(--accent-blue)]" /> : <ChevronDown size={14} className="text-[var(--accent-blue)]" />) : null}
        </div>
      </div>
    </th>
  )
}