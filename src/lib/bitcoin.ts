import * as bitcoin from "bitcoinjs-lib";
import { BIP32Factory } from "bip32";
import * as ecc from "@bitcoinerlab/secp256k1";

// Configure bitcoinjs-lib to use the ECC library
bitcoin.initEccLib(ecc);

// Create BIP32 factory with the elliptic curve library
const bip32 = BIP32Factory(ecc);

export const SIGNER3_PUBLIC_KEY =
  "02e79c4eb45764bd015542f81cc475653a72b0f131243a3e4f68fdb8dde3a4574f";

export interface WalletData {
  address: string;
  redeemScript: string;
  witnessScript: string;
  publicKeys: {
    borrower: Buffer;
    lender: Buffer;
    signer3: Buffer;
  };
  network: "testnet" | "mainnet";
  includeTimelock: boolean;
  timelockBlocks: number;
}

export const derivePublicKey = async (keyInput: string): Promise<Buffer> => {
  // Check if input is an xpub
  if (keyInput.startsWith("xpub") || keyInput.startsWith("tpub")) {
    // For testnet, we need to handle the network properly
    let xpub;
    if (keyInput.startsWith("tpub")) {
      // Testnet xpub
      xpub = bip32.fromBase58(keyInput, bitcoin.networks.testnet);
    } else {
      // Mainnet xpub
      xpub = bip32.fromBase58(keyInput, bitcoin.networks.bitcoin);
    }
    const child = xpub.derivePath("0/0");
    return Buffer.from(child.publicKey);
  } else if (keyInput.length == 130 || keyInput.length == 66) {
    // Assume it's already a public key
    return Buffer.from(keyInput, "hex");
  } else {
    throw new Error(`Invalid key format`);
  }
};

export const createStandardMultisig = (
  borrowerPubKey: Buffer,
  lenderPubKey: Buffer,
  signer3PubKey: Buffer,
  network: bitcoin.Network,
) => {
  // Create 2-of-3 multisig
  const pubkeys = [borrowerPubKey, lenderPubKey, signer3PubKey].sort((a, b) => {
    return Buffer.compare(a, b);
  });

  // Create multisig script manually
  const redeemScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_2,
    ...pubkeys.map((pk) => pk),
    bitcoin.opcodes.OP_3,
    bitcoin.opcodes.OP_CHECKMULTISIG,
  ]);
  const witnessScript = redeemScript;

  // Generate P2WSH address
  const payment = bitcoin.payments.p2wsh({
    redeem: { output: redeemScript },
    network: network,
  });

  if (!payment.address) {
    throw new Error("Failed to generate address");
  }

  return {
    redeemScript: redeemScript.toString("hex"),
    witnessScript: witnessScript.toString("hex"),
    address: payment.address,
  };
};

export const createTimelockMultisig = (
  borrowerPubKey: Buffer,
  lenderPubKey: Buffer,
  signer3PubKey: Buffer,
  timelockBlocks: number,
  network: bitcoin.Network,
) => {
  // Sort public keys for deterministic ordering
  const pubkeys = [borrowerPubKey, lenderPubKey, signer3PubKey].sort((a, b) => {
    return Buffer.compare(a, b);
  });

  // Create multisig script manually
  const multisigScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_2,
    ...pubkeys.map((pk) => pk),
    bitcoin.opcodes.OP_3,
    bitcoin.opcodes.OP_CHECKMULTISIG,
  ]);

  // Create the timelock script
  // OP_IF <timelock> OP_CSV OP_DROP <2-of-3 multisig>
  // OP_ELSE <2-of-3 multisig> OP_ENDIF
  const timelockScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    Buffer.from([timelockBlocks & 0xff, (timelockBlocks >> 8) & 0xff]), // Little-endian
    bitcoin.opcodes.OP_CSV,
    bitcoin.opcodes.OP_DROP,
    multisigScript,
    bitcoin.opcodes.OP_ELSE,
    multisigScript,
    bitcoin.opcodes.OP_ENDIF,
  ]);

  // Generate P2WSH address
  const payment = bitcoin.payments.p2wsh({
    redeem: { output: timelockScript },
    network: network,
  });

  if (!payment.address) {
    throw new Error("Failed to generate address");
  }

  return {
    redeemScript: timelockScript.toString("hex"),
    witnessScript: timelockScript.toString("hex"),
    address: payment.address,
  };
};

export const createMultisigWallet = async (
  borrowerKey: string,
  lenderKey: string,
  network: "testnet" | "mainnet",
  includeTimelock: boolean,
  timelockBlocks: number,
): Promise<WalletData> => {
  try {
    // Set up Bitcoin.js network
    const bitcoinNetwork =
      network === "mainnet"
        ? bitcoin.networks.bitcoin
        : bitcoin.networks.testnet;

    // Parse and derive public keys
    const borrowerPubKey = await derivePublicKey(borrowerKey);
    const lenderPubKey = await derivePublicKey(lenderKey);

    // For testing, use a simple public key instead of xpub to avoid network version issues
    const signer3PubKey = Buffer.from(SIGNER3_PUBLIC_KEY, "hex");

    let redeemScript: string, witnessScript: string, address: string;

    if (includeTimelock) {
      // Create timelock multisig with CSV
      const result = createTimelockMultisig(
        borrowerPubKey,
        lenderPubKey,
        signer3PubKey,
        timelockBlocks,
        bitcoinNetwork,
      );
      redeemScript = result.redeemScript;
      witnessScript = result.witnessScript;
      address = result.address;
    } else {
      // Create standard 2-of-3 multisig
      const result = createStandardMultisig(
        borrowerPubKey,
        lenderPubKey,
        signer3PubKey,
        bitcoinNetwork,
      );
      redeemScript = result.redeemScript;
      witnessScript = result.witnessScript;
      address = result.address;
    }

    return {
      address: address,
      redeemScript: redeemScript,
      witnessScript: witnessScript,
      publicKeys: {
        borrower: borrowerPubKey,
        lender: lenderPubKey,
        signer3: signer3PubKey,
      },
      network: network,
      includeTimelock: includeTimelock,
      timelockBlocks: timelockBlocks,
    };
  } catch (error) {
    throw new Error(`Failed to create multisig wallet: ${error}`);
  }
};
