import React, { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import ProductTracker from './components/ProductTracker'
import ProductList from './components/ProductList'
import { healthCheck } from './services/api'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    try {
      await healthCheck()
      setBackendStatus('connected')
    } catch (error) {
      setBackendStatus('disconnected')
      console.error('Backend health check failed:', error)
    }
  }

  const handleProductAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🎯 Price Tracker</h1>
          <p>Track Amazon product prices and get notified when they drop</p>
          
          <div className="status-indicator">
            <span className={`status-dot ${backendStatus}`}></span>
            <span className="status-text">
              {backendStatus === 'checking' && 'Checking connection...'}
              {backendStatus === 'connected' && 'Connected'}
              {backendStatus === 'disconnected' && 'Backend disconnected'}
            </span>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <div className="container">
          <ProductTracker onProductAdded={handleProductAdded} />
          <ProductList refreshTrigger={refreshTrigger} />
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with React, Node.js, and Supabase</p>
      </footer>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default App
