import React, { useState } from "react";

export default function AdminLogin({ onLogin, error }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);

  return (
    <div className="admin-login-glass">
      <div className="admin-banner">
        <span role="img" aria-label="shield" className="admin-banner-icon">🛡️</span>
        <span className="admin-banner-title">Admin Panel</span>
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          onLogin(user, pass);
        }}
        autoComplete="off"
        style={{ position: "relative", zIndex: 1, width: "100%" }}
      >
        <label className="admin-label">Username</label>
        <input
          type="text"
          value={user}
          onChange={e => setUser(e.target.value)}
          className="admin-input"
          placeholder="Username"
          autoFocus
        />
        <label className="admin-label">Password</label>
        <div className="admin-password-row">
          <span className="admin-lock-icon">🔒</span>
          <input
            type={show ? "text" : "password"}
            value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="••••••••"
            className="admin-input"
          />
          <button
            type="button"
            className="admin-show-btn"
            onClick={() => setShow(s => !s)}
            tabIndex={-1}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? "🙈" : "👁️"}
          </button>
        </div>
        {error && <div className="message error">{error}</div>}
        <button
          type="submit"
          className="admin-login-btn"
          disabled={!user || !pass}
        >
          🔓 Login
        </button>
      </form>
      <div className="admin-footer-note">
        <span role="img" aria-label="info">ℹ️</span>
        &nbsp;For authorized administrators only.
      </div>
    </div>
  );
}