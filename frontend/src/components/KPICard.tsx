import { text, colors } from '../styles/theme'

interface Props {
  title: string
  value: string
  subtitle?: string
  positive?: boolean
  icon?: React.ReactNode
}

export default function KPICard({
  title,
  value,
  subtitle,
  positive,
  icon
}: Props) {
  const isPositive = positive === true
  const isNegative = positive === false
  
  return (
    <div className="relative rounded-xl p-6 bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className={text.kpiLabel}>{title}</p>
            <div className="flex items-center gap-3">
              {icon && <div className="text-2xl text-[var(--text-muted)]">{icon}</div>}
              <p className={`text-3xl font-bold ${
                isPositive ? colors.positive : 
                isNegative ? colors.negative : 
                colors.white
              }`}>
                {value}
              </p>
            </div>
          </div>
        </div>

        {subtitle && (
          <p className={`text-sm mt-4 font-medium ${
            isPositive ? 'text-[var(--accent-green)]' : 
            isNegative ? 'text-[var(--accent-red)]' : 
            'text-[var(--text-muted)]'
          }`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}