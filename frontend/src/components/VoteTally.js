import React from "react";

export default function VoteTally({ candidates, voteCounts }) {
  return (
    <div className="results">
      <h3>📊 Live Vote Tally</h3>
      <ul className="vote-tally-list">
        {candidates.map((name, idx) => (
          <li key={idx} className="vote-tally-item">
            <span className="candidate-name">{name}</span>
            <span className="vote-count">
              {voteCounts[name] ?? "0"}{" "}
              <span className="vote-label">
                vote{(voteCounts[name] ?? "0") === "1" ? "" : "s"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}