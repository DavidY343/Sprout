import { useState, useEffect } from 'react'
import TopBar from './components/TopBar'
import HelpGuide from './components/HelpGuide'
import PortfolioPage from './pages/PortfolioPage'
import TradesPage from './pages/TradesPage'
import LoginPage from './pages/LoginPage'
import TransactionPage from './pages/TransactionPage'
import { isAuthenticated } from './services/authService'
import { app } from './styles/theme'

export default function App() {
  const [activeTab, setActiveTab] = useState('portfolio')
  const [portfolioView, setPortfolioView] = useState('resumen')
  const [portfolioKey, setPortfolioKey] = useState(0)
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'portfolio') setPortfolioKey(k => k + 1)
  }

  return (
    <div className={app.body}>
      <TopBar activeTab={activeTab} setActiveTab={handleTabChange} />
      <main className={app.main}>
        {activeTab === 'portfolio' && <PortfolioPage key={portfolioKey} view={portfolioView} setView={setPortfolioView} />}
        {activeTab === 'trades' && <TradesPage />}
        {activeTab === 'transactions' && <TransactionPage />}
      </main>
      <HelpGuide activeTab={activeTab} portfolioView={portfolioView} />
    </div>
  )
}