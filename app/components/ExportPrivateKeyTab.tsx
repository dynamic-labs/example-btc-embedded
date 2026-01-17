'use client'

import { useState, useRef } from 'react';
import { useDynamicContext, useUserWallets } from "@dynamic-labs/sdk-react-core";
import { DynamicWaasBitcoinConnector } from '@dynamic-labs/bitcoin';

export const ExportPrivateKeyTab = () => {
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [hasExported, setHasExported] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { user } = useDynamicContext();
  const userWallets = useUserWallets();

  const handleExportPrivateKey = async () => {
    if (!user) {
      setErrorMessage("Please log in first");
      return;
    }

    if (!selectedWalletId) {
      setErrorMessage("Please select a wallet");
      return;
    }

    const selectedWallet = userWallets.find(w => w.id === selectedWalletId);
    if (!selectedWallet) {
      setErrorMessage("Selected wallet not found");
      return;
    }

    if (!selectedWallet.address) {
      setErrorMessage("Selected wallet has no address");
      return;
    }

    try {
      setIsExporting(true);
      setErrorMessage('');
      setHasExported(true);

      // Ensure container exists
      if (!containerRef.current) {
        setErrorMessage("Secure container is not ready");
        setIsExporting(false);
        setHasExported(false);
        return;
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      const connector = selectedWallet.connector as DynamicWaasBitcoinConnector;

      await connector.exportPrivateKey({
        accountAddress: selectedWallet.address,
        displayContainer: containerRef.current as HTMLIFrameElement
      });
    } catch (error) {
      setErrorMessage(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const selectedWallet = userWallets.find(w => w.id === selectedWalletId);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Export Private Key</h2>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
        Export your wallet's private key. This is a sensitive operation that requires authentication.
      </p>

      {userWallets.length === 0 && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fff3e0', 
          borderRadius: '4px', 
          marginBottom: '1.5rem',
          border: '1px solid #ff9800',
          color: '#e65100'
        }}>
          <strong>No wallets found:</strong> Please create a wallet first.
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="wallet-select-export" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Select Wallet:
        </label>
        <select
          id="wallet-select-export"
          value={selectedWalletId}
          onChange={(e) => setSelectedWalletId(e.target.value || '')}
          disabled={isExporting || userWallets.length === 0}
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
          {userWallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.address} ({wallet.chain})
            </option>
          ))}
        </select>
      </div>

      {selectedWallet && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={handleExportPrivateKey}
            disabled={isExporting || !selectedWalletId || !selectedWallet}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: isExporting || !selectedWalletId || !selectedWallet ? '#ccc' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isExporting || !selectedWalletId || !selectedWallet ? 'not-allowed' : 'pointer',
              opacity: isExporting || !selectedWalletId || !selectedWallet ? 0.6 : 1,
            }}
          >
            {isExporting ? 'Exporting...' : 'Export Private Key'}
          </button>
        </div>
      )}

      <div 
        ref={containerRef}
        style={{
          width: '100%',
          minHeight: hasExported ? '200px' : '0',
          maxHeight: hasExported ? '400px' : '0',
          border: hasExported ? '1px solid #ddd' : 'none',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9',
          overflow: 'auto',
          display: hasExported ? 'block' : 'none',
          marginBottom: hasExported ? '1.5rem' : '0',
        }}
      />

      {errorMessage && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#ffebee', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid #f44336',
          color: '#c62828'
        }}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#fff3e0', 
        borderRadius: '4px', 
        marginTop: '1.5rem',
        border: '1px solid #ff9800',
        color: '#e65100'
      }}>
        <strong>⚠️ Security Warning:</strong>
        <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
          <li>Never share your private key with anyone</li>
          <li>Store it in a secure location</li>
          <li>Anyone with access to your private key can control your wallet</li>
          <li>This operation may require authentication</li>
        </ul>
      </div>
    </div>
  );
};

