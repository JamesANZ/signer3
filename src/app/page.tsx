"use client";

import { useState } from "react";
import MultisigForm from "@/components/MultisigForm";
import ResultCard from "@/components/ResultCard";
import { WalletData } from "@/lib/bitcoin";

export default function Home() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);

  const handleWalletCreated = (data: WalletData) => {
    setWalletData(data);
  };

  return (
    <div className="min-h-screen">
      <div className="container">
        <header>
          <h1>Signer3</h1>
          <p className="subtitle">
            MultiSig Arbitrator Solution for Bitcoin Collateral
          </p>
        </header>

        <main>
          <MultisigForm onWalletCreated={handleWalletCreated} />
          {walletData && <ResultCard walletData={walletData} />}
        </main>

        <footer>
          <p>Signer3 - Secure Bitcoin Multisig Solutions</p>
        </footer>
      </div>
    </div>
  );
}
