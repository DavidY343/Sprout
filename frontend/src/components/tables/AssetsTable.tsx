import { useEffect, useState } from 'react'
import { AssetTableRow } from '../../types/asset'
import { getAllAssets } from '../../services/assetService'
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react'

interface AssetWithExtras extends AssetTableRow {
  weight: number
  profit: number
}

export default function AssetsTable() {
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

  const totalPortfolioValue = assets.reduce((sum, asset) => sum + (asset.total_value || 0), 0)

  const assetsWithExtras: AssetWithExtras[] = assets.map(asset => ({
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

  if (loading) return <div className="p-12 text-center text-gray-500 italic animate-pulse">Cargando activos...</div>
  if (assets.length === 0) return <div className="p-12 text-center text-gray-500">No hay datos</div>

  return (
    <div className="w-full bg-[#11162A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <Th label="Activo" field="name" current={sortField} dir={sortDirection} onSort={handleSort} />
              <Th label="Cuenta" field="account_name" current={sortField} dir={sortDirection} onSort={handleSort} />
              <Th label="Peso" field="weight" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
              <Th label="Cantidad" field="quantity" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
              <Th label="Invertido" field="invested_value" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
              <Th label="Valor Total" field="total_value" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
              <Th label="Rendimiento" field="profit" current={sortField} dir={sortDirection} onSort={handleSort} align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedAssets.map((asset) => (
              <tr key={`${asset.asset_id}-${asset.account_id}`} className="hover:bg-white/[0.02] transition-colors group">
                <td className="py-3 px-4">
                  <div className="font-medium text-white group-hover:text-purple-400 transition-colors text-sm">{asset.name}</div>
                  <div className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{asset.ticker || asset.isin} • {asset.type}</div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-400 italic font-medium">{asset.account_name}</td>
                <td className="py-3 px-4 text-sm text-right text-purple-300 font-medium">{asset.weight.toFixed(2)}%</td>
                <td className="py-3 px-4 text-sm text-right text-gray-300 font-medium">{formatNumber(asset.quantity)}</td>
                <td className="py-3 px-4 text-sm text-right text-gray-400 font-medium">{formatCurrency(asset.invested_value)}</td>
                <td className="py-3 px-4 text-sm text-right text-white font-bold font-medium">{formatCurrency(asset.total_value)}</td>
                
                {/* Dinero arriba (sm), Porcentaje abajo (xs) */} 
                <td className={`py-3 px-4 text-right ${asset.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
      className={`py-4 px-4 text-xs font-bold uppercase tracking-widest text-gray-400 cursor-pointer hover:text-white transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        <div className="w-4 flex justify-center">
          {isActive ? (dir === 'asc' ? <ChevronUp size={14} className="text-purple-500" /> : <ChevronDown size={14} className="text-purple-500" />) : null}
        </div>
      </div>
    </th>
  )
}