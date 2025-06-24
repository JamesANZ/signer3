// Hardcoded Signer3 xpub (this would be your company's xpub)
const SIGNER3_XPUB =
  "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1RBupc5QgFvqHxrT7uKJzZqBqZWF5z8oBzqZWF5z";

// Global variables to store the generated wallet data
let generatedWalletData = null;

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeForm();
  setupEventListeners();
});

function initializeForm() {
  // Show/hide timelock options based on checkbox
  const timelockCheckbox = document.getElementById("includeTimelock");
  const timelockOptions = document.getElementById("timelockOptions");

  timelockCheckbox.addEventListener("change", function () {
    timelockOptions.style.display = this.checked ? "block" : "none";
  });
}

function setupEventListeners() {
  const form = document.getElementById("multisigForm");
  form.addEventListener("submit", handleFormSubmit);
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const borrowerKey = formData.get("borrowerKey").trim();
  const lenderKey = formData.get("lenderKey").trim();
  const network = formData.get("network");
  const includeTimelock = formData.get("includeTimelock") === "on";
  const timelockBlocks = parseInt(formData.get("timelockBlocks")) || 144;

  if (!borrowerKey || !lenderKey) {
    alert("Please enter both borrower and lender keys.");
    return;
  }

  try {
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Creating Wallet...";

    // Create the multisig wallet
    const walletData = await createMultisigWallet(
      borrowerKey,
      lenderKey,
      network,
      includeTimelock,
      timelockBlocks,
    );

    // Store the generated data
    generatedWalletData = walletData;

    // Display the results
    displayResults(walletData);

    // Show the result card
    document.getElementById("resultCard").style.display = "block";

    // Scroll to results
    document
      .getElementById("resultCard")
      .scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Error creating multisig wallet:", error);
    alert("Error creating multisig wallet: " + error.message);
  } finally {
    // Reset button state
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.textContent = "Create Multisig Wallet";
  }
}

async function createMultisigWallet(
  borrowerKey,
  lenderKey,
  network,
  includeTimelock,
  timelockBlocks,
) {
  try {
    // Set up Bitcoin.js network
    const bitcoinNetwork =
      network === "mainnet"
        ? bitcoin.networks.bitcoin
        : bitcoin.networks.testnet;

    // Parse and derive public keys
    const borrowerPubKey = await derivePublicKey(borrowerKey, bitcoinNetwork);
    const lenderPubKey = await derivePublicKey(lenderKey, bitcoinNetwork);
    const signer3PubKey = await derivePublicKey(SIGNER3_XPUB, bitcoinNetwork);

    let redeemScript, witnessScript, address;

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
    throw new Error("Failed to create multisig wallet: " + error.message);
  }
}

async function derivePublicKey(keyInput, network) {
  try {
    // Check if input is an xpub
    if (keyInput.startsWith("xpub") || keyInput.startsWith("tpub")) {
      // Derive a child key from xpub (using path m/0/0)
      const xpub = bip32.BIP32Factory().fromBase58(keyInput, network);
      const child = xpub.derivePath("0/0");
      return child.publicKey;
    } else {
      // Assume it's already a public key
      return Buffer.from(keyInput, "hex");
    }
  } catch (error) {
    throw new Error("Invalid key format: " + error.message);
  }
}

function createStandardMultisig(
  borrowerPubKey,
  lenderPubKey,
  signer3PubKey,
  network,
) {
  // Create 2-of-3 multisig
  const pubkeys = [borrowerPubKey, lenderPubKey, signer3PubKey].sort((a, b) => {
    return Buffer.compare(a, b);
  });

  const redeemScript = bitcoin.script.multisig.output(2, pubkeys);
  const witnessScript = redeemScript;

  // Generate P2WSH address
  const address = bitcoin.payments.p2wsh({
    redeem: { output: redeemScript },
    network: network,
  }).address;

  return {
    redeemScript: redeemScript.toString("hex"),
    witnessScript: witnessScript.toString("hex"),
    address: address,
  };
}

function createTimelockMultisig(
  borrowerPubKey,
  lenderPubKey,
  signer3PubKey,
  timelockBlocks,
  network,
) {
  // Sort public keys for deterministic ordering
  const pubkeys = [borrowerPubKey, lenderPubKey, signer3PubKey].sort((a, b) => {
    return Buffer.compare(a, b);
  });

  // Create the timelock script
  // OP_IF <timelock> OP_CSV OP_DROP <2-of-3 multisig>
  // OP_ELSE <2-of-3 multisig> OP_ENDIF
  const timelockScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    Buffer.from([timelockBlocks & 0xff, (timelockBlocks >> 8) & 0xff]), // Little-endian
    bitcoin.opcodes.OP_CSV,
    bitcoin.opcodes.OP_DROP,
    bitcoin.script.multisig.output(2, pubkeys),
    bitcoin.opcodes.OP_ELSE,
    bitcoin.script.multisig.output(2, pubkeys),
    bitcoin.opcodes.OP_ENDIF,
  ]);

  // Generate P2WSH address
  const address = bitcoin.payments.p2wsh({
    redeem: { output: timelockScript },
    network: network,
  }).address;

  return {
    redeemScript: timelockScript.toString("hex"),
    witnessScript: timelockScript.toString("hex"),
    address: address,
  };
}

function displayResults(walletData) {
  // Display wallet address
  document.getElementById("walletAddress").textContent = walletData.address;

  // Display redeem script
  document.getElementById("redeemScript").textContent = walletData.redeemScript;

  // Display witness script
  document.getElementById("witnessScript").textContent =
    walletData.witnessScript;

  // Display public keys
  document.getElementById("borrowerPubKey").textContent =
    walletData.publicKeys.borrower.toString("hex");
  document.getElementById("lenderPubKey").textContent =
    walletData.publicKeys.lender.toString("hex");
  document.getElementById("signer3PubKey").textContent =
    walletData.publicKeys.signer3.toString("hex");
}

function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  const text = element.textContent;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      // Show temporary success message
      const button = element.parentElement.querySelector(".btn-copy");
      const originalText = button.textContent;
      button.textContent = "Copied!";
      button.style.background = "#48bb78";

      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = "#667eea";
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
      alert("Failed to copy to clipboard");
    });
}

function downloadScript() {
  if (!generatedWalletData) {
    alert("No wallet data to download");
    return;
  }

  const config = {
    walletAddress: generatedWalletData.address,
    redeemScript: generatedWalletData.redeemScript,
    witnessScript: generatedWalletData.witnessScript,
    publicKeys: {
      borrower: generatedWalletData.publicKeys.borrower.toString("hex"),
      lender: generatedWalletData.publicKeys.lender.toString("hex"),
      signer3: generatedWalletData.publicKeys.signer3.toString("hex"),
    },
    network: generatedWalletData.network,
    includeTimelock: generatedWalletData.includeTimelock,
    timelockBlocks: generatedWalletData.timelockBlocks,
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
}

// Utility function to validate xpub format
function isValidXpub(xpub) {
  try {
    const decoded = bitcoin.address.fromBech32(xpub);
    return true;
  } catch (e) {
    try {
      const decoded = bitcoin.address.fromBase58Check(xpub);
      return true;
    } catch (e2) {
      return false;
    }
  }
}

// Utility function to validate public key format
function isValidPublicKey(pubKey) {
  try {
    const buffer = Buffer.from(pubKey, "hex");
    return buffer.length === 33 || buffer.length === 65;
  } catch (e) {
    return false;
  }
}
