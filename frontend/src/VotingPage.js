import React, { useState, useEffect, useCallback } from "react";
import { JsonRpcProvider, Wallet, Contract, parseEther } from "ethers";
import { useLocation } from "react-router-dom";
import VotingABI from "./abi/VotingABI.json";
import confetti from "canvas-confetti";
import deployed from "./deployedAddress.json";

// Hooks & Components
import useTheme from "./hooks/useTheme";
import WalletInfo from "./components/WalletInfo";
import VoteForm from "./components/VoteForm";
import Message from "./components/Message";
import ThemeToggle from "./components/ThemeToggle";

const CONTRACT_ADDRESS = deployed.address;

export default function VotingPage() {
  const [theme, toggleTheme] = useTheme();
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [voterId, setVoterId] = useState("");
  const [addressHasVoted, setAddressHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [votingDeadline, setVotingDeadline] = useState(0);

  const location = useLocation();

  // Detect logout
  useEffect(() => {
    if (location.search.includes("loggedOut=true")) {
      setMessage("✅ Successfully logged out");
      window.history.replaceState({}, document.title, "/");
    }
  }, [location]);

  // Initialize
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setIsLoading(true);
        const provider = new JsonRpcProvider(
          process.env.REACT_APP_RPC_URL || "http://127.0.0.1:8545"
        );
        if (mounted) setProvider(provider);

        let storedPk = localStorage.getItem("burnerPrivateKey");
        let burner =
          storedPk && storedPk.length > 0
            ? new Wallet(storedPk).connect(provider)
            : Wallet.createRandom().connect(provider);

        if (!storedPk) {
          localStorage.setItem("burnerPrivateKey", burner.privateKey);
        }

        const balance = await provider.getBalance(burner.address);
        if (balance < parseEther("0.01")) {
          try {
            const deployerWallet = new Wallet(
              "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
              provider
            );
            const fundTx = await deployerWallet.sendTransaction({
              to: burner.address,
              value: parseEther("1.0")
            });
            await fundTx.wait();
          } catch (err) {
            console.error("Auto-funding failed:", err);
          }
        }

        const contract = new Contract(CONTRACT_ADDRESS, VotingABI, burner);
        const list = await contract.getCandidates();
        const deadline = await contract.getVotingDeadline();
        const deadlineNum =
          typeof deadline === "bigint" ? Number(deadline) : deadline;

        if (mounted) {
          setWallet(burner);
          setContract(contract);
          setCandidates(list);
          setVotingDeadline(deadlineNum);
        }
      } catch (err) {
        console.error("Init error:", err);
        setMessage("❌ Initialization failed");
      } finally {
        setIsLoading(false);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Check voting status
  useEffect(() => {
    const checkAddressVoted = async () => {
      if (contract && wallet) {
        try {
          const voted = await contract.hasAddressVotedFn(wallet.address);
          setAddressHasVoted(voted);
        } catch {
          setAddressHasVoted(false);
        }
      }
    };
    checkAddressVoted();
  }, [contract, wallet]);

  // Handle vote
  const handleVote = async () => {
    if (addressHasVoted) return setMessage("❌ This wallet has already voted");
    if (!voterId) return setMessage("❌ Please enter your Voter ID");
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(voterId))
      return setMessage("❌ Invalid Voter ID format");
    if (!selectedCandidate) return setMessage("❌ Please select a candidate");

    try {
      setIsVoting(true);
      setMessage("🔄 Processing vote...");
      setTxHash("");
      
      const reg = await contract.isVoterIdRegistered(voterId);
      const voted = await contract.hasVoterIdVoted(voterId);

      if (!reg) {
        setMessage("❌ Voter ID not registered");
        setIsVoting(false);
        return;
      }
      if (voted) {
        setMessage("❌ This Voter ID has already voted");
        setIsVoting(false);
        return;
      }

      setMessage("🔄 Submitting to blockchain...");
      const tx = await contract.vote(voterId, selectedCandidate);
      await tx.wait();

      confetti({ 
        particleCount: 80, 
        spread: 50,
        colors: ['#2962ff', '#26a69a', '#787b86']
      });
      setMessage(`✅ Vote recorded for ${selectedCandidate}`);
      setTxHash(tx.hash);
      setAddressHasVoted(true);
    } catch (err) {
      console.error("Vote error:", err);
      setMessage(`❌ Transaction failed`);
    } finally {
      setIsVoting(false);
    }
  };

  const resetBurner = () => {
    localStorage.removeItem("burnerPrivateKey");
    window.location.reload();
  };

  return (
    <>
      {/* TradingView style header */}
      <div className="top-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "16px", fontWeight: "500", color: "var(--tv-color-text)" }}>
            🗳️ Blockchain Voting
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <a href="/admin" className="tv-button-secondary" style={{ padding: "6px 16px" }}>
            Admin Panel
          </a>
        </div>
      </div>

      <div className="main-content">
        <div className="container">
          <header>
            <h1>Decentralized Voting System</h1>
            <p>Secure on-chain voting powered by blockchain technology</p>
          </header>

          <div className="tv-grid">
            {/* Main voting panel */}
            <div className="tv-section">
              <h2>Cast Your Vote</h2>
              <Message message={message} txHash={txHash} />
              {wallet && <WalletInfo address={wallet.address} />}
              {isLoading ? (
                <p style={{ textAlign: "center", color: "var(--tv-color-text-secondary)" }}>
                  Loading contract data...
                </p>
              ) : (
                <VoteForm
                  voterId={voterId}
                  setVoterId={setVoterId}
                  selectedCandidate={selectedCandidate}
                  setSelectedCandidate={setSelectedCandidate}
                  candidates={candidates}
                  onVote={handleVote}
                  disabled={addressHasVoted}
                  isVoting={isVoting}
                  votingDeadline={votingDeadline}
                  onResetWallet={resetBurner}
                />
              )}
            </div>

            {/* Project Information panel */}
            <div className="tv-section">
              <h2>About This Project</h2>
              <div style={{ fontSize: "13px", lineHeight: "1.8", color: "var(--tv-color-text)" }}>
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--tv-color-text)" }}>
                    🔐 Secure & Transparent
                  </h3>
                  <p style={{ margin: 0, color: "var(--tv-color-text-secondary)" }}>
                    Every vote is recorded on the Ethereum blockchain, ensuring complete transparency 
                    and immutability. Once cast, votes cannot be altered or deleted.
                  </p>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--tv-color-text)" }}>
                    🎭 Privacy Protected
                  </h3>
                  <p style={{ margin: 0, color: "var(--tv-color-text-secondary)" }}>
                    Voter IDs are hashed before storage, maintaining voter privacy while preventing 
                    duplicate votes. Each voter can only vote once per election.
                  </p>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--tv-color-text)" }}>
                    💎 NFT Receipt
                  </h3>
                  <p style={{ margin: 0, color: "var(--tv-color-text-secondary)" }}>
                    After voting, you receive an NFT as proof of participation. This digital receipt 
                    serves as a tamper-proof record of your civic engagement.
                  </p>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--tv-color-text)" }}>
                    ⚡ How It Works
                  </h3>
                  <ol style={{ 
                    margin: 0, 
                    paddingLeft: "20px", 
                    color: "var(--tv-color-text-secondary)",
                    listStyle: "decimal"
                  }}>
                    <li style={{ marginBottom: "4px" }}>Enter your registered Voter ID</li>
                    <li style={{ marginBottom: "4px" }}>Select your preferred candidate</li>
                    <li style={{ marginBottom: "4px" }}>Submit your vote to the blockchain</li>
                    <li style={{ marginBottom: "4px" }}>Receive your voting NFT receipt</li>
                  </ol>
                </div>

                <div style={{
                  borderTop: "1px solid var(--tv-color-border)",
                  paddingTop: "16px",
                  marginTop: "20px"
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    fontSize: "11px",
                    color: "var(--tv-color-text-secondary)"
                  }}>
                    <span>📄</span>
                    <span>Smart Contract: {CONTRACT_ADDRESS.slice(0, 8)}...{CONTRACT_ADDRESS.slice(-6)}</span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    fontSize: "11px",
                    color: "var(--tv-color-text-secondary)",
                    marginTop: "8px"
                  }}>
                    <span>⛓️</span>
                    <span>Network: Ethereum (Hardhat Local)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer>
            Built by{" "}
            <a
              href="https://github.com/protonexe"
              target="_blank"
              rel="noreferrer"
            >
              protonexe
            </a>
          </footer>
        </div>
      </div>
    </>
  );
}