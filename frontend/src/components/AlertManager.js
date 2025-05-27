import React, { useState, useEffect } from 'react'
import { createAlert, getProductAlerts } from '../services/api'
import { supabase } from '../config/supabase'
import { toast } from 'react-toastify'

const AlertManager = ({ productId }) => {
  const [email, setEmail] = useState('')
  const [threshold, setThreshold] = useState('')
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingAlerts, setFetchingAlerts] = useState(true)

  useEffect(() => {
    if (productId) {
      fetchAlerts()
      
      // Set up real-time subscription for alerts
      const subscription = supabase
        .channel('alerts_changes')
        .on('postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'alerts',
            filter: `product_id=eq.${productId}`
          },
          (payload) => {
            console.log('Alert change received:', payload)
            handleRealtimeAlertUpdate(payload)
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [productId])

  const fetchAlerts = async () => {
    try {
      setFetchingAlerts(true)
      const response = await getProductAlerts(productId)
      setAlerts(response.alerts)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
      toast.error('Failed to load alerts')
    } finally {
      setFetchingAlerts(false)
    }
  }

  const handleRealtimeAlertUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    switch (eventType) {
      case 'INSERT':
        setAlerts(prev => [newRecord, ...prev])
        break
      case 'UPDATE':
        setAlerts(prev => prev.map(alert => 
          alert.id === newRecord.id ? newRecord : alert
        ))
        break
      case 'DELETE':
        setAlerts(prev => prev.filter(alert => alert.id !== oldRecord.id))
        break
      default:
        break
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim() || !threshold) {
      toast.error('Please fill in all fields')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (parseFloat(threshold) <= 0) {
      toast.error('Threshold must be greater than 0')
      return
    }

    try {
      setLoading(true)
      
      const response = await createAlert(productId, email.trim(), threshold)
      
      if (response.success) {
        toast.success('Alert created successfully!')
        setEmail('')
        setThreshold('')
        fetchAlerts()
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="alert-manager">
      <form onSubmit={handleSubmit} className="alert-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">📧 Email Address:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="threshold">💰 Alert when price drops below:</label>
            <input
              type="number"
              id="threshold"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="Enter price threshold"
              min="1"
              step="1"
              required
              disabled={loading}
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className={`submit-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Creating Alert...
            </>
          ) : (
            '🔔 Create Alert'
          )}
        </button>
      </form>

      <div className="existing-alerts">
        <h4>📋 Active Alerts</h4>
        
        {fetchingAlerts ? (
          <div className="loading-alerts">
            <span className="spinner"></span>
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <p className="no-alerts">No alerts set for this product</p>
        ) : (
          <div className="alerts-list">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert-item ${alert.alert_sent ? 'sent' : 'active'}`}>
                <div className="alert-info">
                  <span className="alert-email">📧 {alert.email}</span>
                  <span className="alert-threshold">
                    💰 {formatCurrency(alert.threshold)}
                  </span>
                  <span className="alert-date">
                    📅 {new Date(alert.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="alert-status">
                  {alert.alert_sent ? (
                    <span className="status-sent">✅ Alert Sent</span>
                  ) : (
                    <span className="status-active">⏳ Active</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Make sure this is a default export
export default AlertManager
