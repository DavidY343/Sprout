import { useState, useEffect } from 'react'
import TopBar from './components/TopBar'
import HelpGuide from './components/HelpGuide'
import PortfolioPage from './pages/PortfolioPage'
import TradesPage from './pages/TradesPage'
import LoginPage from './pages/LoginPage'
import TransactionPage from './pages/TransactionPage'
import FriendsPage from './pages/FriendsPage'
import OnboardingGuide from './components/OnboardingGuide'
import { isAuthenticated, checkAuth } from './services/authService'
import { app } from './styles/theme'

export default function App() {
  const [activeTab, setActiveTab] = useState('portfolio')
  const [portfolioView, setPortfolioView] = useState('resumen')
  const [portfolioKey, setPortfolioKey] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Quick sync check for instant UI (avoids flash)
    if (isAuthenticated()) {
      setIsLoggedIn(true)
    }
    // Then verify with server
    checkAuth().then(valid => {
      setIsLoggedIn(valid)
      setAuthChecked(true)
      if (valid && !localStorage.getItem('onboarding_done')) {
        setShowOnboarding(true)
      }
    })
  }, [])

  if (!authChecked && !isLoggedIn) {
    return null // Brief loading state
  }

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
        {activeTab === 'friends' && <FriendsPage />}
      </main>
      <HelpGuide activeTab={activeTab} portfolioView={portfolioView} />
      {showOnboarding && (
        <OnboardingGuide
          onNavigate={handleTabChange}
          onComplete={() => {
            setShowOnboarding(false)
            localStorage.setItem('onboarding_done', '1')
          }}
        />
      )}
    </div>
  )
}