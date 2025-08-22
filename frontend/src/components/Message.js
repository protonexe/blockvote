import React from "react";

export default function Message({ message, txHash }) {
  if (!message) return null;
  const isSuccess = message.startsWith("✅");
  const isError = message.startsWith("❌");
  return (
    <div className={`message ${isSuccess ? "success" : isError ? "error" : ""}`} role="alert">
      {message}
      {txHash && (
        <div style={{ marginTop: "0.5rem" }}>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)", textDecoration: "underline" }}
          >
            View Transaction
          </a>
        </div>
      )}
    </div>
  );
}