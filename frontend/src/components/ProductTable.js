import React from "react";

export default function ProductTable({ products, onSelect, selected }) {
  return (
    <div>
      <h3 style={{
        marginBottom: "16px",
        fontWeight: 600,
        color: "#222"
      }}>
        Tracked Products
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {products.map((product) => {
          const isSelected = selected && selected.id === product.id;
          return (
            <li
              key={product.id}
              className="product-table-row"
              onClick={() => onSelect(product)}
              tabIndex={0}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem",
                marginBottom: "12px",
                borderRadius: "8px",
                background: isSelected ? "#e0e7ff" : "#fff",
                boxShadow: isSelected
                  ? "0 2px 8px rgba(37,99,235,0.12)"
                  : "0 1px 4px rgba(0,0,0,0.04)",
                border: isSelected
                  ? "2px solid #2563eb"
                  : "1px solid #e5e7eb",
                cursor: "pointer",
                transition: "background 0.2s, box-shadow 0.2s, border 0.2s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = isSelected ? "#e0e7ff" : "#f1f5fd";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(37,99,235,0.10)";
                e.currentTarget.style.borderColor = isSelected ? "#2563eb" : "#93c5fd";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = isSelected ? "#e0e7ff" : "#fff";
                e.currentTarget.style.boxShadow = isSelected
                  ? "0 2px 8px rgba(37,99,235,0.12)"
                  : "0 1px 4px rgba(0,0,0,0.04)";
                e.currentTarget.style.borderColor = isSelected ? "#2563eb" : "#e5e7eb";
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: "56px",
                  height: "56px",
                  objectFit: "contain",
                  borderRadius: "6px",
                  background: "#f3f4f6",
                  border: "1px solid #e5e7eb"
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: "1.08rem",
                    marginBottom: "4px",
                    color: "#222"
                  }}
                >
                  {product.name}
                </div>
                <div
                  style={{
                    color: "#2563eb",
                    fontWeight: 600,
                    fontSize: "1.06rem"
                  }}
                >
                  ₹{product.currentPrice}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
