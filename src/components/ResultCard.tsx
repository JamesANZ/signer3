"use client";

import { useState } from "react";
import { WalletData } from "@/lib/bitcoin";

interface ResultCardProps {
  walletData: WalletData;
}

export default function ResultCard({ walletData }: ResultCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      alert("Failed to copy to clipboard");
    }
  };

  const downloadScript = () => {
    const config = {
      walletAddress: walletData.address,
      redeemScript: walletData.redeemScript,
      witnessScript: walletData.witnessScript,
      publicKeys: {
        borrower: walletData.publicKeys.borrower.toString("hex"),
        lender: walletData.publicKeys.lender.toString("hex"),
        signer3: walletData.publicKeys.signer3.toString("hex"),
      },
      network: walletData.network,
      includeTimelock: walletData.includeTimelock,
      timelockBlocks: walletData.timelockBlocks,
      createdAt: new Date().toISOString(),
      description: "2-of-3 Multisig Wallet created with Signer3",
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `signer3-multisig-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card result-card">
      <h3>Generated Multisig Wallet</h3>
      <p>
        Funds sent to this address will be held in a multisig with an optional
        timelock. Signer3's signature is only required if there is a dispute or
        either party loses a key. Signer3 will only sign the transaction with a
        court order or consent from both parties in the event of a lost key(s).
      </p>
      <br></br>
      <div className="result-section">
        <h4>Wallet Address</h4>
        <div className="code-block">
          <code>{walletData.address}</code>
          <button
            onClick={() => copyToClipboard(walletData.address, "address")}
            className="btn-copy"
          >
            {copiedField === "address" ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="result-section">
        <h4>Redeem Script</h4>
        <div className="code-block">
          <code>{walletData.redeemScript}</code>
          <button
            onClick={() =>
              copyToClipboard(walletData.redeemScript, "redeemScript")
            }
            className="btn-copy"
          >
            {copiedField === "redeemScript" ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="result-section">
        <h4>Witness Script</h4>
        <div className="code-block">
          <code>{walletData.witnessScript}</code>
          <button
            onClick={() =>
              copyToClipboard(walletData.witnessScript, "witnessScript")
            }
            className="btn-copy"
          >
            {copiedField === "witnessScript" ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="result-section">
        <h4>Public Keys</h4>
        <div className="keys-list">
          <div className="key-item">
            <strong>Borrower:</strong>
            <code>{walletData.publicKeys.borrower.toString("hex")}</code>
          </div>
          <div className="key-item">
            <strong>Lender:</strong>
            <code>{walletData.publicKeys.lender.toString("hex")}</code>
          </div>
          <div className="key-item">
            <strong>Signer3:</strong>
            <code>{walletData.publicKeys.signer3.toString("hex")}</code>
          </div>
        </div>
      </div>

      <div className="download-section">
        <button onClick={downloadScript} className="btn-download">
          Download Script Configuration
        </button>
      </div>
    </div>
  );
}
