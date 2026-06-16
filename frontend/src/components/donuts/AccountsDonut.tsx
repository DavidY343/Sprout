import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { AccountWithBalance } from '../../types/account'
import { getAccountWithBalance } from '../../services/accountService'
import DonutTooltip from './DonutToolTip'
import { donut, colors } from '../../styles/theme'

const COLORS = colors.chart

interface Props {
  accounts: AccountWithBalance[]
  selectedAccountId: number | 'all'
}

export default function AccountsDonut({
  accounts,
  selectedAccountId
}: Props) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (selectedAccountId === 'all') {
          const formattedData = accounts.map(acc => ({
            name: acc.name,
            value: acc.total_value || 0
          }))
          setData(formattedData)
        } else {
          const acc = await getAccountWithBalance(selectedAccountId)
          setData([
            { name: 'Efectivo', value: acc.cash_balance || 0 },
            { name: 'Invertido', value: acc.invested_value || 0 }
          ])
        }
      } catch (error) {
        console.error('Error fetching account data:', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedAccountId, accounts])

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
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  // Añadir porcentajes a los datos
  const dataWithPercentages = data.map(item => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
  }))

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
    .sort((a, b) => Number(b.value) - Number(a.value))

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
              {selectedAccountId === 'all' ? 'Total' : 'Valor total'}
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
                  className="text-sm font-medium text-[var(--text-primary)] truncate" 
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