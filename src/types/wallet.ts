import { Buffer } from "buffer";

export interface WalletData {
  address: string;
  redeemScript: string;
  witnessScript: string;
  publicKeys: {
    borrower: any;
    lender: any;
    signer3: any;
  };
  network: "testnet" | "mainnet";
  includeTimelock: boolean;
  timelockBlocks: number;
}

export interface FormData {
  borrowerKey: string;
  lenderKey: string;
  network: "testnet" | "mainnet";
  includeTimelock: boolean;
  timelockBlocks: number;
}
