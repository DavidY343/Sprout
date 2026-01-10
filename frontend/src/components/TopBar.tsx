interface Props {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function TopBar({ activeTab, setActiveTab }: Props) {
  const tabs = [
    { id: 'portfolio', label: 'Dashboard' },
    { id: 'trades', label: 'Trade Logs' },
    { id: 'rebalance', label: 'Rebalanceo' }
  ]

  return (
    <header className="flex items-center justify-between px-8 py-5 bg-[#0B0F1A]">
      <h1 className="text-xl font-semibold tracking-wide">
        Financial Hub
      </h1>

      <nav className="flex gap-10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-lg font-medium transition-all duration-200 relative cursor-pointer ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
            {/* Indicador activo */}
            {activeTab === tab.id && (
              <div className="absolute -bottom-5 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </button>
        ))}
      </nav>

      <button className="px-5 py-2 rounded-lg border border-white/20 text-sm font-medium hover:bg-white/5 transition">
        Iniciar sesión
      </button>
    </header>
  )
}