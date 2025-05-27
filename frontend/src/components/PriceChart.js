import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const PriceChart = ({ priceHistory }) => {
  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="chart-placeholder">
        <p>📈 No price history available yet</p>
      </div>
    )
  }

  // Format data for chart
  const chartData = priceHistory.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    price: entry.price,
    fullDate: new Date(entry.date).toLocaleString()
  }))

  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="chart-tooltip">
          <p className="tooltip-date">{data.fullDate}</p>
          <p className="tooltip-price">
            Price: {formatPrice(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="price-chart">
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatPrice}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#ff6b35" 
              strokeWidth={2}
              dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ff6b35', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Make sure this is a default export
export default PriceChart
