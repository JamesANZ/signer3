# Signer3

MultiSig arbitrator solution for bitcoin collateral.

## The Problem

Many bitcoin collateralised loan providers require the borrower to give up full custody of their funds to the lender. This opens up the borrower and lender to a variety of risks such as security hacks, fraud and insolvency risk. While many bitcoiners are open to the idea of using their bitcoin as collateral for loans, few are willing to subject their coins to such risk and are therefore reluctant to use such services.

## The Solution

Signer3 aims to resolve this issue by acting as a neutral third party and signatory in a bitcoin multisig used to hold funds as collateral. Using a 2 of 3 multisig as an example (with the borrower, lender and signer3 each holding a key), here's how a typical flow would look:

1. The borrower deposits funds into the multisig
2. When the borrower and lender agree, both parties co sign the transaction (without Signer3)
3. When the borrower and lender disagree, both parties go to court or a tribunal
4. Signer3 steps in an co signers a transaction based on the outcome of the court dispute, using either the borrower or lenders key
5. If either the borrower or lender lose access to their key or are compromised, signer3 can recover the funds with the functional signatory

This example scenario can be expanded to include more signatories or a different threshold of required signatures.

## Additional Services

### Timelock Recovery

Signer3 can also be configured as a recovery signer, an example of how this could look is detailed below:

1. Signer3's key is set to be a valid signer after a certain CSV timelock condition is met
2. If both the lender and borrower lose access to their keys, Signer3 can recover the funds after the timelock condition is met

## User Interface

This repository includes a modern Next.js web application that allows users to create 2-of-3 multisig wallets with the following features:

### Features

- **2-of-3 Multisig Creation**: Create secure multisig wallets with borrower, lender, and Signer3 as signatories
- **CSV Timelock Support**: Optional timelock recovery mechanism for emergency fund recovery
- **Multiple Key Formats**: Support for both xpub keys and raw public keys
- **Network Support**: Works with both Bitcoin mainnet and testnet
- **Script Download**: Download complete wallet configuration as JSON
- **Modern UI**: Clean, responsive interface with copy-to-clipboard functionality
- **TypeScript**: Full type safety and better development experience
- **Tailwind CSS**: Modern, utility-first CSS framework

### How to Use

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Start Development Server**:

   ```bash
   npm run dev
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:3000`

4. **Create a Multisig Wallet**:
   - Enter the borrower's public key (xpub or raw public key)
   - Enter the lender's public key (xpub or raw public key)
   - Select the network (testnet/mainnet)
   - Optionally enable CSV timelock recovery
   - Set timelock duration if enabled
   - Click "Create Multisig Wallet"

5. **Download Configuration**:
   - Review the generated wallet address, scripts, and public keys
   - Use the copy buttons to copy individual values
   - Click "Download Script Configuration" to save the complete configuration

### Input Formats

#### Public Keys

- **xpub/tpub**: Extended public keys (e.g., `xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1RBupc5QgFvqHxrT7uKJzZqBqZWF5z8oBzqZWF5z`)
- **Raw Public Keys**: 33-byte compressed or 65-byte uncompressed public keys in hex format

#### Timelock Duration

- **Blocks**: Number of blocks before Signer3 can recover funds
- **Default**: 144 blocks (approximately 1 day)
- **Range**: 1-65535 blocks

### Output

The application generates:

- **Wallet Address**: P2WSH address for receiving funds
- **Redeem Script**: The multisig script in hex format
- **Witness Script**: Same as redeem script for P2WSH
- **Public Keys**: All three public keys used in the multisig

### Security Considerations

1. **Key Management**: Never share private keys. Only public keys are used in this interface.
2. **Network Selection**: Use testnet for testing, mainnet for production.
3. **Timelock Duration**: Choose appropriate timelock duration based on your risk tolerance.
4. **Backup**: Always backup the downloaded configuration file securely.

### Technical Details

#### Script Structure

- **Standard 2-of-3**: `OP_2 <pubkey1> <pubkey2> <pubkey3> OP_3 OP_CHECKMULTISIG`
- **With Timelock**:
  ```
  OP_IF <timelock> OP_CSV OP_DROP <2-of-3 multisig>
  OP_ELSE <2-of-3 multisig> OP_ENDIF
  ```

#### Address Type

- Uses P2WSH (Pay-to-Witness-Script-Hash) for native SegWit addresses
- Provides better security and lower transaction fees

### Development

#### Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn package manager

#### Dependencies

- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling framework
- **bitcoinjs-lib**: Bitcoin protocol implementation (via CDN)
- **bip32**: BIP32 hierarchical deterministic wallets (via CDN)
- **bip39**: BIP39 mnemonic generation (via CDN)

#### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

#### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # Root layout with CDN scripts
│   ├── page.tsx        # Main page component
│   └── globals.css     # Global styles with Tailwind
├── components/         # React components
│   ├── MultisigForm.tsx
│   └── ResultCard.tsx
├── lib/               # Utility functions
│   └── bitcoin.ts     # Bitcoin.js integration
└── types/             # TypeScript type definitions
    └── wallet.ts
```

#### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/signer3.git
cd signer3

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### License

MIT License - see LICENSE file for details.

### Support

For questions or support, please open an issue on GitHub or contact the development team.
