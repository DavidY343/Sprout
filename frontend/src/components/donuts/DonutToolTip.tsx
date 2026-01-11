import React from 'react'

interface SimpleDonutTooltipProps {
  active?: boolean
  payload?: any[]
  total?: number
}

const SimpleDonutTooltip: React.FC<SimpleDonutTooltipProps> = ({ 
  active, 
  payload, 
  total = 0 
}) => {
  if (!active || !payload || !payload.length) return null

  const item = payload[0].payload

  return (
    <div className="bg-[#1e293b] border border-gray-700 rounded-lg p-4 shadow-lg min-w-[220px]">
      <p className="font-bold text-white text-lg mb-2 truncate max-w-[200px]">
        {item.name}
      </p>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Valor:</span>
          <span className="text-white font-medium">
            € {Number(item.value).toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Porcentaje:</span>
          <span className="text-white font-medium">{item.percentage}%</span>
        </div>
        
        <div className="pt-2 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Total general:</span>
            <span className="text-white font-medium">
              € {Number(total).toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleDonutTooltip