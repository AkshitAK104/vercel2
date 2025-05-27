import { supabase, handleSupabaseError } from '../config/supabase'
import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// === PRODUCT TRACKING ===
export const trackProduct = async (url) => {
  try {
    const response = await apiClient.post('/track-product', { url })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to track product')
  }
}

// === GET PRODUCTS ===
export const getProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      products: data.map(row => ({
        id: row.id,
        name: row.name,
        url: row.url,
        image: row.image,
        currentPrice: row.current_price,
        priceHistory: row.price_history || [],
        createdAt: row.created_at,
      }))
    }
  } catch (error) {
    throw new Error(handleSupabaseError(error))
  }
}

// === DELETE PRODUCT ===
export const deleteProduct = async (productId) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) throw error

    return { success: true, message: 'Product deleted successfully' }
  } catch (error) {
    throw new Error(handleSupabaseError(error))
  }
}

// === CREATE ALERT ===
export const createAlert = async (productId, email, threshold) => {
  try {
    const response = await apiClient.post('/api/alerts', {
      productId,
      email,
      threshold: parseFloat(threshold)
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create alert')
  }
}

// === GET PRODUCT ALERTS ===
export const getProductAlerts = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, alerts: data }
  } catch (error) {
    throw new Error(handleSupabaseError(error))
  }
}

// === HEALTH CHECK ===
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/')
    return response.data
  } catch (error) {
    throw new Error('Backend server is not responding')
  }
}
