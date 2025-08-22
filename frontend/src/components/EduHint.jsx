import React from "react";

export default function EduHint({ children }) {
  return (
    <div className="edu-hint" style={{
      background: "rgba(7,218,218,0.08)",
      borderLeft: "4px solid var(--accent)",
      padding: "1rem",
      borderRadius: "0.7rem",
      margin: "1rem 0",
      color: "var(--accent)"
    }}>
      <span style={{ fontWeight: 700, marginRight: 8 }}>💡 Hint:</span>
      {children}
    </div>
  );
}