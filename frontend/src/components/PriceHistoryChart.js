import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PriceHistoryChart({ product }) {
  if (!product || !product.priceHistory || product.priceHistory.length === 0) {
    return (
      <div style={{ 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#f9fafb'
      }}>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>No price history available</p>
      </div>
    );
  }

  // Format data for the chart
  const chartData = product.priceHistory.map((entry, index) => ({
    index: index + 1,
    price: parseFloat(entry.price) || 0,
    date: entry.date ? new Date(entry.date).toLocaleDateString() : `Day ${index + 1}`,
    timestamp: entry.timestamp || entry.date || Date.now()
  }));

  // Calculate price range for better Y-axis scaling
  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1; // 10% padding
  
  const yAxisMin = Math.max(0, minPrice - padding);
  const yAxisMax = maxPrice + padding;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>
            ₹{data.price.toFixed(2)}
          </p>
          <p style={{ margin: '0', color: '#6b7280', fontSize: '12px' }}>
            {data.date}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '400px',
      padding: '20px',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ 
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '18px', 
          fontWeight: '600',
          color: '#374151'
        }}>
          Price History
        </h3>
        <div style={{ 
          fontSize: '14px', 
          color: '#6b7280' 
        }}>
          {chartData.length} data points
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#f3f4f6"
            horizontal={true}
            vertical={false}
          />
          <XAxis 
            dataKey="date"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
            axisLine={{ stroke: '#d1d5db' }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={Math.max(0, Math.floor(chartData.length / 8))} // Show max 8 labels
          />
          <YAxis 
            domain={[yAxisMin, yAxisMax]}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
            axisLine={{ stroke: '#d1d5db' }}
            tickFormatter={(value) => `₹${value.toFixed(0)}`}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#2563eb" 
            strokeWidth={3}
            dot={{ 
              fill: '#2563eb', 
              strokeWidth: 2, 
              stroke: '#ffffff',
              r: 5
            }}
            activeDot={{ 
              r: 7, 
              stroke: '#2563eb',
              strokeWidth: 3,
              fill: '#ffffff'
            }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Price summary */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        gap: '20px',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        <div>
          <span style={{ fontWeight: '500' }}>Current: </span>
          ₹{prices[prices.length - 1]?.toFixed(2) || '0.00'}
        </div>
        <div>
          <span style={{ fontWeight: '500' }}>Lowest: </span>
          ₹{minPrice.toFixed(2)}
        </div>
        <div>
          <span style={{ fontWeight: '500' }}>Highest: </span>
          ₹{maxPrice.toFixed(2)}
        </div>
        {prices.length > 1 && (
          <div>
            <span style={{ fontWeight: '500' }}>Change: </span>
            <span style={{ 
              color: prices[prices.length - 1] > prices[0] ? '#dc2626' : '#16a34a'
            }}>
              {prices[prices.length - 1] > prices[0] ? '+' : ''}
              {((prices[prices.length - 1] - prices[0]) / prices[0] * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}