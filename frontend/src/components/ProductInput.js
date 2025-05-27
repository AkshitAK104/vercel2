import React, { useState } from "react";
import "../App.css";

export default function ProductInput({ onAdd }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/track-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        onAdd(data.product);
      } else {
        alert("Failed to fetch product. Try another URL.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Server error. Please make sure the backend is running.");
    }

    setUrl("");
    setLoading(false);
  };

  return (
    <form onSubmit={handleAdd} className="product-input-form">
      <input
        className="product-input-field"
        type="url"
        placeholder="Paste Amazon product URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <button
        type="submit"
        className="product-input-btn"
        disabled={loading}
      >
        {loading ? "Adding..." : "Track Product"}
      </button>
    </form>
  );
}
