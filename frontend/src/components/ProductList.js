import React, { useState, useEffect } from 'react'
import { getProducts, deleteProduct } from '../services/api'
import { supabase } from '../config/supabase'
import { toast } from 'react-toastify'
import PriceChart from './PriceChart'
import AlertManager from './AlertManager'

const ProductList = ({ refreshTrigger }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    fetchProducts()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Product change received:', payload)
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshTrigger])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getProducts()
      setProducts(response.products)
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRealtimeUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    switch (eventType) {
      case 'INSERT':
        setProducts(prev => [newRecord, ...prev])
        toast.success('New product added!')
        break
      case 'UPDATE':
        setProducts(prev => prev.map(p => 
          p.id === newRecord.id ? {
            ...p,
            currentPrice: newRecord.current_price,
            priceHistory: newRecord.price_history
          } : p
        ))
        break
      case 'DELETE':
        setProducts(prev => prev.filter(p => p.id !== oldRecord.id))
        toast.info('Product removed')
        break
      default:
        break
    }
  }

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      return
    }

    try {
      await deleteProduct(productId)
      setProducts(products.filter(p => p.id !== productId))
      toast.success('Product deleted successfully')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your tracked products...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>❌ Error Loading Products</h3>
        <p>{error}</p>
        <button onClick={fetchProducts} className="retry-btn">
          🔄 Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="product-list">
      <div className="list-header">
        <h2>📊 Tracked Products ({products.length})</h2>
        <button onClick={fetchProducts} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <h3>🎯 No Products Tracked Yet</h3>
          <p>Start by adding an Amazon product URL above</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="image-placeholder">📦</div>
                )}
              </div>
              
              <div className="product-info">
                <h3 className="product-name" title={product.name}>
                  {product.name}
                </h3>
                
                <div className="price-info">
                  <span className="current-price">
                    {formatPrice(product.currentPrice)}
                  </span>
                </div>
                
                <div className="product-meta">
                  <span className="track-date">
                    Tracked: {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                  <span className="price-history">
                    {product.priceHistory?.length || 0} price updates
                  </span>
                </div>
              </div>
              
              <div className="product-actions">
                <button 
                  onClick={() => window.open(product.url, '_blank')}
                  className="action-btn primary"
                >
                  🛒 View Product
                </button>
                
                <button 
                  onClick={() => setSelectedProduct(product)}
                  className="action-btn secondary"
                >
                  📈 Details
                </button>
                
                <button 
                  onClick={() => handleDeleteProduct(product.id, product.name)}
                  className="action-btn danger"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedProduct.name}</h3>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="close-btn"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="price-chart-section">
                <h4>📈 Price History</h4>
                <PriceChart priceHistory={selectedProduct.priceHistory} />
              </div>
              
              <div className="alerts-section">
                <h4>🔔 Price Alerts</h4>
                <AlertManager productId={selectedProduct.id} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductList
