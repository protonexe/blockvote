import { useEffect, useState } from "react";
import { Wallet } from "ethers";

export default function useWallet(provider) {
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    if (!provider) return;
    let storedPk = localStorage.getItem("burnerPrivateKey");
    let burner =
      storedPk && storedPk.length > 0
        ? new Wallet(storedPk).connect(provider)
        : Wallet.createRandom().connect(provider);

    if (!storedPk) {
      localStorage.setItem("burnerPrivateKey", burner.privateKey);
    }
    setWallet(burner);
  }, [provider]);

  return wallet;
}