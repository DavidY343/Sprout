import { useEffect, useState } from 'react'
import { getAllAssets } from '../services/assetService'
import { AssetTableRow } from '../types/asset'

interface AssetsTreemapProps {
  accountId?: number | 'all'
}

export default function AssetsTreemapPremium({ accountId = 'all' }: AssetsTreemapProps) {
  const [assets, setAssets] = useState<AssetTableRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllAssets()
      .then(data => {
        setAssets(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredAssets = accountId === 'all' ? assets : assets.filter(a => a.account_id === accountId)
  const sortedAssets = filteredAssets
    .filter(a => a.total_value > 0)
    .sort((a, b) => b.total_value - a.total_value)

  if (loading)
    return (
      <div className="h-96 flex items-center justify-center text-[var(--text-muted)] animate-pulse">
        Cargando dashboard...
      </div>
    )

  const totalValue = sortedAssets.reduce((sum, a) => sum + a.total_value, 0)

  // ====== BINARY TREEMAP INLINE ======
  type Node = {
    x: number
    y: number
    w: number
    h: number
    item?: AssetTableRow
  }

  function binaryTreemap(
    items: AssetTableRow[],
    x: number,
    y: number,
    w: number,
    h: number
  ): Node[] {
    if (!items.length) return []
    if (items.length === 1) return [{ x, y, w, h, item: items[0] }]

    const total = items.reduce((s, i) => s + i.total_value, 0)

    let acc = 0
    let splitIndex = 0

    for (let i = 0; i < items.length; i++) {
      acc += items[i].total_value
      if (acc >= total / 2) {
        splitIndex = i + 1
        break
      }
    }

    const left = items.slice(0, splitIndex)
    const right = items.slice(splitIndex)

    const ratio = acc / total

    if (w >= h) {
      const w1 = w * ratio
      return [
        ...binaryTreemap(left, x, y, w1, h),
        ...binaryTreemap(right, x + w1, y, w - w1, h),
      ]
    } else {
      const h1 = h * ratio
      return [
        ...binaryTreemap(left, x, y, w, h1),
        ...binaryTreemap(right, x, y + h1, w, h - h1),
      ]
    }
  }

  const nodes = binaryTreemap(sortedAssets, 0, 0, 100, 100)

  return (
    <div className="w-full bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm p-2">
      <div className="relative w-full h-[600px]">
        {nodes.map(node => {
          const asset = node.item!
          const weight = (asset.total_value / totalValue) * 100

          return (
            <div
              key={asset.asset_id}
              style={{
                position: 'absolute',
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: `${node.w}%`,
                height: `${node.h}%`,
              }}
              className="p-1"
            >
              <AssetCard
                asset={asset}
                weight={weight}
                className="w-full h-full"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AssetCard({
  asset,
  weight,
  className,
}: {
  asset: AssetTableRow
  weight: number
  className: string
}) {
  const getStyle = (perf: number) => {
    if (perf > 3) return { bg: 'bg-[#6B8F71]/40', hover: 'group-hover:bg-[#6B8F71]/50', text: 'text-[#4A7050]', border: 'border-[#6B8F71]/40' }
    if (perf > 1.5) return { bg: 'bg-[#6B8F71]/25', hover: 'group-hover:bg-[#6B8F71]/35', text: 'text-[#4A7050]', border: 'border-[#6B8F71]/30' }
    if (perf > 0) return { bg: 'bg-[#6B8F71]/15', hover: 'group-hover:bg-[#6B8F71]/20', text: 'text-[#6B8F71]', border: 'border-[#6B8F71]/20' }
    if (perf < -3) return { bg: 'bg-[#C25B3F]/40', hover: 'group-hover:bg-[#C25B3F]/50', text: 'text-[#A04530]', border: 'border-[#C25B3F]/40' }
    if (perf < -1.5) return { bg: 'bg-[#C25B3F]/25', hover: 'group-hover:bg-[#C25B3F]/35', text: 'text-[#A04530]', border: 'border-[#C25B3F]/30' }
    if (perf < 0) return { bg: 'bg-[#C25B3F]/15', hover: 'group-hover:bg-[#C25B3F]/20', text: 'text-[#C25B3F]', border: 'border-[#C25B3F]/20' }
    return { bg: 'bg-[#E5DED3]/30', hover: 'group-hover:bg-[#E5DED3]/50', text: 'text-[#8B8578]', border: 'border-[#D5CEC2]' }
  }

  const style = getStyle(asset.performance)

  const isLarge = weight > 12
  const isMedium = weight > 4

  return (
    <div
      className={`
        relative group cursor-pointer transition-all duration-500 
        rounded-xl border overflow-hidden h-full w-full
        hover:z-30 hover:shadow-md
        ${style.bg} ${style.hover} ${style.border} ${className}
      `}
    >
    
      {/* Contenido Principal */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        
        <span className={`
          text-[var(--text-primary)] font-bold leading-tight tracking-wide transition-all duration-500 px-1
          ${isLarge ? 'text-2xl' : isMedium ? 'text-base' : 'text-[10px]'}
          group-hover:-translate-y-12 group-hover:scale-90 group-hover:opacity-40
        `}>
          {asset.name}
        </span>

        <div className={`
          flex items-center gap-1 font-bold transition-all duration-500
          ${isLarge ? 'text-sm' : 'text-[9px]'}
          ${style.text}
          group-hover:translate-y-12 group-hover:opacity-40
        `}>
          <span>{asset.performance > 0 ? '▲' : '▼'}</span>
          <span>{Math.abs(asset.performance).toFixed(2)}%</span>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[var(--bg-surface)]/40 backdrop-blur-[2px] gap-1">
          <span className={`text-[var(--text-primary)]/70 font-bold leading-none ${isLarge ? 'text-xl' : 'text-sm'}`}>
            {asset.ticker || asset.isin}
          </span>
          <span className={`text-[var(--text-primary)]/70 font-bold leading-none ${isLarge ? 'text-xl' : 'text-sm'}`}>
            Valor: {asset.total_value.toLocaleString()}€
          </span>
          <span className="text-[var(--text-secondary)] text-sm tracking-tighter">
            Peso: {weight.toFixed(1)}%
          </span>
        </div>

      </div>
    </div>
  )
}