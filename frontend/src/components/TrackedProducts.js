import React, { useEffect, useState } from "react";
import axios from "axios";

export default function TrackedProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/products")
      .then((res) => {
        if (res.data.success) {
          setProducts(res.data.products);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch tracked products:", err);
      });
  }, []);

  const styles = {
    container: {
      padding: "20px",
      fontFamily: "Arial, sans-serif",
    },
    heading: {
      fontSize: "24px",
      marginBottom: "20px",
    },
    card: {
      display: "flex",
      gap: "20px",
      padding: "20px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      backgroundColor: "#fafafa",
      marginBottom: "20px",
    },
    image: {
      width: "150px",
      height: "auto",
      borderRadius: "8px",
    },
    info: {
      flex: 1,
    },
    nameLink: {
      fontSize: "20px",
      color: "#0073e6",
      textDecoration: "none",
    },
    price: {
      margin: "8px 0",
    },
    historyList: {
      paddingLeft: "20px",
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>🛒 Tracked Products</h1>
      {products.length === 0 ? (
        <p>No products tracked yet.</p>
      ) : (
        products.map((product) => (
          <div key={product.id || product.url} style={styles.card}>
            <img src={product.image} alt={product.name} style={styles.image} />
            <div style={styles.info}>
              <h2>
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.nameLink}
                >
                  {product.name}
                </a>
              </h2>
              <p style={styles.price}>
                <strong>Current Price:</strong> ₹{parseFloat(product.currentPrice).toFixed(2)}
              </p>
              <p style={styles.price}>
                <strong>Alert Price:</strong> {product.alert ?? "—"}
              </p>
              <h4>Price History:</h4>
              {Array.isArray(product.priceHistory) && product.priceHistory.length > 0 ? (
                <ul style={styles.historyList}>
                  {product.priceHistory.map((entry, index) => (
                    <li key={index}>
                      {entry.date}: ₹{parseFloat(entry.price).toFixed(2)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No price history available.</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
