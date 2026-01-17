'use client'

import { useState } from 'react';
import { useDynamicWaas, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { ChainEnum } from "@dynamic-labs/sdk-api-core";

export const ImportPrivateKeyTab = () => {
  const [selectedChain, setSelectedChain] = useState<ChainEnum>(ChainEnum.Btc);
  const [selectedAddressType, setSelectedAddressType] = useState<string>('native_segwit');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const { importPrivateKey } = useDynamicWaas();
  const { user } = useDynamicContext();

  const handleImportPrivateKey = async () => {
    if (!user) {
      setErrorMessage("Please log in first");
      return;
    }

    if (!privateKey.trim()) {
      setErrorMessage("Please enter a private key");
      return;
    }

    if (!selectedAddressType) {
      setErrorMessage("Please select an address type");
      return;
    }

    try {
      setIsImporting(true);
      setErrorMessage('');
      setSuccessMessage('');

      await importPrivateKey({
        addressType: selectedAddressType,
        chainName: selectedChain,
        privateKey: privateKey.trim(),
      });

      setSuccessMessage('Private key imported successfully!');
      setPrivateKey('');
    } catch (error) {
      setErrorMessage(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Import Private Key</h2>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
        Import an existing private key to create a wallet. This will add the wallet to your account.
      </p>

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="address-type-select-import" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Bitcoin Address Type:
        </label>
        <select
          id="address-type-select-import"
          value={selectedAddressType}
          onChange={(e) => setSelectedAddressType(e.target.value)}
          disabled={isImporting}
          style={{
            padding: '0.5rem',
            fontSize: '1rem',
            width: '100%',
            maxWidth: '300px',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        >
          <option value="native_segwit">Native SegWit</option>
          <option value="taproot">Taproot</option>
        </select>
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
          Select the address type for the Bitcoin wallet you're importing.
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="private-key-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Private Key:
        </label>
        <textarea
          id="private-key-input"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          disabled={isImporting}
          placeholder="Enter your private key"
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
          Enter the private key you want to import. Make sure you're in a secure environment.
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={handleImportPrivateKey}
          disabled={isImporting || !privateKey.trim() || !selectedAddressType}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: isImporting || !privateKey.trim() || !selectedAddressType ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isImporting || !privateKey.trim() || !selectedAddressType ? 'not-allowed' : 'pointer',
            opacity: isImporting || !privateKey.trim() || !selectedAddressType ? 0.6 : 1,
          }}
        >
          {isImporting ? 'Importing...' : 'Import Private Key'}
        </button>
      </div>

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

      {successMessage && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#e8f5e9', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          border: '1px solid #4caf50',
          color: '#2e7d32'
        }}>
          <strong>Success:</strong> {successMessage}
        </div>
      )}
    </div>
  );
};

