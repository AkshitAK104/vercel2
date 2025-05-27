import React, { useState } from "react";

export default function PriceAlerts({ productId }) {
  const [email, setEmail] = useState("");
  const [threshold, setThreshold] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, email, threshold }),
    });

    if (response.ok) {
      setSubmitted(true);
      setEmail("");
      setThreshold("");
    } else {
      alert("Failed to save alert.");
    }
  };

  return (
    <div style={styles.container}>
      {submitted ? (
        <>
          <div style={styles.icon}>✅</div>
          <h2 style={styles.text}>Alert Created!</h2>
          <p style={styles.subtext}>We’ll notify you when the price drops.</p>
        </>
      ) : (
        <>
          <div style={styles.icon}>🔔</div>
          <h2 style={styles.text}>Set a Price Alert</h2>
          <p style={styles.subtext}>Get notified when your product drops below a price.</p>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              style={styles.input}
              placeholder="Your Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              style={styles.input}
              placeholder="Price Threshold (e.g., 2999)"
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              required
            />
            <button type="submit" style={styles.button}>
              Set Alert
            </button>
          </form>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    margin: "60px auto",
    padding: "40px 20px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
    textAlign: "center",
    color: "#444",
  },
  icon: {
    fontSize: "3rem",
    marginBottom: "16px",
    color: "#364fc7",
  },
  text: {
    fontSize: "1.5rem",
    marginBottom: "8px",
  },
  subtext: {
    fontSize: "1rem",
    color: "#666",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "1rem",
  },
  button: {
    padding: "12px",
    backgroundColor: "#364fc7",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "1rem",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
