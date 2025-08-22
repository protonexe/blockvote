const fs = require('fs');
const path = require('path');
const hre = require("hardhat");

async function main() {
  // 1) Deploy NFT
  const NFT = await hre.ethers.getContractFactory("VotingReceiptNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  console.log("VotingReceiptNFT deployed to:", nft.target);

  // 2) Deploy Voting with NFT address
  const Voting = await hre.ethers.getContractFactory("Voting");
  const candidates = ["Alice", "Bob", "Charlie"];
  const voterIdsPath = path.join(__dirname, 'voter_ids.txt');
  const voterIds = fs.readFileSync(voterIdsPath, 'utf-8')
    .split('\n').map(s => s.trim()).filter(Boolean);
  const votingPeriodSeconds = 7 * 24 * 60 * 60; // 7 days

  const voting = await Voting.deploy(candidates, voterIds, votingPeriodSeconds, nft.target);
  await voting.waitForDeployment();
  console.log("Voting deployed to:", voting.target);

  // 3) Transfer NFT ownership to Voting (so only Voting can mint)
  const tx = await nft.transferOwnership(voting.target);
  await tx.wait();
  console.log("NFT ownership transferred to Voting.");

  // 4) Write for frontend
  const data = { address: voting.target, nft: nft.target };
  fs.writeFileSync('deployedAddress.json', JSON.stringify(data, null, 2), 'utf-8');

  const dest = path.join(__dirname, '..', 'frontend', 'src', 'deployedAddress.json');
  fs.copyFileSync('deployedAddress.json', dest);
  console.log(`Copied deployedAddress.json to ${dest}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});