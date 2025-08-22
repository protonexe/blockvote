import React, { useState } from "react";
import InfoTooltip from "./InfoTooltip";

export default function VoteForm({
  voterId,
  setVoterId,
  selectedCandidate,
  setSelectedCandidate,
  candidates,
  onVote,
  disabled,
  isVoting,
  votingDeadline,
  onResetWallet,
}) {
  const [voterIdError, setVoterIdError] = useState("");

  const validateVoterId = (id) => {
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(id)) {
      setVoterIdError("Voter ID must be 3-32 letters, numbers, _ or -.");
      return false;
    }
    setVoterIdError("");
    return true;
  };

  const deadlineNum = votingDeadline ? Number(votingDeadline) : 0;

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (validateVoterId(voterId)) onVote();
      }}
      autoComplete="off"
    >
      <label htmlFor="voter-id-input">
        Enter Your Voter ID
        <InfoTooltip text="Your unique voter ID, provided by the admin." />
      </label>
      <input
        id="voter-id-input"
        type="text"
        placeholder="e.g. student001"
        value={voterId}
        onChange={e => {
          setVoterId(e.target.value);
          validateVoterId(e.target.value);
        }}
        aria-label="Voter ID"
        disabled={disabled}
        style={voterIdError ? { borderColor: "red" } : {}}
      />
      {voterIdError && <div className="message error">{voterIdError}</div>}

      <label htmlFor="candidate-select">
        Select Candidate
        <InfoTooltip text="Choose your preferred candidate." />
      </label>
      <select
        id="candidate-select"
        value={selectedCandidate}
        onChange={e => setSelectedCandidate(e.target.value)}
        aria-label="Candidate selection"
        disabled={disabled}
      >
        <option disabled value="">
          ⬇️ Select
        </option>
        {candidates.map((name, idx) => (
          <option key={idx} value={name}>
            {name}
          </option>
        ))}
      </select>

      {/* Button group: side by side, full width */}
      <div className="button-row">
        <button
          type="submit"
          disabled={
            !selectedCandidate ||
            !voterId ||
            !!voterIdError ||
            disabled ||
            isVoting
          }
          aria-label="Vote"
          className="vote-btn"
        >
          {isVoting ? "⏳ Voting..." : "✅ Vote"}
        </button>
        <button
          type="button"
          onClick={onResetWallet}
          className="reset-btn"
        >
          🔄 Reset Wallet
        </button>
      </div>

      {/* Voting ends info below buttons */}
      <div className="voting-ends-info">
        Voting ends: {deadlineNum
          ? new Date(deadlineNum * 1000).toLocaleString()
          : "N/A"}
      </div>
    </form>
  );
}