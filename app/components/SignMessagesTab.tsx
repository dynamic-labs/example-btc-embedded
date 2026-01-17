'use client'

import { useState } from 'react';
import { useDynamicContext, useUserWallets } from "@dynamic-labs/sdk-react-core";
import { isBitcoinWallet } from '@dynamic-labs/bitcoin';
import { ChainEnum } from "@dynamic-labs/sdk-api-core";
import { Verifier } from 'bip322-js';

export const SignMessagesTab = () => {
  const [signMessage, setSignMessage] = useState<string>('example');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [signError, setSignError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const { user } = useDynamicContext();
  const userWallets = useUserWallets();

  const btcWalletsForSigning = userWallets.filter(
    (wallet) => wallet.chain === ChainEnum.Btc && isBitcoinWallet(wallet)
  );

  const handleSignMessage = async () => {
    if (!user) {
      setSignError('Please log in first');
      return;
    }

    if (!signMessage.trim()) {
      setSignError('Please enter a message to sign');
      return;
    }

    const selectedWallet = userWallets.find(w => w.id === selectedWalletId);
    if (!selectedWallet) {
      setSignError('Please select a wallet');
      return;
    }

    if (!isBitcoinWallet(selectedWallet)) {
      setSignError('Selected wallet is not a Bitcoin wallet');
      return;
    }

    try {
      setIsSigning(true);
      setSignError('');
      setSignature('');
      setVerificationResult(null);

      const result = await selectedWallet.signMessage(signMessage);
      setSignature(result || '');

      // Verify the signature using BIP-322
      if (result && selectedWallet.address) {
        setIsVerifying(true);
        try {
          const isValid = Verifier.verifySignature(
            selectedWallet.address,
            signMessage,
            result
          );
          setVerificationResult({
            valid: isValid,
            message: isValid 
              ? 'Signature is valid ✓' 
              : 'Signature verification failed ✗'
          });
        } catch (verifyError) {
          setVerificationResult({
            valid: false,
            message: `Verification error: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`
          });
        } finally {
          setIsVerifying(false);
        }
      }
    } catch (error) {
      setSignError(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      setSignature('');
      setVerificationResult(null);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="wallet-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Select Bitcoin Wallet:
        </label>
        <select
          id="wallet-select"
          value={selectedWalletId}
          onChange={(e) => setSelectedWalletId(e.target.value || '')}
          disabled={isSigning}
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
        <label htmlFor="message-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Message to Sign:
        </label>
        <textarea
          id="message-input"
          value={signMessage}
          onChange={(e) => setSignMessage(e.target.value)}
          disabled={isSigning}
          placeholder="Enter message to sign"
          style={{
            padding: '0.5rem',
            fontSize: '1rem',
            width: '100%',
            maxWidth: '400px',
            minHeight: '100px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontFamily: 'monospace',
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={handleSignMessage}
          disabled={isSigning || !selectedWalletId || !signMessage.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: isSigning || !selectedWalletId || !signMessage.trim() ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSigning || !selectedWalletId || !signMessage.trim() ? 'not-allowed' : 'pointer',
            opacity: isSigning || !selectedWalletId || !signMessage.trim() ? 0.6 : 1,
          }}
        >
          {isSigning ? 'Signing...' : 'Sign Message'}
        </button>
      </div>

      {signError && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#ffebee', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid #f44336',
          color: '#c62828'
        }}>
          <strong>Error:</strong> {signError}
        </div>
      )}

      {isVerifying && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fff3e0', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid #ff9800',
          color: '#e65100'
        }}>
          Verifying signature...
        </div>
      )}

      {verificationResult && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: verificationResult.valid ? '#e8f5e9' : '#ffebee', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: `1px solid ${verificationResult.valid ? '#4caf50' : '#f44336'}`,
          color: verificationResult.valid ? '#2e7d32' : '#c62828'
        }}>
          <strong>Verification:</strong> {verificationResult.message}
        </div>
      )}

      {signature && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Signature:</h3>
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
            {signature}
          </pre>
        </div>
      )}
    </div>
  );
};

