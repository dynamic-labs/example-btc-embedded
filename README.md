# BTC Demo - Dynamic Labs Bitcoin Wallet Demo

This is a Next.js application demonstrating Bitcoin wallet functionality using the Dynamic Labs SDK. It showcases various Bitcoin operations including wallet creation, message signing, PSBT transactions, and private key management.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up your Dynamic Labs environment ID:
   - Create a `.env.local` file in the root directory
   - Add your Dynamic Labs environment ID:
     ```
     NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_environment_id_here
     ```
   - The app uses the pre-production API by default: `https://app.dynamic-preprod.xyz/api/v0`

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3004](http://localhost:3004) in your browser.

## Features

The application provides a comprehensive Bitcoin wallet demo with the following tabs:

### 1. Create Wallets
- Create Bitcoin wallets with different address types (Native SegWit, Taproot)
- View existing Bitcoin wallets in a table format
- Display wallet addresses, types, and network information

### 2. Sign Messages
- Sign messages using Bitcoin wallets
- BIP-322 signature verification
- Support for multiple Bitcoin wallets

### 3. Transactions
This tab includes multiple sections:

#### Send Bitcoin
- Send Bitcoin directly with automatic PSBT creation, signing, and broadcasting
- Configure fee priority (low, medium, high)
- Input amounts in BTC (automatically converted to satoshis)

#### Build PSBT
- Create Partially Signed Bitcoin Transactions (PSBTs)
- Specify recipient address and amount
- Configure fee priority
- Automatically populates the Sign PSBT section

#### Sign PSBT
- Sign existing PSBTs (from Build PSBT or external sources)
- View signed PSBT output
- Finalize signed PSBTs to prepare for broadcasting

#### Broadcast Transaction
- Broadcast finalized transactions to the Bitcoin network
- Accepts finalized transaction hex (auto-populated or manually entered)
- View transaction IDs after successful broadcast

### 4. Export Private Key
- Export private keys from Bitcoin wallets
- Secure container-based export interface
- Support for multiple wallets

### 5. Import Private Key
- Import existing private keys to create wallets
- Support for Native SegWit and Taproot address types
- Add imported wallets to your account

## Technical Details

### Dependencies
- `@dynamic-labs/bitcoin` - Bitcoin wallet functionality
- `@dynamic-labs/sdk-react-core` - Dynamic Labs SDK core
- `bitcoinjs-lib` - Bitcoin transaction and PSBT handling
- `bip322-js` - BIP-322 message signing verification

### Configuration

The app requires Content Security Policy (CSP) headers to allow connections to:
- Dynamic Labs API endpoints
- Mempool.space (for Bitcoin UTXO data)

These are configured in `next.config.js`.

### Component Structure

- `BitcoinWalletDemo.tsx` - Main component with tab navigation
- `CreateWalletsTab.tsx` - Wallet creation and listing
- `SignMessagesTab.tsx` - Message signing functionality
- `TransactionsTab.tsx` - All transaction-related operations
- `ExportPrivateKeyTab.tsx` - Private key export
- `ImportPrivateKeyTab.tsx` - Private key import

## Important Notes

### Port Configuration

The application runs on port **3004** by default (not 3000). This is configured in `package.json`.

### Automatic Wallet Creation

Bitcoin wallets can be created automatically during sign-up if enabled in the Dynamic Dashboard. The demo also supports manual wallet creation.

## Development

### Scripts

- `npm run dev` - Start development server on port 3004
- `npm run build` - Build for production
- `npm run start` - Start production server on port 3004
- `npm run lint` - Run ESLint

### Environment

The app uses Next.js 14 with React 18 and TypeScript. Make sure you have Node.js 18+ installed.

## License

This is a demo application for testing Dynamic Labs Bitcoin wallet functionality.
