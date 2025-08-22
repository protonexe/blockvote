// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./VotingReceiptNFT.sol";

contract Voting {
    string[] public candidates;
    mapping(string => bool) public isCandidate;
    mapping(string => uint256) public votes;
    mapping(bytes32 => bool) public isRegisteredVoterIdHash;
    mapping(bytes32 => bool) public hasVoterIdHashVoted;
    mapping(address => bool) public hasAddressVoted;

    address public owner;
    uint256 public votingDeadline;
    VotingReceiptNFT public receiptNFT;

    event VoteCast(bytes32 indexed voterIdHash, string indexed candidate, address indexed voter, uint256 timestamp);
    event VoterIdAdded(bytes32 voterIdHash);
    event VoterIdRemoved(bytes32 voterIdHash);
    event CandidateAdded(string candidate);
    event CandidateRemoved(string candidate);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    modifier votingOpen() {
        require(block.timestamp < votingDeadline, "Voting has ended");
        _;
    }

    constructor(
        string[] memory _candidates, 
        string[] memory _voterIds, 
        uint256 _votingPeriodSeconds,
        address _receiptNFTAddress
    ) {
        owner = msg.sender;
        votingDeadline = block.timestamp + _votingPeriodSeconds;
        receiptNFT = VotingReceiptNFT(_receiptNFTAddress);

        for (uint i = 0; i < _candidates.length; i++) {
            candidates.push(_candidates[i]);
            isCandidate[_candidates[i]] = true;
            emit CandidateAdded(_candidates[i]);
        }
        for (uint i = 0; i < _voterIds.length; i++) {
            bytes32 hash = keccak256(bytes(_voterIds[i]));
            isRegisteredVoterIdHash[hash] = true;
            emit VoterIdAdded(hash);
        }
    }

    function vote(string memory voterId, string memory _candidate) public votingOpen {
        bytes32 hash = keccak256(bytes(voterId));
        require(isRegisteredVoterIdHash[hash], "Not a registered voter ID.");
        require(!hasVoterIdHashVoted[hash], "This voter ID has already voted.");
        require(!hasAddressVoted[msg.sender], "This wallet has already voted.");
        require(isCandidate[_candidate], "Invalid candidate.");

        votes[_candidate]++;
        hasVoterIdHashVoted[hash] = true;
        hasAddressVoted[msg.sender] = true;

        receiptNFT.safeMint(msg.sender);

        emit VoteCast(hash, _candidate, msg.sender, block.timestamp);
    }

    function getCandidates() public view returns (string[] memory) { return candidates; }
    function getVotes(string memory _candidate) public view returns (uint256) { return votes[_candidate]; }
    function addVoterId(string memory voterId) public onlyOwner { bytes32 hash = keccak256(bytes(voterId)); require(!isRegisteredVoterIdHash[hash], "Already registered"); isRegisteredVoterIdHash[hash] = true; emit VoterIdAdded(hash); }
    function removeVoterId(string memory voterId) public onlyOwner { bytes32 hash = keccak256(bytes(voterId)); require(isRegisteredVoterIdHash[hash], "Not registered"); isRegisteredVoterIdHash[hash] = false; emit VoterIdRemoved(hash); }
    function addCandidate(string memory _candidate) public onlyOwner { require(!isCandidate[_candidate], "Already a candidate"); candidates.push(_candidate); isCandidate[_candidate] = true; emit CandidateAdded(_candidate); }
    function removeCandidate(string memory _candidate) public onlyOwner { require(isCandidate[_candidate], "Not a candidate"); isCandidate[_candidate] = false; for (uint i = 0; i < candidates.length; i++) { if (keccak256(bytes(candidates[i])) == keccak256(bytes(_candidate))) { candidates[i] = candidates[candidates.length - 1]; candidates.pop(); break; } } emit CandidateRemoved(_candidate); }
    function hasVoterIdVoted(string memory voterId) public view returns (bool) { return hasVoterIdHashVoted[keccak256(bytes(voterId))]; }
    function isVoterIdRegistered(string memory voterId) public view returns (bool) { return isRegisteredVoterIdHash[keccak256(bytes(voterId))]; }
    function hasAddressVotedFn(address addr) public view returns (bool) { return hasAddressVoted[addr]; }
    function getVotingDeadline() public view returns (uint256) { return votingDeadline; }
}