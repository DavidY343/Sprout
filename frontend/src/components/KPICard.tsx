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
    <div className="relative rounded-xl p-6 bg-white border border-[#E5DED3] shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className={text.kpiLabel}>{title}</p>
            <div className="flex items-center gap-3">
              {icon && <div className="text-2xl text-[#8B8578]">{icon}</div>}
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
            isPositive ? 'text-[#6B8F71]' : 
            isNegative ? 'text-[#C25B3F]' : 
            'text-[#8B8578]'
          }`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}