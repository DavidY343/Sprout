import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { AccountWithBalance } from '../../types/account'
import { getAccountWithBalance } from '../../services/accountService'
import DonutTooltip from './DonutToolTip'

const COLORS = ['#8b5cf6', '#22c55e', '#f97316', '#06b6d4', '#ef4444', '#eab308']

interface Props {
  accounts: AccountWithBalance[]
  userId: number
  selectedAccountId: number | 'all'
}

export default function AccountsDonut({
  accounts,
  userId,
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
          const acc = await getAccountWithBalance(userId, selectedAccountId)
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
  }, [selectedAccountId, accounts, userId])

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Cargando...
      </div>
    )
  }

  if (data.length === 0) { 
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
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

  // Tomar solo los primeros 4 elementos para la leyenda
  const visibleLegendItems = legendItems.slice(0, 4)
  const hasMoreItems = legendItems.length > 4
  const remainingItems = hasMoreItems ? legendItems.slice(4) : []
  const remainingTotal = remainingItems.reduce((sum, item) => sum + Number(item.value), 0)
  const remainingPercentage = total > 0 ? ((remainingTotal / total) * 100).toFixed(1) : '0.0'

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
      {/* Gráfico Donut*/}
      <div className="w-full lg:w-[60%] relative flex justify-center">
        <div className="w-64 h-64 lg:w-80 lg:h-80">
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
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {total.toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {selectedAccountId === 'all' ? 'Total' : 'Valor total'}
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda*/}
      <div className="w-full lg:w-[40%]">
        <div className="space-y-3 w-full">
          {visibleLegendItems.map((item, index) => (
            <div 
              key={item.name} 
              className="group flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              {/* Izquierda: Color + Nombre */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-white truncate">
                  {item.name}
                </span>
              </div>
              
              {/* Derecha: Precio + Porcentaje */}
              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                <span className="text-white font-semibold text-sm whitespace-nowrap">
                  €{item.formattedValue}
                </span>
                <span className="text-gray-400 font-semibold text-sm whitespace-nowrap">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
          
          {/* Elementos restantes agrupados */}
          {hasMoreItems && (
            <div className="group flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              {/* Izquierda: Color + Nombre */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-4 h-4 rounded-full flex-shrink-0 bg-gray-600" />
                <span className="text-sm font-medium text-gray-300 truncate">
                  Otros ({remainingItems.length} categorías)
                </span>
              </div>
              
              {/* Derecha: Precio + Porcentaje */}
              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                <span className="text-gray-400 font-semibold text-sm whitespace-nowrap">
                  €{remainingTotal.toLocaleString('es-ES', { minimumFractionDigits: 0 })}
                </span>
                <span className="text-gray-500 font-semibold text-sm whitespace-nowrap">
                  {remainingPercentage}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}