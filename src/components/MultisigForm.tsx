"use client";

import { useState } from "react";
import { createMultisigWallet, WalletData } from "@/lib/bitcoin";

interface MultisigFormProps {
  onWalletCreated: (data: WalletData) => void;
}

export default function MultisigForm({ onWalletCreated }: MultisigFormProps) {
  const [formData, setFormData] = useState({
    borrowerKey: "",
    lenderKey: "",
    network: "testnet" as "testnet" | "mainnet",
    includeTimelock: false,
    timelockBlocks: 144,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.borrowerKey || !formData.lenderKey) {
      alert("Please enter both borrower and lender keys.");
      return;
    }

    setIsLoading(true);

    try {
      const walletData = await createMultisigWallet(
        formData.borrowerKey.trim(),
        formData.lenderKey.trim(),
        formData.network,
        formData.includeTimelock,
        formData.timelockBlocks,
      );

      onWalletCreated(walletData);
    } catch (error) {
      console.error("Error creating multisig wallet:", error);
      alert(`Error creating multisig wallet: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create 2-of-3 Multisig Wallet</h2>
      <p className="description">
        Create a secure multisig wallet with borrower, lender, and Signer3 as
        signatories. Funds can be spent when any 2 of the 3 parties agree.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="borrowerKey">
            Borrower's Public Key (xpub or public key)
          </label>
          <input
            type="text"
            id="borrowerKey"
            name="borrowerKey"
            value={formData.borrowerKey}
            onChange={handleInputChange}
            required
            className="form-input"
            placeholder="Enter borrower's xpub or public key"
          />
        </div>

        <div className="form-group">
          <label htmlFor="lenderKey">
            Lender's Public Key (xpub or public key)
          </label>
          <input
            type="text"
            id="lenderKey"
            name="lenderKey"
            value={formData.lenderKey}
            onChange={handleInputChange}
            required
            className="form-input"
            placeholder="Enter lender's xpub or public key"
          />
        </div>

        <div className="form-group">
          <label htmlFor="network">Network</label>
          <select
            id="network"
            name="network"
            value={formData.network}
            onChange={handleInputChange}
            className="form-input"
          >
            <option value="testnet">Testnet</option>
            <option value="mainnet">Mainnet</option>
          </select>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="includeTimelock"
              checked={formData.includeTimelock}
              onChange={handleInputChange}
            />
            <span>Include CSV Timelock Recovery</span>
          </label>
          <p className="help-text">
            When enabled, Signer3 can recover funds after a specified time if
            both borrower and lender lose access to their keys.
          </p>
        </div>

        {formData.includeTimelock && (
          <div className="form-group timelock-options">
            <label htmlFor="timelockBlocks">Timelock Duration (blocks)</label>
            <input
              type="number"
              id="timelockBlocks"
              name="timelockBlocks"
              value={formData.timelockBlocks}
              onChange={handleInputChange}
              min="1"
              max="65535"
              className="form-input"
              placeholder="144 (approximately 1 day)"
            />
            <p className="help-text">
              Number of blocks before Signer3 can recover funds. 144 blocks ≈ 1
              day.
            </p>
          </div>
        )}

        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? "Creating Wallet..." : "Create Multisig Wallet"}
        </button>
      </form>
    </div>
  );
}
