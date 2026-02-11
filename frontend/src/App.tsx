import { useState, useEffect } from 'react'
import TopBar from './components/TopBar'
import PortfolioPage from './pages/PortfolioPage'
import TradesPage from './pages/TradesPage'
import RebalancePage from './pages/RebalancePage'
import LoginPage from './pages/LoginPage'
import TransactionPage from './pages/TransactionPage'
import { isAuthenticated } from './services/authService'

export default function App() {
  const [activeTab, setActiveTab] = useState('portfolio')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {

    const auth = isAuthenticated()
    setIsLoggedIn(auth)
    
    const handleStorageChange = () => {
      setIsLoggedIn(isAuthenticated())
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  if (!isLoggedIn) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen text-white bg-[#0B0F1A]">
      <TopBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="p-8 max-w-screen-2xl mx-auto">
        {activeTab === 'portfolio' && <PortfolioPage />}
        {activeTab === 'trades' && <TradesPage />}
        {activeTab === 'rebalance' && <RebalancePage />}
        {activeTab === 'transactions' && <TransactionPage />}
      </main>
    </div>
  )
}