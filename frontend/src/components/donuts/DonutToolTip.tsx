import React from 'react'
import { surface } from '../../styles/theme'

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
    <div className={surface.tooltip + ' min-w-[220px]'}>
      <p className="font-bold text-[#2C2C2C] text-lg mb-2 truncate max-w-[200px]">
        {item.name}
      </p>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[#8B8578]">Valor:</span>
          <span className="text-[#2C2C2C] font-medium">
            € {Number(item.value).toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-[#8B8578]">Porcentaje:</span>
          <span className="text-[#2C2C2C] font-medium">{item.percentage}%</span>
        </div>
        
        <div className="pt-2 border-t border-[#E5DED3]">
          <div className="flex justify-between items-center">
            <span className="text-[#8B8578]">Total general:</span>
            <span className="text-[#2C2C2C] font-medium">
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