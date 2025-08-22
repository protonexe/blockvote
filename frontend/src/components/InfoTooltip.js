import React from "react";
import "./InfoTooltip.css";

export default function InfoTooltip({ text }) {
  return (
    <span className="info-icon" tabIndex="0">
      ℹ️
      <span className="tooltip">{text}</span>
    </span>
  );
}