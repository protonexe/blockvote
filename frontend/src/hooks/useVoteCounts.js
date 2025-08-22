import { useEffect, useState } from "react";

export default function useVoteCounts(contract, candidates) {
  const [voteCounts, setVoteCounts] = useState({});

  useEffect(() => {
    if (!contract || !candidates || candidates.length === 0) return;
    let mounted = true;
    const fetchCounts = async () => {
      try {
        const counts = await Promise.all(
          candidates.map(name => contract.getVotes(name))
        );
        const result = {};
        candidates.forEach((name, i) => {
          result[name] = counts[i].toString();
        });
        if (mounted) setVoteCounts(result);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchCounts();
    return () => { mounted = false; };
  }, [contract, candidates]);

  return voteCounts;
}