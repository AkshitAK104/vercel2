import React from "react";
import { Link } from "react-router-dom";
import "../App.css";

const menu = [
  { name: "Dashboard", icon: "📊", path: "/" },
  { name: "Tracked Products", icon: "🛒", path: "/tracked-products" },
  { name: "Price Alerts", icon: "🔔", path: "/price-alerts" },
  { name: "Settings", icon: "⚙️", path: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-title">PricePulse</span>
      </div>
      <nav className="sidebar-menu">
        {menu.map((item) => (
          <Link to={item.path} key={item.name} className="sidebar-menu-item">
            <span className="sidebar-menu-icon">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
