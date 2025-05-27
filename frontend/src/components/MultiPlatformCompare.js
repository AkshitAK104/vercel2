import React, { useState } from "react";
import axios from "axios";

export default function MultiPlatformCompare() {
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
    <div className="multi-platform-compare" style={{ margin: "2rem 0", background: "#f8f9fa", padding: "1rem", borderRadius: "8px" }}>
      <h3>Compare Prices Across Platforms</h3>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste Amazon product URL"
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <button onClick={handleCompare} disabled={loading || !url} style={{ padding: "0.5rem 1rem" }}>
          {loading ? "Comparing..." : "Compare"}
        </button>
      </div>
      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
      {results.length > 0 && (
        <table border="1" cellPadding="8" style={{ marginTop: "1rem", width: "100%", background: "#fff" }}>
          <thead>
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
                <td>{r.price !== null && r.price !== undefined && r.price !== "" ? `₹${r.price}` : "N/A"}</td>
                <td>
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer">View</a>
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
