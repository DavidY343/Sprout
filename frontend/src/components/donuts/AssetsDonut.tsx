import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { AssetAllocation } from '../../types/asset'
import { getAccountAssetAllocation, getGlobalAssetAllocation } from '../../services/assetService'
import DonutTooltip from './DonutToolTip'
import { donut, colors } from '../../styles/theme'

const COLORS = colors.chart

const TYPE_TRANSLATIONS: Record<string, string> = {
  money_market: 'Fondo monetario',
  fund: 'Fondo',
  stock: 'Acciones',
  etf: 'ETF',
  crypto: 'Criptomonedas',
  bond: 'Bonos',
  reit: 'REIT'
}

interface Props {
  selectedAccountId: number | 'all'
  groupBy: 'type' | 'theme' | 'asset'
}

export default function AssetsDonut({selectedAccountId,groupBy}: Props) {
  const [data, setData] = useState<AssetAllocation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        let response: AssetAllocation[]
        
        if (selectedAccountId === 'all') {
          response = await getGlobalAssetAllocation(groupBy)
        } else {
          response = await getAccountAssetAllocation(selectedAccountId, groupBy)
        }
        
        setData(response || [])
      } catch (error) {
        console.error('Error fetching asset allocation:', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedAccountId, groupBy])

  if (loading) {
    return (
      <div className={donut.emptyState}>
        Cargando...
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={donut.emptyState}>
        Sin datos
      </div>
    )
  }

  // Calcular total para porcentajes
  const total = data.reduce((sum, item) => sum + (item.total_value || 0), 0)
  
  // Añadir porcentajes a los datos
  const dataWithPercentages = data.map(item => {
    let name = item.group_key
    if (groupBy === 'type') {
      name = TYPE_TRANSLATIONS[item.group_key.toLowerCase()] || item.group_key
    }
    return {
      ...item,
      name,
      value: item.total_value,
      percentage: total > 0 ? ((item.total_value / total) * 100).toFixed(1) : '0.0'
    }
  })

  // Preparar datos para la leyenda
  const legendItems = dataWithPercentages
    .map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length],
      formattedValue: Number(item.value).toLocaleString('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
    }))
    .sort((a, b) => Number(b.value) - Number(a.value)) // Ordenar por valor descendente

  return (
<div className={donut.shell}>
  {/* Gráfico Donut*/}
  <div className={donut.chartColumn}>
    <div className={donut.chartBox}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithPercentages}
            dataKey="value"
            nameKey="name"
            innerRadius="70%"
            outerRadius="100%"
            paddingAngle={2}
          >
            {dataWithPercentages.map((_, index) => (
              <Cell 
                key={index} 
                fill={COLORS[index % COLORS.length]}
                stroke="none"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
            ))}
          </Pie>
          <Tooltip 
            content={<DonutTooltip total={total} />}
            wrapperStyle={{ zIndex: 100 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    
    <div className={donut.centerOverlay}>
      <div className="text-center">
        <div className={donut.centerValue}>
          {total.toLocaleString('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}
        </div>
        <div className={donut.centerLabel}>
          Total
        </div>
      </div>
    </div>
  </div>

  {/* Leyenda*/}
  <div className={donut.legendColumn}>
    <div className={donut.legendStack}>
      {legendItems.map((item, index) => (
        <div 
          key={item.name} 
          className={donut.legendItem}
        >
          {/* Izquierda: Color + Nombre */}
          <div className={donut.legendLeft}>
            <div 
              className={donut.legendDot}
              style={{ backgroundColor: item.color }}
            />
            <span 
              className="text-sm font-medium text-[var(--text-primary)] max-w-[150px] truncate" 
              title={item.name}
            >
              {item.name}
            </span>
          </div>
          
          {/* Derecha: Precio + Porcentaje */}
          <div className={donut.legendRight}>
            <span className={donut.legendValue}>
              €{item.formattedValue}
            </span>
            <span className={donut.legendPct}>
              {item.percentage}%
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
  )
}