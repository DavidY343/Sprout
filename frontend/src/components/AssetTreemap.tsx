import { useEffect, useState } from 'react'
import { getAllAssets } from '../services/assetService'
import { AssetTableRow } from '../types/asset'

export default function AssetsTreemapPremium() {
  const [assets, setAssets] = useState<AssetTableRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllAssets()
      .then(data => {
        const sorted = data
          .filter(a => a.total_value > 0)
          .sort((a, b) => b.total_value - a.total_value)

        setAssets(sorted)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading)
    return (
      <div className="h-96 flex items-center justify-center text-purple-400/50 animate-pulse">
        Cargando dashboard...
      </div>
    )

  const totalValue = assets.reduce((sum, a) => sum + a.total_value, 0)

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

  const nodes = binaryTreemap(assets, 0, 0, 100, 100)

  return (
    <div className="w-full bg-[#0d0d15] rounded-2xl border border-white/5 overflow-hidden shadow-2xl p-2">
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
    if (perf > 3) return { bg: 'bg-emerald-600/60', hover: 'group-hover:bg-emerald-500/60', text: 'text-emerald-400', border: 'border-emerald-500/40' }
    if (perf > 1.5) return { bg: 'bg-emerald-600/40', hover: 'group-hover:bg-emerald-500/40', text: 'text-emerald-400', border: 'border-emerald-500/30' }
    if (perf > 0) return { bg: 'bg-emerald-600/20', hover: 'group-hover:bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/20' }
    if (perf < -3) return { bg: 'bg-rose-600/60', hover: 'group-hover:bg-rose-500/60', text: 'text-rose-400', border: 'border-rose-500/40' }
    if (perf < -1.5) return { bg: 'bg-rose-600/40', hover: 'group-hover:bg-rose-500/40', text: 'text-rose-400', border: 'border-rose-500/30' }
    if (perf < 0) return { bg: 'bg-rose-600/20', hover: 'group-hover:bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/20' }
    return { bg: 'bg-slate-800/20', hover: 'group-hover:bg-slate-700/40', text: 'text-slate-400', border: 'border-slate-500/20' }
  }

  const style = getStyle(asset.performance)

  const isLarge = weight > 12
  const isMedium = weight > 4

  return (
    <div
      className={`
        relative group cursor-pointer transition-all duration-500 
        rounded-xl border backdrop-blur-md overflow-hidden h-full w-full
        hover:z-30 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]
        ${style.bg} ${style.hover} ${style.border} ${className}
      `}
    >
    
      {/* Contenido Principal (Siempre visible) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        
        {/* Nombre */}
       <span className={`
          text-white font-bold leading-tight tracking-wide transition-all duration-500 px-1
          ${isLarge ? 'text-2xl' : isMedium ? 'text-base' : 'text-[10px]'}
          group-hover:-translate-y-12 group-hover:scale-90 group-hover:opacity-40
        `}>
          {asset.name}
        </span>

        {/* RENDIMIENTO */}
        <div className={`
          flex items-center gap-1 font-bold transition-all duration-500
          ${isLarge ? 'text-sm' : 'text-[9px]'}
          ${style.text}
          group-hover:translate-y-12 group-hover:opacity-40
        `}>
          <span>{asset.performance > 0 ? '▲' : '▼'}</span>
          <span>{Math.abs(asset.performance).toFixed(2)}%</span>
        </div>

        {/* --- DATOS EXTRA (Solo visibles en Hover) --- */}
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px] gap-1">
          {/* Valor Actual */}
          <span className={`text-white/70 font-bold leading-none ${isLarge ? 'text-xl' : 'text-sm'}`}>
            {asset.ticker || asset.isin}
          </span>
          <span className={`text-white/70 font-bold leading-none ${isLarge ? 'text-xl' : 'text-sm'}`}>
            Valor: {asset.total_value.toLocaleString()}€
          </span>
          {/* Peso en Cartera */}
          <span className="text-white/60 text-sm tracking-tighter">
            Peso: {weight.toFixed(1)}%
          </span>
        </div>

      </div>
    </div>
  )
}