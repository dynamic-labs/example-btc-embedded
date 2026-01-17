'use client'

import { useState } from 'react';
import { useDynamicContext, useUserWallets } from "@dynamic-labs/sdk-react-core";
import { isBitcoinWallet, type EmbeddedWalletSignPsbtRequest, type BitcoinSignPsbtRequest, type BitcoinSignPsbtResponse, btcToSatoshis, BitcoinWallet } from '@dynamic-labs/bitcoin';
import { ChainEnum } from "@dynamic-labs/sdk-api-core";
import { Psbt } from 'bitcoinjs-lib';

export const TransactionsTab = () => {
  // Send Bitcoin state
  const [selectedSendWalletId, setSelectedSendWalletId] = useState<string>('');
  const [sendRecipientAddress, setSendRecipientAddress] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [sendFeePriority, setSendFeePriority] = useState<'high' | 'medium' | 'low' | ''>('medium');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string>('');

  // Build PSBT state
  const [selectedBuildWalletId, setSelectedBuildWalletId] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [feePriority, setFeePriority] = useState<'high' | 'medium' | 'low' | ''>('');
  const [builtPsbt, setBuiltPsbt] = useState<string>('');
  const [isBuildingPsbt, setIsBuildingPsbt] = useState(false);
  const [buildError, setBuildError] = useState<string>('');

  // Sign PSBT state
  const [unsignedPsbt, setUnsignedPsbt] = useState<string>('');
  const [signedPsbt, setSignedPsbt] = useState<string>('');
  const [finalizedPsbtHex, setFinalizedPsbtHex] = useState<string>('');
  const [manualFinalizedTxHex, setManualFinalizedTxHex] = useState<string>('');
  const [psbtError, setPsbtError] = useState<string>('');
  const [isSigningPsbt, setIsSigningPsbt] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastTxId, setBroadcastTxId] = useState<string>('');
  const [broadcastError, setBroadcastError] = useState<string>('');
  const [selectedPsbtWalletId, setSelectedPsbtWalletId] = useState<string>('');
  const [selectedBroadcastWalletId, setSelectedBroadcastWalletId] = useState<string>('');
  const { user } = useDynamicContext();
  const userWallets = useUserWallets();

  const btcWalletsForSigning = userWallets.filter(
    (wallet) => wallet.chain === ChainEnum.Btc && isBitcoinWallet(wallet)
  );

  const handleSendBitcoin = async () => {
    if (!user) {
      setSendError('Please log in first');
      return;
    }

    if (!sendRecipientAddress.trim()) {
      setSendError('Please enter a recipient address');
      return;
    }

    if (!sendAmount.trim() || parseFloat(sendAmount) <= 0) {
      setSendError('Please enter a valid amount (in BTC)');
      return;
    }

    const selectedWallet = userWallets.find(w => w.id === selectedSendWalletId);
    if (!selectedWallet) {
      setSendError('Please select a wallet');
      return;
    }

    if (!isBitcoinWallet(selectedWallet)) {
      setSendError('Selected wallet is not a Bitcoin wallet');
      return;
    }

    const bitcoinWallet = selectedWallet as BitcoinWallet;

    try {
      setIsSending(true);
      setSendError('');
      setTransactionId('');

      // Convert BTC to satoshis
      const amountInSatoshis = btcToSatoshis(parseFloat(sendAmount));

      // sendBitcoin automatically creates PSBT, signs it, and broadcasts
      const txId = await bitcoinWallet.sendBitcoin({
        recipientAddress: sendRecipientAddress.trim(),
        amount: amountInSatoshis, // Keep as bigint
        ...(sendFeePriority && { feePriority: sendFeePriority as 'high' | 'medium' | 'low' }), // Optional fee priority
      });

      if (txId) {
        setTransactionId(txId);
        // Clear form after successful send
        setSendRecipientAddress('');
        setSendAmount('');
      } else {
        setSendError('Transaction sent but no transaction ID returned');
      }
    } catch (error) {
      setSendError(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleBuildPsbt = async () => {
    if (!user) {
      setBuildError('Please log in first');
      return;
    }

    if (!recipientAddress.trim()) {
      setBuildError('Please enter a recipient address');
      return;
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      setBuildError('Please enter a valid amount (in BTC)');
      return;
    }

    const selectedWallet = userWallets.find(w => w.id === selectedBuildWalletId);
    if (!selectedWallet) {
      setBuildError('Please select a wallet');
      return;
    }

    if (!isBitcoinWallet(selectedWallet)) {
      setBuildError('Selected wallet is not a Bitcoin wallet');
      return;
    }

    const bitcoinWallet = selectedWallet as BitcoinWallet;

    try {
      setIsBuildingPsbt(true);
      setBuildError('');
      setBuiltPsbt('');

      // Call buildPsbt on the wallet
      // Convert BTC to satoshis
      const amountInSatoshis = btcToSatoshis(parseFloat(amount));
      
      const buildRequest = {
        recipientAddress: recipientAddress.trim(),
        amount: amountInSatoshis, // Keep as bigint
        ...(feePriority && { feePriority: feePriority as 'high' | 'medium' | 'low' }), // Optional fee priority
      };

      const result = await bitcoinWallet.buildPsbt(buildRequest);
      
      if (!result) {
        setBuildError('Failed to build PSBT: No result from wallet');
        return;
      }
      
      // The result should be a Base64 PSBT string
      setBuiltPsbt(result);
      
      // Automatically populate the unsigned PSBT field for signing
      setUnsignedPsbt(result);
      setSelectedPsbtWalletId(selectedBuildWalletId);
    } catch (error) {
      setBuildError(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsBuildingPsbt(false);
    }
  };

  const handleSignPsbt = async () => {
    if (!user) {
      setPsbtError('Please log in first');
      return;
    }

    if (!unsignedPsbt.trim()) {
      setPsbtError('Please enter an unsigned PSBT');
      return;
    }

    const selectedWallet = userWallets.find(w => w.id === selectedPsbtWalletId)
    if (!selectedWallet) {
      setPsbtError('Please select a wallet');
      return;
    }

    if (!isBitcoinWallet(selectedWallet)) {
      setPsbtError('Selected wallet is not a Bitcoin wallet');
      return;
    }

    const bitcoinWallet = selectedWallet as BitcoinWallet;

    try {
      setIsSigningPsbt(true);
      setPsbtError('');
      setSignedPsbt('');

      // For embedded wallets, we use EmbeddedWalletSignPsbtRequest which only needs unsignedPsbtBase64
      // But the signPsbt method expects BitcoinSignPsbtRequest, so we cast it
      const request = {
        unsignedPsbtBase64: unsignedPsbt.trim(),
        allowedSighash: [0x01], // SIGHASH_ALL is typically used for embedded wallets
      } as BitcoinSignPsbtRequest;

      const response = await bitcoinWallet.signPsbt(request);
      
      if (!response) {
        setPsbtError('Failed to sign PSBT: No response from wallet');
        return;
      }

      const { signedPsbt: result } = response;

      setSignedPsbt(result);
      // Clear finalized and broadcast state when signing a new PSBT
      setFinalizedPsbtHex('');
      setManualFinalizedTxHex('');
      setBroadcastTxId('');
      setBroadcastError('');
    } catch (error) {
      setPsbtError(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsSigningPsbt(false);
    }
  };

  const handleFinalizePsbt = async () => {
    if (!signedPsbt.trim()) {
      setPsbtError('Please sign the PSBT first');
      return;
    }

    try {
      setIsFinalizing(true);
      setPsbtError('');
      setFinalizedPsbtHex('');
      setBroadcastError('');

      // Convert Base64 PSBT to Psbt object
      const psbtBuffer = typeof Buffer !== 'undefined' 
        ? Buffer.from(signedPsbt.trim(), 'base64')
        : Uint8Array.from(atob(signedPsbt.trim()), c => c.charCodeAt(0));
      const psbt = typeof Buffer !== 'undefined'
        ? Psbt.fromBuffer(psbtBuffer as Buffer)
        : Psbt.fromBuffer(psbtBuffer);

      // Finalize all inputs
      psbt.finalizeAllInputs();

      // Extract the finalized transaction as hex
      const finalizedTx = psbt.extractTransaction();
      const txHex = finalizedTx.toHex();

      setFinalizedPsbtHex(txHex);
      // Auto-populate the manual input field for broadcasting
      setManualFinalizedTxHex(txHex);
    } catch (error) {
      setPsbtError(
        `Error finalizing PSBT: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleBroadcastTransaction = async () => {
    // Use either the auto-populated finalized hex or the manually entered one
    const txHexToBroadcast = finalizedPsbtHex.trim() || manualFinalizedTxHex.trim();
    
    if (!txHexToBroadcast) {
      setBroadcastError('Please enter or finalize a transaction hex');
      return;
    }

    const selectedWallet = userWallets.find(w => w.id === selectedBroadcastWalletId || w.id === selectedPsbtWalletId);
    if (!selectedWallet) {
      setBroadcastError('Please select a wallet');
      return;
    }

    if (!isBitcoinWallet(selectedWallet)) {
      setBroadcastError('Selected wallet is not a Bitcoin wallet');
      return;
    }

    const bitcoinWallet = selectedWallet as BitcoinWallet;

    try {
      setIsBroadcasting(true);
      setBroadcastError('');
      setBroadcastTxId('');

      // Send the raw transaction
      const txId = await bitcoinWallet.sendRawTransaction(txHexToBroadcast);

      if (txId) {
        setBroadcastTxId(txId);
        // Clear the manual input after successful broadcast
        setManualFinalizedTxHex('');
      } else {
        setBroadcastError('Failed to broadcast transaction: No transaction ID returned');
      }
    } catch (error) {
      setBroadcastError(
        `Error broadcasting transaction: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Bitcoin Transactions</h2>
      
      {/* Send Bitcoin Section */}
      <div style={{ 
        padding: '1.5rem', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        backgroundColor: '#f9f9f9'
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Send Bitcoin</h3>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
          Send Bitcoin directly. This function automatically creates a PSBT, signs it, and broadcasts the transaction. You can specify the fee priority (defaults to medium).
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="send-wallet-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Select Bitcoin Wallet:
          </label>
          <select
            id="send-wallet-select"
            value={selectedSendWalletId}
            onChange={(e) => setSelectedSendWalletId(e.target.value || '')}
            disabled={isSending}
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              width: '100%',
              maxWidth: '400px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          >
            <option value="">Select a wallet</option>
            {btcWalletsForSigning.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.address} ({wallet.chain})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="send-recipient-address" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Recipient Address:
          </label>
          <input
            id="send-recipient-address"
            type="text"
            value={sendRecipientAddress}
            onChange={(e) => setSendRecipientAddress(e.target.value)}
            disabled={isSending}
            placeholder="bc1..."
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              width: '100%',
              maxWidth: '400px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontFamily: 'monospace',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="send-amount-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Amount (BTC):
          </label>
          <input
            id="send-amount-input"
            type="number"
            value={sendAmount}
            onChange={(e) => setSendAmount(e.target.value)}
            disabled={isSending}
            placeholder="0.001"
            min="0.00000001"
            step="0.00000001"
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              width: '100%',
              maxWidth: '200px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          />
          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
            Enter the amount in BTC (will be converted to satoshis automatically).
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="send-fee-priority-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Fee Priority <span style={{ color: '#666', fontWeight: 'normal' }}>(Optional)</span>:
          </label>
          <select
            id="send-fee-priority-select"
            value={sendFeePriority}
            onChange={(e) => setSendFeePriority(e.target.value as 'high' | 'medium' | 'low' | '')}
            disabled={isSending}
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              width: '100%',
              maxWidth: '200px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          >
            <option value="medium">Medium (Default)</option>
            <option value="low">Low</option>
            <option value="high">High</option>
          </select>
          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
            Select fee priority level. Defaults to medium if not specified.
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={handleSendBitcoin}
            disabled={isSending || !selectedSendWalletId || !sendRecipientAddress.trim() || !sendAmount.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: isSending || !selectedSendWalletId || !sendRecipientAddress.trim() || !sendAmount.trim() ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSending || !selectedSendWalletId || !sendRecipientAddress.trim() || !sendAmount.trim() ? 'not-allowed' : 'pointer',
              opacity: isSending || !selectedSendWalletId || !sendRecipientAddress.trim() || !sendAmount.trim() ? 0.6 : 1,
            }}
          >
            {isSending ? 'Sending...' : 'Send Bitcoin'}
          </button>
        </div>

        {sendError && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#ffebee', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            border: '1px solid #f44336',
            color: '#c62828'
          }}>
            <strong>Error:</strong> {sendError}
          </div>
        )}

        {transactionId && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#e8f5e9', 
              borderRadius: '4px', 
              marginBottom: '1rem',
              border: '1px solid #4caf50',
              color: '#2e7d32'
            }}>
              <strong>✓ Transaction Sent Successfully!</strong>
            </div>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Transaction ID:</h4>
            <pre
              style={{
                padding: '1rem',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.875rem',
                border: '1px solid #ddd',
                fontFamily: 'monospace',
              }}
            >
              {transactionId}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(transactionId);
                alert('Transaction ID copied to clipboard!');
              }}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Copy Transaction ID
            </button>
          </div>
        )}
      </div>

      {/* Build PSBT Section */}
      <div style={{ 
        padding: '1.5rem', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        backgroundColor: '#f9f9f9'
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Build PSBT</h3>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
          Create a new Partially Signed Bitcoin Transaction (PSBT) for a specific wallet.
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="build-wallet-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Select Bitcoin Wallet:
          </label>
          <select
            id="build-wallet-select"
            value={selectedBuildWalletId}
            onChange={(e) => setSelectedBuildWalletId(e.target.value || '')}
            disabled={isBuildingPsbt}
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              width: '100%',
              maxWidth: '400px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          >
            <option value="">Select a wallet</option>
            {btcWalletsForSigning.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.address} ({wallet.chain})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="recipient-address" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Recipient Address:
          </label>
          <input
            id="recipient-address"
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            disabled={isBuildingPsbt}
            placeholder="bc1..."
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              width: '100%',
              maxWidth: '400px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontFamily: 'monospace',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="amount-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Amount (BTC):
          </label>
          <input
            id="amount-input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isBuildingPsbt}
            placeholder="0.001"
            min="0.00000001"
            step="0.00000001"
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              width: '100%',
              maxWidth: '200px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          />
          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
            Enter the amount in BTC (will be converted to satoshis automatically)
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="fee-priority-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Fee Priority <span style={{ color: '#666', fontWeight: 'normal' }}>(Optional)</span>:
          </label>
          <select
            id="fee-priority-select"
            value={feePriority}
            onChange={(e) => setFeePriority(e.target.value as 'high' | 'medium' | 'low' | '')}
            disabled={isBuildingPsbt}
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              width: '100%',
              maxWidth: '200px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          >
            <option value="">Auto (Medium)</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
            Select fee priority level. Leave as "Auto" for automatic fee calculation (defaults to Medium).
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={handleBuildPsbt}
            disabled={isBuildingPsbt || !selectedBuildWalletId || !recipientAddress.trim() || !amount.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: isBuildingPsbt || !selectedBuildWalletId || !recipientAddress.trim() || !amount.trim() ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isBuildingPsbt || !selectedBuildWalletId || !recipientAddress.trim() || !amount.trim() ? 'not-allowed' : 'pointer',
              opacity: isBuildingPsbt || !selectedBuildWalletId || !recipientAddress.trim() || !amount.trim() ? 0.6 : 1,
            }}
          >
            {isBuildingPsbt ? 'Building PSBT...' : 'Build PSBT'}
          </button>
        </div>

        {buildError && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#ffebee', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            border: '1px solid #f44336',
            color: '#c62828'
          }}>
            <strong>Error:</strong> {buildError}
          </div>
        )}

        {builtPsbt && (
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Built PSBT (Base64):</h4>
            <pre
              style={{
                padding: '1rem',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.875rem',
                border: '1px solid #ddd',
                fontFamily: 'monospace',
                maxHeight: '200px',
              }}
            >
              {builtPsbt}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(builtPsbt);
                alert('PSBT copied to clipboard!');
              }}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Copy PSBT
            </button>
            <p style={{ fontSize: '0.875rem', color: '#4caf50', marginTop: '0.5rem' }}>
              ✓ PSBT has been automatically populated in the Sign PSBT section below
            </p>
          </div>
        )}
      </div>

      {/* Sign PSBT Section */}
      <div style={{ 
        padding: '1.5rem', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        marginBottom: '2rem',
        backgroundColor: '#f9f9f9'
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Sign PSBT</h3>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
          Sign an existing PSBT. You can use a PSBT built above or paste your own.
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="psbt-wallet-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Select Bitcoin Wallet:
        </label>
        <select
          id="psbt-wallet-select"
          value={selectedPsbtWalletId}
          onChange={(e) => setSelectedPsbtWalletId(e.target.value || '')}
          disabled={isSigningPsbt}
          style={{
            padding: '0.5rem',
            fontSize: '1rem',
            width: '100%',
            maxWidth: '400px',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        >
          <option value="">Select a wallet</option>
          {btcWalletsForSigning.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.address} ({wallet.chain})
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="unsigned-psbt-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Unsigned PSBT (Base64):
        </label>
        <textarea
          id="unsigned-psbt-input"
          value={unsignedPsbt}
          onChange={(e) => setUnsignedPsbt(e.target.value)}
          disabled={isSigningPsbt}
          placeholder="Enter unsigned PSBT in Base64 format"
          style={{
            padding: '0.5rem',
            fontSize: '1rem',
            width: '100%',
            maxWidth: '600px',
            minHeight: '150px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontFamily: 'monospace',
          }}
        />
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
          Paste the unsigned PSBT in Base64 format. The wallet will sign all inputs that belong to it.
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={handleSignPsbt}
          disabled={isSigningPsbt || !selectedPsbtWalletId || !unsignedPsbt.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: isSigningPsbt || !selectedPsbtWalletId || !unsignedPsbt.trim() ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSigningPsbt || !selectedPsbtWalletId || !unsignedPsbt.trim() ? 'not-allowed' : 'pointer',
            opacity: isSigningPsbt || !selectedPsbtWalletId || !unsignedPsbt.trim() ? 0.6 : 1,
          }}
        >
          {isSigningPsbt ? 'Signing PSBT...' : 'Sign PSBT'}
        </button>
      </div>

      {psbtError && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#ffebee', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid #f44336',
          color: '#c62828'
        }}>
          <strong>Error:</strong> {psbtError}
        </div>
      )}

      {signedPsbt && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Signed PSBT (Not Finalized):</h3>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#fff3e0', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            border: '1px solid #ff9800',
            color: '#e65100'
          }}>
            <strong>Note:</strong> This PSBT is signed but not finalized. Review the transaction details before finalizing and broadcasting.
          </div>
          <pre
            style={{
              padding: '1rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem',
              border: '1px solid #ddd',
              fontFamily: 'monospace',
              maxHeight: '300px',
            }}
          >
            {signedPsbt}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(signedPsbt);
              alert('Signed PSBT copied to clipboard!');
            }}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Copy Signed PSBT
          </button>

          {/* Finalize PSBT Button */}
          {signedPsbt && !finalizedPsbtHex && (
            <div style={{ marginTop: '1.5rem' }}>
              <button
                onClick={handleFinalizePsbt}
                disabled={isFinalizing || !signedPsbt.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  backgroundColor: isFinalizing || !signedPsbt.trim() ? '#ccc' : '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isFinalizing || !signedPsbt.trim() ? 'not-allowed' : 'pointer',
                  opacity: isFinalizing || !signedPsbt.trim() ? 0.6 : 1,
                  marginRight: '0.5rem',
                }}
              >
                {isFinalizing ? 'Finalizing...' : 'Finalize PSBT'}
              </button>
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                Finalize the signed PSBT to prepare it for broadcasting.
              </p>
            </div>
          )}

          {/* Finalized Transaction Hex */}
          {finalizedPsbtHex && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Finalized Transaction (Hex):</h4>
              <pre
                style={{
                  padding: '1rem',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  border: '1px solid #4caf50',
                  fontFamily: 'monospace',
                  maxHeight: '150px',
                }}
              >
                {finalizedPsbtHex}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(finalizedPsbtHex);
                  alert('Finalized transaction hex copied to clipboard!');
                }}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Copy Transaction Hex
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Broadcast Transaction Section - Always Rendered */}
      <div style={{
        padding: '1.5rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        marginBottom: '2rem',
        backgroundColor: '#f9f9f9'
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Broadcast Transaction</h3>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
          Broadcast a finalized transaction to the Bitcoin network. You can use a transaction finalized above or paste your own finalized transaction hex.
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="broadcast-wallet-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Select Bitcoin Wallet:
          </label>
          <select
            id="broadcast-wallet-select"
            value={selectedBroadcastWalletId || selectedPsbtWalletId}
            onChange={(e) => setSelectedBroadcastWalletId(e.target.value || '')}
            disabled={isBroadcasting || btcWalletsForSigning.length === 0}
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              width: '100%',
              maxWidth: '400px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          >
            <option value="">Select a wallet</option>
            {btcWalletsForSigning.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.address} ({wallet.chain})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="finalized-tx-hex-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Finalized Transaction Hex:
          </label>
          <textarea
            id="finalized-tx-hex-input"
            value={manualFinalizedTxHex || finalizedPsbtHex}
            onChange={(e) => {
              // Always update manual input when user types
              setManualFinalizedTxHex(e.target.value);
              // Clear auto-populated hex if user starts editing
              if (finalizedPsbtHex && e.target.value !== finalizedPsbtHex) {
                setFinalizedPsbtHex('');
              }
            }}
            disabled={isBroadcasting}
            placeholder="Enter finalized transaction hex (or it will be auto-populated if you finalized above)"
            rows={4}
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              width: '100%',
              maxWidth: '600px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontFamily: 'monospace',
            }}
          />
          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
            {finalizedPsbtHex && !manualFinalizedTxHex
              ? 'Transaction hex from finalized PSBT (you can edit if needed)'
              : 'Paste your finalized transaction hex here'}
          </p>
        </div>

          <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={handleBroadcastTransaction}
            disabled={isBroadcasting || (!finalizedPsbtHex.trim() && !manualFinalizedTxHex.trim()) || (!selectedBroadcastWalletId && !selectedPsbtWalletId && btcWalletsForSigning.length > 0)}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: isBroadcasting || (!finalizedPsbtHex.trim() && !manualFinalizedTxHex.trim()) || (!selectedBroadcastWalletId && !selectedPsbtWalletId && btcWalletsForSigning.length > 0) ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isBroadcasting || (!finalizedPsbtHex.trim() && !manualFinalizedTxHex.trim()) || (!selectedBroadcastWalletId && !selectedPsbtWalletId && btcWalletsForSigning.length > 0) ? 'not-allowed' : 'pointer',
              opacity: isBroadcasting || (!finalizedPsbtHex.trim() && !manualFinalizedTxHex.trim()) || (!selectedBroadcastWalletId && !selectedPsbtWalletId && btcWalletsForSigning.length > 0) ? 0.6 : 1,
            }}
          >
            {isBroadcasting ? 'Broadcasting...' : 'Broadcast Transaction'}
          </button>
        </div>

          {broadcastError && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#ffebee',
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #f44336',
              color: '#c62828'
            }}>
              <strong>Error:</strong> {broadcastError}
            </div>
          )}

          {broadcastTxId && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{
                padding: '1rem',
                backgroundColor: '#e8f5e9',
                borderRadius: '4px',
                marginBottom: '1rem',
                border: '1px solid #4caf50',
                color: '#2e7d32'
              }}>
                <strong>✓ Transaction Broadcast Successfully!</strong>
              </div>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Transaction ID:</h4>
              <pre
                style={{
                  padding: '1rem',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  border: '1px solid #ddd',
                  fontFamily: 'monospace',
                  maxHeight: '100px',
                }}
              >
                {broadcastTxId}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(broadcastTxId);
                  alert('Transaction ID copied to clipboard!');
                }}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Copy Transaction ID
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

