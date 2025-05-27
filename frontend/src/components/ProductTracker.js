import React, { useState } from 'react'
import { trackProduct } from '../services/api'
import { toast } from 'react-toastify'

const ProductTracker = ({ onProductAdded }) => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!url.trim()) {
      toast.error('Please enter a product URL')
      return
    }

    if (!url.includes('amazon.')) {
      toast.error('Please enter a valid Amazon product URL')
      return
    }

    try {
      setLoading(true)
      
      const response = await trackProduct(url.trim())
      
      if (response.success) {
        toast.success('Product added successfully!')
        setUrl('')
        onProductAdded && onProductAdded(response.product)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="product-tracker">
      <div className="tracker-header">
        <h2>🔍 Track New Product</h2>
        <p>Enter an Amazon product URL to start tracking its price</p>
      </div>
      
      <form onSubmit={handleSubmit} className="tracker-form">
        <div className="form-group">
          <label htmlFor="url">Amazon Product URL:</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.amazon.in/product-name/dp/XXXXXXXXXX"
            required
            disabled={loading}
          />
          <small className="form-help">
            Copy and paste the Amazon product URL from your browser
          </small>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className={`submit-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Adding Product...
            </>
          ) : (
            '🎯 Track Product'
          )}
        </button>
      </form>
    </div>
  )
}

export default ProductTracker
