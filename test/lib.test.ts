import {
  createMultisigWallet,
  derivePublicKey,
  createStandardMultisig,
  createTimelockMultisig,
  SIGNER3_PUBLIC_KEY,
} from "@/lib/bitcoin";
import * as bitcoin from "bitcoinjs-lib";

// Mock Bitcoin libraries
jest.mock("bitcoinjs-lib", () => ({
  networks: {
    bitcoin: {
      bech32: "bc",
      pubKeyHash: 0x00,
      scriptHash: 0x05,
      wif: 0x80,
    },
    testnet: {
      bech32: "tb",
      pubKeyHash: 0x6f,
      scriptHash: 0xc4,
      wif: 0xef,
    },
  },
  payments: {
    p2wsh: jest.fn(({ redeem }: { redeem: any }) => ({
      address: "tb1q" + "a".repeat(62),
      output: Buffer.from("test-output"),
    })),
  },
  script: {
    compile: jest.fn((ops: any[]) => Buffer.from("compiled-script")),
  },
  opcodes: {
    OP_2: 0x52,
    OP_3: 0x53,
    OP_CHECKMULTISIG: 0xae,
    OP_IF: 0x63,
    OP_ELSE: 0x67,
    OP_ENDIF: 0x68,
    OP_CSV: 0xb2,
    OP_DROP: 0x75,
  },
  initEccLib: jest.fn(),
}));

jest.mock("bip32", () => ({
  BIP32Factory: jest.fn(() => ({
    fromBase58: jest.fn(() => ({
      derivePath: jest.fn(() => ({
        publicKey: Buffer.from("derived-public-key"),
      })),
    })),
  })),
}));

jest.mock("@bitcoinerlab/secp256k1", () => ({}));

describe("Bitcoin Utility Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("derivePublicKey", () => {
    it("should derive public key from testnet xpub", async () => {
      const testnetXpub =
        "tpubD6NzVbkrYhZ4XgiXtGrdW5XDAPFCL9h7we1vwNCpn8tGbBcgfVYjXyhWo4E1xkh56hjod1WeGZ8Lxw1cRP7L2qs3NQbTXc2qFCxqKXrGjP";
      const result = await derivePublicKey(testnetXpub);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString("hex")).toBe(
        "646572697665642d7075626c69632d6b6579",
      );
    });

    it("should derive public key from mainnet xpub", async () => {
      const mainnetXpub =
        "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8";
      const result = await derivePublicKey(mainnetXpub);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString("hex")).toBe(
        "646572697665642d7075626c69632d6b6579",
      );
    });

    it("should handle public key input directly", async () => {
      const publicKey =
        "02e79c4eb45764bd015542f81cc475653a72b0f131243a3e4f68fdb8dde3a4574f";
      const result = await derivePublicKey(publicKey);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString("hex")).toBe(publicKey);
    });

    it("should throw error for invalid key format", async () => {
      const invalidKey = "invalid-key";

      await expect(derivePublicKey(invalidKey)).rejects.toThrow(
        "Invalid key format",
      );
    });
  });

  describe("createStandardMultisig", () => {
    it("should create standard 2-of-3 multisig wallet", () => {
      const borrowerPubKey = Buffer.from("02" + "a".repeat(64), "hex");
      const lenderPubKey = Buffer.from("02" + "b".repeat(64), "hex");
      const signer3PubKey = Buffer.from(SIGNER3_PUBLIC_KEY, "hex");

      const result = createStandardMultisig(
        borrowerPubKey,
        lenderPubKey,
        signer3PubKey,
        bitcoin.networks.testnet,
      );

      expect(result).toHaveProperty("address");
      expect(result).toHaveProperty("redeemScript");
      expect(result).toHaveProperty("witnessScript");
      expect(result.address).toMatch(/^tb1q/);
      expect(result.redeemScript).toBe("636f6d70696c65642d736372697074");
      expect(result.witnessScript).toBe("636f6d70696c65642d736372697074");
    });

    it("should sort public keys deterministically", () => {
      const borrowerPubKey = Buffer.from("02" + "c".repeat(64), "hex");
      const lenderPubKey = Buffer.from("02" + "a".repeat(64), "hex");
      const signer3PubKey = Buffer.from("02" + "b".repeat(64), "hex");

      const result = createStandardMultisig(
        borrowerPubKey,
        lenderPubKey,
        signer3PubKey,
        bitcoin.networks.testnet,
      );

      expect(result).toHaveProperty("address");
      expect(bitcoin.script.compile).toHaveBeenCalled();
    });
  });

  describe("createTimelockMultisig", () => {
    it("should create timelock multisig wallet", () => {
      const borrowerPubKey = Buffer.from("02" + "a".repeat(64), "hex");
      const lenderPubKey = Buffer.from("02" + "b".repeat(64), "hex");
      const signer3PubKey = Buffer.from(SIGNER3_PUBLIC_KEY, "hex");
      const timelockBlocks = 144;

      const result = createTimelockMultisig(
        borrowerPubKey,
        lenderPubKey,
        signer3PubKey,
        timelockBlocks,
        bitcoin.networks.testnet,
      );

      expect(result).toHaveProperty("address");
      expect(result).toHaveProperty("redeemScript");
      expect(result).toHaveProperty("witnessScript");
      expect(result.address).toMatch(/^tb1q/);
    });

    it("should handle different timelock values", () => {
      const borrowerPubKey = Buffer.from("02" + "a".repeat(64), "hex");
      const lenderPubKey = Buffer.from("02" + "b".repeat(64), "hex");
      const signer3PubKey = Buffer.from(SIGNER3_PUBLIC_KEY, "hex");
      const timelockBlocks = 1008; // 1 week

      const result = createTimelockMultisig(
        borrowerPubKey,
        lenderPubKey,
        signer3PubKey,
        timelockBlocks,
        bitcoin.networks.testnet,
      );

      expect(result).toHaveProperty("address");
      expect(bitcoin.script.compile).toHaveBeenCalled();
    });
  });

  describe("createMultisigWallet", () => {
    it("should create standard multisig wallet without timelock", async () => {
      const borrowerKey = "02" + "a".repeat(64);
      const lenderKey = "02" + "b".repeat(64);

      const result = await createMultisigWallet(
        borrowerKey,
        lenderKey,
        "testnet",
        false,
        144,
      );

      expect(result).toHaveProperty("address");
      expect(result).toHaveProperty("redeemScript");
      expect(result).toHaveProperty("witnessScript");
      expect(result).toHaveProperty("publicKeys");
      expect(result).toHaveProperty("network");
      expect(result).toHaveProperty("includeTimelock");
      expect(result).toHaveProperty("timelockBlocks");

      expect(result.network).toBe("testnet");
      expect(result.includeTimelock).toBe(false);
      expect(result.timelockBlocks).toBe(144);
      expect(result.publicKeys).toHaveProperty("borrower");
      expect(result.publicKeys).toHaveProperty("lender");
      expect(result.publicKeys).toHaveProperty("signer3");
    });

    it("should create timelock multisig wallet", async () => {
      const borrowerKey = "02" + "a".repeat(64);
      const lenderKey = "02" + "b".repeat(64);

      const result = await createMultisigWallet(
        borrowerKey,
        lenderKey,
        "testnet",
        true,
        144,
      );

      expect(result).toHaveProperty("address");
      expect(result.network).toBe("testnet");
      expect(result.includeTimelock).toBe(true);
      expect(result.timelockBlocks).toBe(144);
    });

    it("should work with mainnet", async () => {
      const borrowerKey = "02" + "a".repeat(64);
      const lenderKey = "02" + "b".repeat(64);

      const result = await createMultisigWallet(
        borrowerKey,
        lenderKey,
        "mainnet",
        false,
        144,
      );

      expect(result.network).toBe("mainnet");
    });

    it("should handle xpub inputs", async () => {
      const borrowerKey =
        "tpubD6NzVbkrYhZ4XgiXtGrdW5XDAPFCL9h7we1vwNCpn8tGbBcgfVYjXyhWo4E1xkh56hjod1WeGZ8Lxw1cRP7L2qs3NQbTXc2qFCxqKXrGjP";
      const lenderKey = "02" + "b".repeat(64);

      const result = await createMultisigWallet(
        borrowerKey,
        lenderKey,
        "testnet",
        false,
        144,
      );

      expect(result).toHaveProperty("address");
      expect(result.publicKeys.borrower).toBeInstanceOf(Buffer);
    });

    it("should throw error for invalid inputs", async () => {
      const invalidKey = "invalid-key";
      const validKey = "02" + "a".repeat(64);

      await expect(
        createMultisigWallet(invalidKey, validKey, "testnet", false, 144),
      ).rejects.toThrow("Failed to create multisig wallet");
    });

    it("should use correct Signer3 public key", async () => {
      const borrowerKey = "02" + "a".repeat(64);
      const lenderKey = "02" + "b".repeat(64);

      const result = await createMultisigWallet(
        borrowerKey,
        lenderKey,
        "testnet",
        false,
        144,
      );

      expect(result.publicKeys.signer3.toString("hex")).toBe(
        SIGNER3_PUBLIC_KEY,
      );
    });
  });

  describe("Constants", () => {
    it("should have valid Signer3 public key", () => {
      expect(SIGNER3_PUBLIC_KEY).toBe(
        "02e79c4eb45764bd015542f81cc475653a72b0f131243a3e4f68fdb8dde3a4574f",
      );
      expect(SIGNER3_PUBLIC_KEY).toMatch(/^02[a-fA-F0-9]{64}$/);
    });
  });
});
