import React, { useEffect, useState } from "react";
import axios from "axios";
import ProductInput from "./ProductInput";
import ProductTable from "./ProductTable";
import PriceHistoryChart from "./PriceHistoryChart";
import "../App.css";

// --- Multi-Platform Compare Component ---
function MultiPlatformCompare() {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCompare = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await axios.post("http://localhost:5000/api/multiplatform/compare", { url });
      if (res.data && res.data.success) {
        setResults(res.data.results);
        if (
          !res.data.results.some(
            (r) => r.price !== null && r.price !== undefined && r.price !== ""
          )
        ) {
          setError("No prices found. Try a different product or check your backend.");
        }
      } else {
        setError("Comparison failed. Please check the URL or try again.");
      }
    } catch (err) {
      setError("Comparison failed. Please check your connection or backend.");
    }
    setLoading(false);
  };

  return (
    <div
      className="multi-platform-compare"
      style={{
        margin: "2rem 0",
        background: "#f8f9fa",
        padding: "1.5rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <h3 style={{ marginBottom: "1rem" }}>Compare Prices Across Platforms (AI-powered)</h3>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste Amazon product URL"
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
        />
        <button
          onClick={handleCompare}
          disabled={loading || !url}
          style={{
            padding: "0.5rem 1.2rem",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: loading || !url ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Comparing..." : "Compare"}
        </button>
      </div>
      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
      )}
      {results.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          style={{
            marginTop: "1rem",
            width: "100%",
            background: "#fff",
            borderCollapse: "collapse",
          }}
        >
          <thead style={{ background: "#e5e7eb" }}>
            <tr>
              <th>Platform</th>
              <th>Product Name</th>
              <th>Price</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td>{r.platform}</td>
                <td>{r.name || "—"}</td>
                <td>
                  {r.price !== null && r.price !== undefined && r.price !== ""
                    ? `₹${r.price}`
                    : "N/A"}
                </td>
                <td>
                  {r.url ? (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#2563eb" }}
                    >
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// --- Price Alert Form Component ---
function PriceAlertForm({ productId, onAlertSet }) {
  const [email, setEmail] = useState("");
  const [threshold, setThreshold] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      await axios.post("http://localhost:5000/api/alerts", {
        productId,
        email,
        threshold,
      });
      setMsg("Alert set!");
      setEmail("");
      setThreshold("");
      onAlertSet && onAlertSet();
    } catch {
      setMsg("Failed to set alert.");
    }
    setLoading(false);
  };

  return (
    <div 
      style={{ 
        marginTop: "2rem",
        padding: "1.5rem",
        background: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #e1e5e9"
      }}
    >
      <h3 style={{ marginBottom: "1rem", color: "#333" }}>Set Price Alert</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          required
          placeholder="Your email"
          onChange={e => setEmail(e.target.value)}
          style={{ 
            padding: "0.6rem", 
            borderRadius: "4px", 
            border: "1px solid #ccc",
            minWidth: "200px",
            fontSize: "0.9rem"
          }}
        />
        <input
          type="number"
          value={threshold}
          required
          placeholder="Price threshold"
          onChange={e => setThreshold(e.target.value)}
          style={{ 
            width: "140px", 
            padding: "0.6rem", 
            borderRadius: "4px", 
            border: "1px solid #ccc",
            fontSize: "0.9rem"
          }}
        />
        <button 
          type="submit" 
          disabled={loading || !email || !threshold} 
          style={{ 
            padding: "0.6rem 1.2rem", 
            borderRadius: "4px", 
            background: "#2563eb", 
            color: "#fff", 
            border: "none",
            fontWeight: "500",
            cursor: loading || !email || !threshold ? "not-allowed" : "pointer",
            opacity: loading || !email || !threshold ? 0.6 : 1
          }}
        >
          {loading ? "Saving..." : "Set Alert"}
        </button>
        {msg && (
          <span 
            style={{ 
              marginLeft: "0.5rem", 
              color: msg === "Alert set!" ? "#10b981" : "#ef4444",
              fontWeight: "500",
              fontSize: "0.9rem"
            }}
          >
            {msg}
          </span>
        )}
      </form>
    </div>
  );
}

// --- Main Dashboard Component ---
export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // ✅ Fetch products from backend initially and every 30 minutes
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/products");
        if (response.data.success) {
          setProducts(response.data.products);
          if (response.data.products.length > 0) {
            setSelectedProduct(response.data.products[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchProducts(); // Initial fetch

    const interval = setInterval(fetchProducts, 30 * 60 * 1000); // every 30 mins
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const addProduct = (product) => {
    setProducts([product, ...products]);
    setSelectedProduct(product);
  };

  // Count active alerts
  const activeAlerts = products.filter((p) => p.alert)?.length || 0;

  return (
    <main className="dashboard">
      <div className="dashboard-header">Amazon Price Tracker</div>
      <ProductInput onAdd={addProduct} />

      {/* Multi-Platform Compare Section */}
      <MultiPlatformCompare />

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-label">Tracked Products</div>
          <div className="summary-card-value">{products?.length || 0}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Active Alerts</div>
          <div className="summary-card-value">{activeAlerts}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Minimum Price</div>
          <div className="summary-card-value">
            {selectedProduct?.priceHistory?.length > 0
              ? `₹${Math.min(...selectedProduct.priceHistory.map((p) => p.price)).toFixed(2)}`
              : "—"}
          </div>
        </div>
      </div>

      <div className="dashboard-main-content">
        <div className="dashboard-left">
          <div className="chart-container">
            <h2 style={{ marginBottom: "10px" }}>
              {selectedProduct ? selectedProduct.name : "Select a product"}
            </h2>
            {selectedProduct && <PriceHistoryChart product={selectedProduct} />}
          </div>
          
          {/* Price Alert Form with proper spacing */}
          {selectedProduct && (
            <PriceAlertForm
              productId={selectedProduct.id}
              onAlertSet={() => {}}
            />
          )}
        </div>

        <div className="dashboard-right">
          <div className="table-container">
            <ProductTable
              products={products}
              onSelect={setSelectedProduct}
              selected={selectedProduct}
            />
          </div>
        </div>
      </div>
    </main>
  );
}