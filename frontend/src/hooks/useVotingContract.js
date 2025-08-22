import { useEffect, useState } from "react";
import { Contract } from "ethers";
import VotingABI from "../abi/VotingABI.json";

export default function useVotingContract(address, signerOrProvider) {
  const [contract, setContract] = useState(null);

  useEffect(() => {
    if (!address || !signerOrProvider) return;
    setContract(new Contract(address, VotingABI, signerOrProvider));
  }, [address, signerOrProvider]);

  return contract;
}