import React from "react";
import { Routes, Route } from "react-router-dom";
import VotingPage from "./VotingPage";
import Admin from "./Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<VotingPage />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}