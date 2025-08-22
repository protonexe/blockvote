import React from "react";

export default function WalletInfo({ address }) {
  return (
    <div className="wallet">
      <strong>Burner Wallet:</strong>
      <br />
      <span style={{ wordBreak: "break-all" }}>{address}</span>
    </div>
  );
}