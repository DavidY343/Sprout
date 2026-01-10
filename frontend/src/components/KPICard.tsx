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
    <div className="
      relative rounded-xl p-6
      bg-gradient-to-br from-[#0a0e1f] to-[#070a18]
      border border-white/5
      shadow-2xl
      before:absolute before:inset-0 before:rounded-xl before:p-[1px] 
      before:bg-gradient-to-r 
      before:from-blue-500/30 before:via-purple-500/20 before:to-cyan-500/30
      before:-z-10
      after:absolute after:inset-0 after:rounded-xl
      after:bg-gradient-to-br after:from-blue-500/5 after:to-purple-500/3
      after:-z-20
      transition-all duration-300
      hover:shadow-blue-900/20 hover:shadow-2xl
    ">
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <div className="flex items-center gap-3">
              {icon && <div className="text-2xl">{icon}</div>}
              <p className={`text-3xl font-bold ${
                isPositive ? 'text-green-400' : 
                isNegative ? 'text-red-400' : 
                'text-white'
              }`}>
                {value}
              </p>
            </div>
          </div>
        </div>

        {subtitle && (
          <p
            className={`text-sm mt-4 font-medium ${
              isPositive ? 'text-green-300/90' : 
              isNegative ? 'text-red-300/90' : 
              'text-gray-400'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="absolute top-0 left-0 w-20 h-20 -translate-x-10 -translate-y-10 
        bg-blue-500/10 rounded-full blur-xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-20 h-20 translate-x-10 translate-y-10 
        bg-purple-500/10 rounded-full blur-xl -z-10"></div>
    </div>
  )
}