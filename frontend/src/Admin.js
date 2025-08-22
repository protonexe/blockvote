// C:\Users\Lenovo\blockchain\frontend\src\Admin.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import VotingABI from "./abi/VotingABI.json";
import deployed from "./deployedAddress.json";
import AdminLogin from "./AdminLogin";

const CONTRACT_ADDRESS = deployed.address;
const RPC_URL = process.env.REACT_APP_RPC_URL || "http://127.0.0.1:8545";

const ADMIN_USER = "admin";
const ADMIN_PASS = "password123";

function getOwnerWallet(provider) {
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  return new Wallet(privateKey, provider);
}

// Add styles as a constant
const animationStyles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @keyframes flash {
    0%, 100% { background: var(--tv-color-surface); }
    50% { background: rgba(38, 166, 154, 0.1); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// Add style tag to document head
if (typeof document !== 'undefined' && !document.getElementById('admin-animations')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'admin-animations';
  styleTag.innerHTML = animationStyles;
  document.head.appendChild(styleTag);
}

// ============= EXPORT DROPDOWN COMPONENT =============

function ExportDropdown({ stats, voteEvents }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportAsJSON = () => {
    if (!stats) return;
    
    const data = {
      exportDate: new Date().toISOString(),
      electionData: {
        totalVotes: stats.totalVotes,
        uniqueVoters: stats.uniqueVoters,
        participation: stats.participation,
        lastUpdate: stats.lastUpdate
      },
      candidates: stats.candidates,
      voteHistory: voteEvents.slice(0, 100).map(e => ({
        voter: e.args?.voter,
        candidate: e.args?.candidate || e.args?.[1],
        timestamp: e.args?.timestamp ? Number(e.args.timestamp) : null,
        blockNumber: e.blockNumber,
        transactionHash: e.transactionHash
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voting-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const exportAsCSV = () => {
    if (!stats) return;
    
    // Create CSV content
    let csv = 'Election Data Export\n';
    csv += `Export Date: ${new Date().toISOString()}\n`;
    csv += `Total Votes: ${stats.totalVotes}\n`;
    csv += `Unique Voters: ${stats.uniqueVoters}\n`;
    csv += `Participation: ${stats.participation}%\n\n`;
    
    csv += 'Candidate Results\n';
    csv += 'Candidate,Votes,Percentage\n';
    stats.candidates.forEach(c => {
      const percentage = stats.totalVotes > 0 ? ((c.votes/stats.totalVotes)*100).toFixed(2) : 0;
      csv += `${c.name},${c.votes},${percentage}%\n`;
    });
    
    csv += '\nVote History (Latest 100)\n';
    csv += 'Timestamp,Candidate,Voter,Block Number,Transaction Hash\n';
    voteEvents.slice(0, 100).forEach(event => {
      const timestamp = event.args?.timestamp ? 
        new Date(Number(event.args.timestamp) * 1000).toISOString() : 'N/A';
      const candidate = event.args?.candidate || event.args?.[1] || 'Unknown';
      const voter = event.args?.voter || 'Unknown';
      csv += `${timestamp},${candidate},${voter},${event.blockNumber},${event.transactionHash}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voting-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const exportAsHTML = () => {
    if (!stats) return;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Election Results - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 2px solid #26a69a; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .stat-box { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #26a69a; }
    .stat-label { color: #666; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #26a69a; color: white; }
    tr:hover { background: #f5f5f5; }
    .winner { background: #e8f5e9; font-weight: bold; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🗳️ Election Results Report</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    
    <div class="stats">
      <div class="stat-box">
        <div class="stat-value">${stats.totalVotes.toLocaleString()}</div>
        <div class="stat-label">Total Votes</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${stats.uniqueVoters}</div>
        <div class="stat-label">Unique Voters</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${stats.participation}%</div>
        <div class="stat-label">Participation Rate</div>
      </div>
    </div>
    
    <h2>📊 Candidate Results</h2>
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Candidate</th>
          <th>Votes</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${stats.candidates.map((c, i) => `
        <tr ${i === 0 ? 'class="winner"' : ''}>
          <td>#${i + 1}</td>
          <td>${c.name} ${i === 0 ? '🏆' : ''}</td>
          <td>${c.votes.toLocaleString()}</td>
          <td>${stats.totalVotes > 0 ? ((c.votes/stats.totalVotes)*100).toFixed(2) : 0}%</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="footer">
      <p>Blockchain Voting System - Powered by Ethereum</p>
      <p>Contract: ${CONTRACT_ADDRESS}</p>
    </div>
  </div>
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voting-report-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const exportAsMarkdown = () => {
    if (!stats) return;
    
    let md = `# Election Results Report\n\n`;
    md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    md += `## 📊 Summary\n\n`;
    md += `- **Total Votes:** ${stats.totalVotes.toLocaleString()}\n`;
    md += `- **Unique Voters:** ${stats.uniqueVoters}\n`;
    md += `- **Participation Rate:** ${stats.participation}%\n\n`;
    
    md += `## 🏆 Results\n\n`;
    md += `| Rank | Candidate | Votes | Percentage |\n`;
    md += `|------|-----------|-------|------------|\n`;
    stats.candidates.forEach((c, i) => {
      const percentage = stats.totalVotes > 0 ? ((c.votes/stats.totalVotes)*100).toFixed(2) : 0;
      md += `| #${i+1} | ${c.name} ${i === 0 ? '👑' : ''} | ${c.votes.toLocaleString()} | ${percentage}% |\n`;
    });
    
    md += `\n## 🔗 Blockchain Details\n\n`;
    md += `- **Contract Address:** \`${CONTRACT_ADDRESS}\`\n`;
    md += `- **Network:** Ethereum (Hardhat)\n`;
    md += `- **Export Date:** ${new Date().toISOString()}\n`;
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voting-report-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const copyToClipboard = () => {
    if (!stats) return;
    
    const text = `Election Results - ${new Date().toLocaleDateString()}\n\n` +
      `Total Votes: ${stats.totalVotes}\n` +
      `Unique Voters: ${stats.uniqueVoters}\n` +
      `Participation: ${stats.participation}%\n\n` +
      `Results:\n` +
      stats.candidates.map((c, i) => 
        `${i+1}. ${c.name}: ${c.votes} votes (${stats.totalVotes > 0 ? ((c.votes/stats.totalVotes)*100).toFixed(1) : 0}%)`
      ).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      setIsOpen(false);
      // You could show a toast notification here
    });
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: "6px 12px",
          fontSize: "12px",
          background: "var(--tv-color-surface)",
          border: "1px solid var(--tv-color-border)",
          borderRadius: "3px",
          color: "var(--tv-color-text)",
          cursor: "pointer",
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        📥 <span style={{ fontSize: '10px' }}>▼</span>
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          background: 'var(--tv-color-surface)',
          border: '1px solid var(--tv-color-border)',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '180px',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ padding: '4px' }}>
            {[
              { icon: '📄', label: 'Export as JSON', action: exportAsJSON },
              { icon: '📊', label: 'Export as CSV', action: exportAsCSV },
              { icon: '🌐', label: 'Export as HTML', action: exportAsHTML },
              { icon: '📝', label: 'Export as Markdown', action: exportAsMarkdown },
              { divider: true },
              { icon: '📋', label: 'Copy to Clipboard', action: copyToClipboard }
            ].map((item, index) => 
              item.divider ? (
                <div key={index} style={{
                  borderTop: '1px solid var(--tv-color-border)',
                  margin: '4px 0'
                }} />
              ) : (
                <button
                  key={index}
                  onClick={item.action}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '3px',
                    color: 'var(--tv-color-text)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--tv-color-bg-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============= CHART COMPONENTS =============

// Line Chart Component
function LineChart({ data, width = 600, height = 200, showGrid = true, color = '#26a69a' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, width, height);
    
    if (showGrid) {
      ctx.strokeStyle = 'rgba(120, 123, 134, 0.2)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i <= 5; i++) {
        const y = (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
    
    if (data.length > 1) {
      const maxValue = Math.max(...data.map(d => d.value), 1);
      const xStep = width / (data.length - 1);
      
      ctx.fillStyle = `${color}20`;
      ctx.beginPath();
      ctx.moveTo(0, height);
      data.forEach((point, i) => {
        const x = i * xStep;
        const y = height - (point.value / maxValue) * height * 0.9 - 10;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(width, height);
      ctx.fill();
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((point, i) => {
        const x = i * xStep;
        const y = height - (point.value / maxValue) * height * 0.9 - 10;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      ctx.fillStyle = color;
      data.forEach((point, i) => {
        const x = i * xStep;
        const y = height - (point.value / maxValue) * height * 0.9 - 10;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        if (i >= data.length - 3) {
          ctx.fillStyle = 'var(--tv-color-text-secondary)';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(point.value.toString(), x, y - 8);
          ctx.fillStyle = color;
        }
      });
    }
  }, [data, width, height, showGrid, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  );
}

// Pie Chart Component
function PieChart({ data, size = 200 }) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  const colors = ['#2962ff', '#26a69a', '#ff6e40', '#ab47bc', '#66bb6a', '#ffa726', '#ef5350'];
  
  if (!data || data.length === 0 || total === 0) {
    return (
      <div style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed var(--tv-color-border)',
        borderRadius: '50%',
        color: 'var(--tv-color-text-secondary)'
      }}>
        No votes yet
      </div>
    );
  }
  
  let currentAngle = -Math.PI / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) * 0.8;
  
  return (
    <div style={{ position: 'relative' }}>
      <svg width={size} height={size} style={{ margin: '0 auto', display: 'block' }}>
        {data.map((item, i) => {
          if (item.value === 0) return null;
          
          const percentage = item.value / total;
          const angle = percentage * 2 * Math.PI;
          const endAngle = currentAngle + angle;
          
          const x1 = centerX + radius * Math.cos(currentAngle);
          const y1 = centerY + radius * Math.sin(currentAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);
          
          const largeArc = angle > Math.PI ? 1 : 0;
          const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          
          const labelAngle = currentAngle + angle / 2;
          const labelRadius = radius * 0.7;
          const labelX = centerX + labelRadius * Math.cos(labelAngle);
          const labelY = centerY + labelRadius * Math.sin(labelAngle);
          
          currentAngle = endAngle;
          
          return (
            <g key={i}>
              <path 
                d={path} 
                fill={colors[i % colors.length]} 
                opacity="0.9"
                stroke="var(--tv-color-bg)"
                strokeWidth="2"
              />
              {percentage > 0.05 && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="600"
                >
                  {Math.round(percentage * 100)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ marginTop: '16px' }}>
        {data.map((item, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '4px',
            fontSize: '12px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: colors[i % colors.length],
              borderRadius: '2px'
            }} />
            <span>{item.name}: {item.value} ({Math.round((item.value/total)*100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= BLOCKCHAIN VISUALIZER COMPONENT =============

function BlockchainVisualizer({ provider, contract }) {
  const [transactions, setTransactions] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [networkStats, setNetworkStats] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [filter, setFilter] = useState('all');
  const processedTxs = useRef(new Set());
  const processedBlocks = useRef(new Set());

  useEffect(() => {
    if (!provider) return;

    let blockListener;
    let interval;

    const startMonitoring = async () => {
      try {
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        const gasPrice = await provider.getFeeData();
        
        setNetworkStats({
          chainId: Number(network.chainId),
          blockNumber,
          gasPrice: gasPrice.gasPrice ? Number(gasPrice.gasPrice) / 1e9 : 0
        });

        const processBlock = async (blockNumber) => {
          try {
            const blockKey = `block-${blockNumber}`;
            if (processedBlocks.current.has(blockKey)) return;
            processedBlocks.current.add(blockKey);

            const block = await provider.getBlock(blockNumber, true);
            if (!block) return;

            setBlocks(prev => {
              const filtered = prev.filter(b => b.number !== block.number);
              return [{
                number: block.number,
                hash: block.hash,
                timestamp: block.timestamp,
                gasUsed: block.gasUsed ? Number(block.gasUsed) : 0,
                gasLimit: block.gasLimit ? Number(block.gasLimit) : 0,
                transactions: block.transactions?.length || 0,
                miner: block.miner
              }, ...filtered].slice(0, 20);
            });

            if (block.transactions && block.transactions.length > 0) {
              for (const txHash of block.transactions) {
                const txKey = `tx-${txHash}`;
                if (processedTxs.current.has(txKey)) continue;
                processedTxs.current.add(txKey);

                try {
                  const tx = await provider.getTransaction(txHash);
                  const receipt = await provider.getTransactionReceipt(txHash);
                  
                  if (!tx) continue;

                  const isContractTx = contract && tx.to && (
                    tx.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
                  );

                  let functionName = 'Transfer';
                  if (isContractTx && tx.data && tx.data !== '0x') {
                    try {
                      const decoded = contract.interface.parseTransaction({ data: tx.data });
                      functionName = decoded?.name || 'Contract Call';
                    } catch (e) {
                      functionName = 'Contract Call';
                    }
                  }

                  const txData = {
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to || 'Contract Creation',
                    value: tx.value ? Number(tx.value) / 1e18 : 0,
                    gasPrice: tx.gasPrice ? Number(tx.gasPrice) / 1e9 : 0,
                    gasLimit: tx.gasLimit ? Number(tx.gasLimit) : 0,
                    gasUsed: receipt?.gasUsed ? Number(receipt.gasUsed) : 0,
                    blockNumber: block.number,
                    timestamp: block.timestamp,
                    status: receipt?.status === 1 ? 'success' : receipt?.status === 0 ? 'failed' : 'pending',
                    isContract: isContractTx,
                    functionName: isContractTx ? functionName : null,
                    logs: receipt?.logs?.length || 0
                  };

                  setTransactions(prev => [txData, ...prev].slice(0, 200));
                } catch (err) {
                  console.error('Error processing transaction:', err);
                }
              }
            }

            setNetworkStats(prev => ({
              ...prev,
              blockNumber: block.number,
              lastBlockTime: new Date(block.timestamp * 1000).toLocaleTimeString()
            }));

          } catch (err) {
            console.error('Error processing block:', err);
          }
        };

        blockListener = async (blockNumber) => {
          await processBlock(blockNumber);
        };

        provider.on('block', blockListener);
        setIsMonitoring(true);

        const currentBlock = await provider.getBlockNumber();
        for (let i = 0; i < 10; i++) {
          const blockNum = currentBlock - i;
          if (blockNum >= 0) {
            await processBlock(blockNum);
          }
        }

        interval = setInterval(async () => {
          try {
            const gasPrice = await provider.getFeeData();
            const currentBlock = await provider.getBlockNumber();
            setNetworkStats(prev => ({
              ...prev,
              gasPrice: gasPrice.gasPrice ? Number(gasPrice.gasPrice) / 1e9 : 0,
              blockNumber: currentBlock
            }));
          } catch (err) {
            console.error('Error updating network stats:', err);
          }
        }, 3000);

      } catch (err) {
        console.error('Error starting monitor:', err);
        setIsMonitoring(false);
      }
    };

    startMonitoring();

    return () => {
      if (blockListener) {
        provider.off('block', blockListener);
      }
      if (interval) {
        clearInterval(interval);
      }
      setIsMonitoring(false);
    };
  }, [provider, contract]);

  const filteredTransactions = useMemo(() => {
    switch (filter) {
      case 'contract':
        return transactions.filter(tx => tx.isContract);
      case 'success':
        return transactions.filter(tx => tx.status === 'success');
      case 'failed':
        return transactions.filter(tx => tx.status === 'failed');
      default:
        return transactions;
    }
  }, [transactions, filter]);

  const stats = useMemo(() => {
    const total = transactions.length;
    const successful = transactions.filter(tx => tx.status === 'success').length;
    const failed = transactions.filter(tx => tx.status === 'failed').length;
    const contractTxs = transactions.filter(tx => tx.isContract).length;
    const totalGasUsed = transactions.reduce((sum, tx) => sum + tx.gasUsed, 0);
    const avgGasPrice = transactions.length > 0 
      ? transactions.reduce((sum, tx) => sum + tx.gasPrice, 0) / transactions.length 
      : 0;

    return {
      total,
      successful,
      failed,
      contractTxs,
      totalGasUsed,
      avgGasPrice: avgGasPrice.toFixed(2),
      successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : 0
    };
  }, [transactions]);

  return (
    <div>
      <div style={{
        background: 'var(--tv-color-surface)',
        border: '1px solid var(--tv-color-border)',
        borderRadius: '4px',
        padding: '16px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              background: isMonitoring ? '#26a69a' : '#787b86',
              borderRadius: '50%',
              animation: isMonitoring ? 'pulse 2s infinite' : 'none'
            }} />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>
              HARDHAT NETWORK
            </span>
          </div>
          {networkStats && (
            <>
              <div style={{ fontSize: '12px' }}>
                <span style={{ color: 'var(--tv-color-text-secondary)' }}>Block:</span>{' '}
                <span style={{ fontWeight: '600' }}>#{networkStats.blockNumber}</span>
              </div>
              <div style={{ fontSize: '12px' }}>
                <span style={{ color: 'var(--tv-color-text-secondary)' }}>Gas:</span>{' '}
                <span style={{ fontWeight: '600' }}>{networkStats.gasPrice.toFixed(1)} Gwei</span>
              </div>
              <div style={{ fontSize: '12px' }}>
                <span style={{ color: 'var(--tv-color-text-secondary)' }}>Chain ID:</span>{' '}
                <span style={{ fontWeight: '600' }}>{networkStats.chainId}</span>
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'contract', 'success', 'failed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 12px',
                background: filter === f ? 'var(--tv-color-blue)' : 'transparent',
                color: filter === f ? 'white' : 'var(--tv-color-text)',
                border: '1px solid var(--tv-color-border)',
                borderRadius: '3px',
                fontSize: '11px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(6, 1fr)', 
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div className="tv-stat-card" style={{ padding: '12px' }}>
          <div className="tv-stat-label" style={{ fontSize: '10px' }}>Total TXs</div>
          <div className="tv-stat-value" style={{ fontSize: '20px' }}>{stats.total}</div>
        </div>
        <div className="tv-stat-card" style={{ padding: '12px' }}>
          <div className="tv-stat-label" style={{ fontSize: '10px' }}>Success</div>
          <div className="tv-stat-value" style={{ fontSize: '20px', color: '#26a69a' }}>
            {stats.successful}
          </div>
        </div>
        <div className="tv-stat-card" style={{ padding: '12px' }}>
          <div className="tv-stat-label" style={{ fontSize: '10px' }}>Failed</div>
          <div className="tv-stat-value" style={{ fontSize: '20px', color: '#ef5350' }}>
            {stats.failed}
          </div>
        </div>
        <div className="tv-stat-card" style={{ padding: '12px' }}>
          <div className="tv-stat-label" style={{ fontSize: '10px' }}>Contract</div>
          <div className="tv-stat-value" style={{ fontSize: '20px', color: '#2962ff' }}>
            {stats.contractTxs}
          </div>
        </div>
        <div className="tv-stat-card" style={{ padding: '12px' }}>
          <div className="tv-stat-label" style={{ fontSize: '10px' }}>Success Rate</div>
          <div className="tv-stat-value" style={{ fontSize: '20px' }}>
            {stats.successRate}%
          </div>
        </div>
        <div className="tv-stat-card" style={{ padding: '12px' }}>
          <div className="tv-stat-label" style={{ fontSize: '10px' }}>Avg Gas</div>
          <div className="tv-stat-value" style={{ fontSize: '20px' }}>
            {stats.avgGasPrice}
          </div>
        </div>
      </div>

      <div className="tv-section" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
          ⛓️ Recent Blocks
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '8px'
        }}>
          {blocks.map((block, i) => (
            <div key={block.number} style={{
              padding: '12px',
              background: i === 0 ? 'rgba(38, 166, 154, 0.1)' : 'var(--tv-color-bg-secondary)',
              border: `1px solid ${i === 0 ? '#26a69a' : 'var(--tv-color-border)'}`,
              borderRadius: '4px',
              textAlign: 'center',
              fontSize: '11px',
              animation: i === 0 ? 'slideIn 0.3s ease' : 'none'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>
                #{block.number}
              </div>
              <div style={{ color: 'var(--tv-color-text-secondary)' }}>
                {block.transactions} txs
              </div>
              <div style={{ color: 'var(--tv-color-text-secondary)', fontSize: '10px' }}>
                {new Date(block.timestamp * 1000).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="tv-section">
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
          📊 Transaction Stream ({filteredTransactions.length})
        </h3>
        <div style={{
          maxHeight: '500px',
          overflowY: 'auto',
          border: '1px solid var(--tv-color-border)',
          borderRadius: '4px'
        }}>
          {filteredTransactions.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: 'var(--tv-color-text-secondary)' 
            }}>
              No transactions found
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr style={{ 
                  background: 'var(--tv-color-bg-secondary)',
                  borderBottom: '1px solid var(--tv-color-border)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Hash</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>From → To</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Value</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Gas Used</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Block</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, i) => (
                  <tr key={`${tx.hash}-${i}`} style={{
                    borderBottom: '1px solid var(--tv-color-border)',
                    background: i % 2 === 0 ? 'transparent' : 'var(--tv-color-bg-secondary)',
                    animation: i === 0 && tx.status === 'success' ? 'slideIn 0.3s ease' : 'none'
                  }}>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: '600',
                        background: tx.status === 'success' ? 'rgba(38, 166, 154, 0.2)' :
                                   tx.status === 'failed' ? 'rgba(239, 83, 80, 0.2)' :
                                   'rgba(120, 123, 134, 0.2)',
                        color: tx.status === 'success' ? '#26a69a' :
                               tx.status === 'failed' ? '#ef5350' :
                               '#787b86'
                      }}>
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      {tx.isContract ? (
                        <span style={{ 
                          color: '#2962ff', 
                          fontWeight: '600',
                          fontSize: '11px'
                        }}>
                          {tx.functionName || 'Contract'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--tv-color-text-secondary)' }}>
                          Transfer
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>
                      <span title={tx.hash}>
                        {tx.hash.slice(0, 10)}...
                      </span>
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '11px' }}>
                      <span title={tx.from}>{tx.from.slice(0, 6)}...</span>
                      {' → '}
                      <span title={tx.to}>{typeof tx.to === 'string' ? tx.to.slice(0, 6) + '...' : tx.to}</span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      {tx.value > 0 ? `${tx.value.toFixed(4)} ETH` : '-'}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {tx.gasUsed.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px' }}>
                      #{tx.blockNumber}
                    </td>
                    <td style={{ padding: '8px', fontSize: '11px' }}>
                      {new Date(tx.timestamp * 1000).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ============= FIXED LIVE VOTE STREAM COMPONENT =============

function VoteStream({ contract, provider }) {
  const [votes, setVotes] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const processedEvents = useRef(new Set());

  useEffect(() => {
    if (!contract || !provider) return;

    let eventListener;
    let intervalId;

    const fetchHistoricalVotes = async () => {
      try {
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 1000);
        
        const filter = contract.filters.VoteCast();
        const events = await contract.queryFilter(filter, fromBlock, currentBlock);
        
        const processedVotes = [];
        
        for (const event of events) {
          const eventId = `${event.blockNumber}-${event.logIndex}`;
          
          if (!processedEvents.current.has(eventId)) {
            processedEvents.current.add(eventId);
            
            try {
              const candidateName = event.args?.candidate || 
                                   event.args?.[1] || 
                                   (event.args && event.args.length > 1 ? event.args[1] : 'Unknown');
              
              const voterAddress = event.args?.voter || 
                                  event.args?.[2] || 
                                  (event.args && event.args.length > 2 ? event.args[2] : '0x0000...0000');
              
              const timestamp = event.args?.timestamp || 
                               event.args?.[3] || 
                               (event.args && event.args.length > 3 ? event.args[3] : 0);
              
              const eventTimestamp = timestamp ? Number(timestamp) * 1000 : Date.now();
              
              processedVotes.push({
                id: eventId,
                candidate: candidateName,
                voter: voterAddress,
                voterShort: voterAddress.slice(0, 6) + '...' + voterAddress.slice(-4),
                blockNumber: event.blockNumber,
                txHash: event.transactionHash,
                timestamp: eventTimestamp,
                time: new Date(eventTimestamp).toLocaleTimeString(),
                date: new Date(eventTimestamp).toLocaleDateString(),
                isNew: false
              });
            } catch (err) {
              console.error('Error processing historical event:', err, event);
            }
          }
        }
        
        processedVotes.sort((a, b) => b.timestamp - a.timestamp);
        setVotes(processedVotes.slice(0, 50));
        
      } catch (error) {
        console.error('Error fetching historical votes:', error);
      }
    };

    const setupListener = () => {
      try {
        eventListener = contract.on("VoteCast", async (voterIdHash, candidate, voter, timestamp, event) => {
          const eventId = `${event.log.blockNumber}-${event.log.logIndex}`;
          
          if (!processedEvents.current.has(eventId)) {
            processedEvents.current.add(eventId);
            
            const newVote = {
              id: eventId,
              candidate: candidate,
              voter: voter,
              voterShort: `${voter.slice(0, 6)}...${voter.slice(-4)}`,
              blockNumber: event.log.blockNumber,
              txHash: event.log.transactionHash,
              timestamp: Number(timestamp) * 1000,
              time: new Date(Number(timestamp) * 1000).toLocaleTimeString(),
              date: new Date(Number(timestamp) * 1000).toLocaleDateString(),
              isNew: true
            };
            
            setVotes(prev => {
              const updated = [newVote, ...prev.filter(v => v.id !== eventId)];
              return updated.slice(0, 50);
            });
            
            setTimeout(() => {
              setVotes(prev => prev.map(v => 
                v.id === eventId ? { ...v, isNew: false } : v
              ));
            }, 5000);
          }
        });
        
        setIsListening(true);
      } catch (error) {
        console.error('Error setting up listener:', error);
        setIsListening(false);
      }
    };

    fetchHistoricalVotes();
    setupListener();
    intervalId = setInterval(fetchHistoricalVotes, 10000);

    return () => {
      if (eventListener) {
        contract.off("VoteCast", eventListener);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
      setIsListening(false);
    };
  }, [contract, provider]);

  return (
    <div style={{
      height: '500px',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid var(--tv-color-border)',
      borderRadius: '4px',
      background: 'var(--tv-color-bg-secondary)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--tv-color-border)',
        background: 'var(--tv-color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            background: isListening ? '#26a69a' : '#787b86',
            borderRadius: '50%',
            animation: isListening ? 'pulse 2s infinite' : 'none'
          }} />
          <span style={{ fontSize: '12px', fontWeight: '600' }}>
            {isListening ? 'LIVE VOTES' : 'CONNECTING...'}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--tv-color-text-secondary)' }}>
          Total: {votes.length}
        </span>
      </div>
      
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px'
      }}>
        {votes.length === 0 ? (
          <div style={{ 
            padding: '40px 20px', 
            textAlign: 'center', 
            color: 'var(--tv-color-text-secondary)' 
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📭</div>
            <div>No votes recorded yet</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              Cast a vote to see it appear here...
            </div>
          </div>
        ) : (
          votes.map((vote, index) => (
            <div 
              key={vote.id} 
              style={{
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '4px',
                background: 'var(--tv-color-surface)',
                border: `1px solid ${vote.isNew ? '#26a69a' : 'var(--tv-color-border)'}`,
                animation: vote.isNew ? 'slideIn 0.3s ease, flash 0.5s ease' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: vote.isNew ? '#26a69a' : '#787b86',
                  marginTop: '6px',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '13px', 
                    marginBottom: '4px',
                    color: 'var(--tv-color-text)'
                  }}>
                    Vote for <span style={{ color: '#26a69a' }}>{vote.candidate}</span>
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: 'var(--tv-color-text-secondary)',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <span>{vote.date} {vote.time}</span>
                    <span>•</span>
                    <span>Block #{vote.blockNumber}</span>
                    <span>•</span>
                    <span>{vote.voterShort}</span>
                  </div>
                </div>
                {vote.isNew && (
                  <span style={{
                    background: '#26a69a',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    NEW
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============= SIMPLE ANALYTICS COMPONENTS =============

function QuickStatsCard({ title, value, change, icon, color = '#26a69a' }) {
  return (
    <div className="tv-stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <div className="tv-stat-label">{title}</div>
      </div>
      <div className="tv-stat-value" style={{ color }}>
        {value}
      </div>
      {change !== undefined && change !== null && (
        <div className="tv-stat-change" style={{ color: change > 0 ? '#26a69a' : '#ef5350' }}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      )}
    </div>
  );
}

// ============= MAIN ADMIN COMPONENT =============

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [newCandidate, setNewCandidate] = useState("");
  const [newVoterId, setNewVoterId] = useState("");
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);
  
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [voteEvents, setVoteEvents] = useState([]);
  const [votingTrend, setVotingTrend] = useState([]);
  const [votingDeadline, setVotingDeadline] = useState(0);

  const handleLogin = (user, pass) => {
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      setLoggedIn(true);
      setError("");
    } else {
      setError("Invalid credentials");
      setLoggedIn(false);
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    
    const init = async () => {
      try {
        const _provider = new JsonRpcProvider(RPC_URL);
        const ownerWallet = getOwnerWallet(_provider);
        const _contract = new Contract(CONTRACT_ADDRESS, VotingABI, ownerWallet);
        
        setProvider(_provider);
        setContract(_contract);
        
        const deadline = await _contract.getVotingDeadline();
        setVotingDeadline(Number(deadline));
      } catch (err) {
        console.error("Provider init error:", err);
        setError("Failed to connect to blockchain");
      }
    };
    
    init();
  }, [loggedIn]);

  const fetchData = useCallback(async () => {
    if (!contract || !provider) return;
    
    setLoading(true);
    try {
      const fetchedCandidates = await contract.getCandidates();
      const votesArr = await Promise.all(
        fetchedCandidates.map(c => contract.getVotes(c))
      );
      
      const totalVotes = votesArr.reduce((sum, v) => sum + Number(v), 0);
      
      const candidateStats = fetchedCandidates.map((c, i) => ({
        name: c,
        votes: Number(votesArr[i])
      })).sort((a, b) => b.votes - a.votes);
      
      let events = [];
      let trendData = [];
      
      try {
        const filter = contract.filters.VoteCast();
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 1000);
        
        const rawEvents = await contract.queryFilter(filter, fromBlock, currentBlock);
        events = rawEvents.filter(event => event && event.args);
        
        if (events.length > 0) {
          const timeGroups = {};
          let cumulative = 0;
          
          const sortedEvents = [...events].sort((a, b) => 
            (a.blockNumber || 0) - (b.blockNumber || 0)
          );
          
          sortedEvents.forEach((event, index) => {
            cumulative++;
            const timestamp = event.args?.timestamp 
              ? Number(event.args.timestamp) * 1000 
              : Date.now();
            
            const date = new Date(timestamp);
            const timeKey = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            if (index % Math.max(1, Math.floor(events.length / 20)) === 0) {
              timeGroups[timeKey] = cumulative;
            }
          });
          
          trendData = Object.entries(timeGroups).map(([time, value]) => ({
            time,
            value
          }));
        }
        
        setVoteEvents(events);
        setVotingTrend(trendData);
      } catch (err) {
        console.error("Error fetching events:", err);
        setVoteEvents([]);
        setVotingTrend([]);
      }
      
      const uniqueVoters = new Set(
        events
          .filter(e => e.args?.voter)
          .map(e => e.args.voter)
      ).size;
      
      setStats({
        candidates: candidateStats,
        totalVotes,
        uniqueVoters,
        participation: ((uniqueVoters / 1000) * 100).toFixed(1),
        recentVotes: events.filter(e => {
          const t = e.args?.timestamp ? Number(e.args.timestamp) * 1000 : 0;
          return t > Date.now() - 3600000;
        }).length,
        lastUpdate: new Date().toLocaleTimeString()
      });
      
      setCandidates(fetchedCandidates);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [contract, provider]);

  useEffect(() => {
    if (!contract || !provider) return;
    
    fetchData();
    const interval = setInterval(fetchData, 10000);
    
    return () => clearInterval(interval);
  }, [contract, provider, refresh, fetchData]);

  const runTransaction = async (txFunction) => {
    setLoading(true);
    setMessage("");
    try {
      const tx = await txFunction(contract);
      setMessage("🔄 Transaction submitted...");
      await tx.wait();
      setRefresh(r => r + 1);
      return true;
    } catch (err) {
      setMessage(`❌ ${err.reason || err.message || "Transaction failed"}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!newCandidate.trim()) return;
    const success = await runTransaction(contract =>
      contract.addCandidate(newCandidate.trim())
    );
    if (success) {
      setMessage(`✅ Added candidate: ${newCandidate}`);
      setNewCandidate("");
    }
  };

  const handleRemoveCandidate = async (name) => {
    if (!window.confirm(`Remove candidate "${name}"?`)) return;
    const success = await runTransaction(contract =>
      contract.removeCandidate(name)
    );
    if (success) {
      setMessage(`✅ Removed candidate: ${name}`);
    }
  };

  const handleAddVoterId = async (e) => {
    e.preventDefault();
    if (!newVoterId.trim()) return;
    const success = await runTransaction(contract =>
      contract.addVoterId(newVoterId.trim())
    );
    if (success) {
      setMessage(`✅ Added voter ID: ${newVoterId}`);
      setNewVoterId("");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    window.location.href = "/?loggedOut=true";
  };

  if (!loggedIn) {
    return (
      <div className="admin-page-container">
        <AdminLogin onLogin={handleLogin} error={error} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--tv-color-bg)" }}>
      <div className="tv-dashboard-header">
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "500" }}>
            📊 Election Command Center
          </h2>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--tv-color-text-secondary)" }}>
            Contract: {CONTRACT_ADDRESS.slice(0, 8)}...{CONTRACT_ADDRESS.slice(-6)}
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{
            display: "flex",
            background: "var(--tv-color-bg)",
            borderRadius: "4px",
            padding: "2px",
            border: "1px solid var(--tv-color-border)"
          }}>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: "8px 16px",
                background: activeTab === 'analytics' ? "var(--tv-color-blue)" : "transparent",
                color: activeTab === 'analytics' ? "white" : "var(--tv-color-text)",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                transition: "all 0.2s"
              }}
            >
              📈 Analytics
            </button>
            <button
              onClick={() => setActiveTab('blockchain')}
              style={{
                padding: "8px 16px",
                background: activeTab === 'blockchain' ? "var(--tv-color-blue)" : "transparent",
                color: activeTab === 'blockchain' ? "white" : "var(--tv-color-text)",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                transition: "all 0.2s"
              }}
            >
              ⛓️ Blockchain
            </button>
            <button
              onClick={() => setActiveTab('management')}
              style={{
                padding: "8px 16px",
                background: activeTab === 'management' ? "var(--tv-color-blue)" : "transparent",
                color: activeTab === 'management' ? "white" : "var(--tv-color-text)",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                transition: "all 0.2s"
              }}
            >
              ⚙️ Management
            </button>
          </div>
          
          <button 
            onClick={() => setRefresh(r => r + 1)}
            disabled={loading}
            style={{ 
              padding: "6px 12px",
              fontSize: "12px",
              background: "var(--tv-color-surface)",
              border: "1px solid var(--tv-color-border)",
              borderRadius: "3px",
              color: "var(--tv-color-text)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1
            }}
            title="Refresh data"
          >
            🔄
          </button>
          
          <ExportDropdown stats={stats} voteEvents={voteEvents} />
          
          <span style={{ 
            color: "#26a69a", 
            fontSize: "12px",
            padding: "4px 8px",
            background: "rgba(38, 166, 154, 0.1)",
            borderRadius: "3px",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            <span style={{ 
              width: "6px", 
              height: "6px", 
              background: "#26a69a",
              borderRadius: "50%",
              display: "inline-block",
              animation: "pulse 2s infinite"
            }} />
            LIVE
          </span>
          
          <button onClick={handleLogout} className="admin-logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
        {message && (
          <div className={`message ${message.startsWith("✅") ? "success" : message.startsWith("❌") ? "error" : ""}`}>
            {message}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <>
            {stats && (
              <div className="tv-stats-grid" style={{ marginBottom: "24px" }}>
                <QuickStatsCard 
                  icon="🗳️"
                  title="Total Votes" 
                  value={stats.totalVotes.toLocaleString()} 
                  change={stats.recentVotes > 0 ? ((stats.recentVotes / stats.totalVotes) * 100).toFixed(1) : 0}
                />
                <QuickStatsCard 
                  icon="👥"
                  title="Unique Voters" 
                  value={stats.uniqueVoters} 
                  color="#2962ff"
                />
                <QuickStatsCard 
                  icon="🏆"
                  title="Leading" 
                  value={stats.candidates[0]?.name || 'N/A'} 
                  color="#26a69a"
                />
                <QuickStatsCard 
                  icon="📊"
                  title="Participation" 
                  value={`${stats.participation}%`} 
                  color="#ab47bc"
                />
              </div>
            )}

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "2fr 1fr", 
              gap: "16px", 
              marginBottom: "24px" 
            }}>
              <div className="tv-section">
                <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>
                  🔴 Live Vote Stream
                </h3>
                <VoteStream contract={contract} provider={provider} />
              </div>

              <div className="tv-section">
                <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>
                  🗳️ Vote Distribution
                </h3>
                {stats && stats.candidates.length > 0 ? (
                  <PieChart 
                    data={stats.candidates.map(c => ({ 
                      name: c.name, 
                      value: c.votes 
                    }))} 
                    size={200}
                  />
                ) : (
                  <p style={{ textAlign: "center", color: "var(--tv-color-text-secondary)" }}>
                    No votes yet
                  </p>
                )}
              </div>
            </div>

            {votingTrend.length > 0 && (
              <div className="tv-section" style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>
                  📈 Cumulative Voting Trend
                </h3>
                <LineChart data={votingTrend} />
              </div>
            )}
          </>
        )}

        {/* Blockchain Tab */}
        {activeTab === 'blockchain' && (
          <BlockchainVisualizer provider={provider} contract={contract} />
        )}

        {/* Management Tab */}
        {activeTab === 'management' && (
          <div className="tv-grid" style={{ marginTop: "24px" }}>
            <div className="tv-section">
              <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>
                👥 Candidate Management
              </h3>
              <form onSubmit={handleAddCandidate} className="admin-manage-row">
                <input
                  type="text"
                  placeholder="New candidate name"
                  value={newCandidate}
                  onChange={(e) => setNewCandidate(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
                <button type="submit" disabled={loading || !newCandidate}>
                  Add
                </button>
              </form>
              <div style={{ 
                marginTop: "16px", 
                maxHeight: "400px", 
                overflowY: "auto",
                border: "1px solid var(--tv-color-border)",
                borderRadius: "4px"
              }}>
                {candidates.map((c, index) => (
                  <div key={c} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: index < candidates.length - 1 ? "1px solid var(--tv-color-border)" : "none"
                  }}>
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCandidate(c)}
                      className="admin-remove-btn"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="tv-section">
              <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>
                🆔 Voter ID Management
              </h3>
              <form onSubmit={handleAddVoterId} className="admin-manage-row">
                <input
                  type="text"
                  placeholder="Voter ID"
                  value={newVoterId}
                  onChange={(e) => setNewVoterId(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
                <button type="submit" disabled={loading || !newVoterId}>
                  Add ID
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}