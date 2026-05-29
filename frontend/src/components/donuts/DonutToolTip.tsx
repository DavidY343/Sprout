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
      <p className="font-bold text-[var(--text-primary)] text-lg mb-2 truncate max-w-[200px]">
        {item.name}
      </p>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-muted)]">Valor:</span>
          <span className="text-[var(--text-primary)] font-medium">
            € {Number(item.value).toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-muted)]">Porcentaje:</span>
          <span className="text-[var(--text-primary)] font-medium">{item.percentage}%</span>
        </div>
        
        <div className="pt-2 border-t border-[var(--border)]">
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-muted)]">Total general:</span>
            <span className="text-[var(--text-primary)] font-medium">
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