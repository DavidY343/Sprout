import { useState } from 'react'
import TopBar from './components/TopBar'
import PortfolioPage from './pages/PortfolioPage'
import TradesPage from './pages/TradesPage'
import RebalancePage from './pages/RebalancePage'

export default function App() {
  const [activeTab, setActiveTab] = useState('portfolio')

  return (
    <div className="min-h-screen text-white bg-[#0B0F1A]">
      <TopBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="p-8 max-w-screen-2xl mx-auto">
        {activeTab === 'portfolio' && <PortfolioPage />}
        {activeTab === 'trades' && <TradesPage />}
        {activeTab === 'rebalance' && <RebalancePage />}

      </main>
    </div>
  )
}
