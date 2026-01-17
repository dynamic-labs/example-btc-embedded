'use client'

import { useState, useEffect } from 'react';
import { useDynamicWaas, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { ChainEnum } from "@dynamic-labs/sdk-api-core";
import { isBitcoinWallet } from '@dynamic-labs/bitcoin';

export const CreateWalletsTab = () => {
  const [selectedAddressType, setSelectedAddressType] = useState<string>('native_segwit');
  const [isCreating, setIsCreating] = useState(false);
  const [walletStatus, setWalletStatus] = useState<string>('Checking...');
  const { createWalletAccount, getWaasWallets } = useDynamicWaas();
  const { user } = useDynamicContext();

  useEffect(() => {
    if (!user) {
      setWalletStatus('Please log in');
      return;
    }

    const waasWallets = getWaasWallets();
    const hasBtcWallet = waasWallets.some(
      (wallet) => wallet.chain === ChainEnum.Btc
    );

    if (hasBtcWallet) {
      setWalletStatus('Bitcoin wallet exists');
    } else {
      setWalletStatus('No Bitcoin wallet found. Create one manually below.');
    }
  }, [user, getWaasWallets]);

  const handleCreateWallet = async () => {
    if (!user) {
      setWalletStatus('Please log in first');
      return;
    }

    try {
      setIsCreating(true);
      setWalletStatus('Creating Bitcoin wallet...');
      
      await createWalletAccount([
        {
          chain: ChainEnum.Btc,
          bitcoinConfig: {
            addressType: selectedAddressType
          },
        },
      ]);

      setWalletStatus('Bitcoin wallet created successfully!');
      
      setTimeout(() => {
        const waasWallets = getWaasWallets();
        const hasBtcWallet = waasWallets.some(
          (wallet) => wallet.chain === ChainEnum.Btc
        );
        if (hasBtcWallet) {
          setWalletStatus('Bitcoin wallet exists');
        }
      }, 500);
    } catch (error) {
      setWalletStatus(`Error: ${error instanceof Error ? error.message : 'Failed to create wallet'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const btcWallets = getWaasWallets().filter(
    (wallet) => wallet.chain === ChainEnum.Btc && isBitcoinWallet(wallet)
  );

  return (
    <>
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#e8f5e9', 
        borderRadius: '4px', 
        marginBottom: '1.5rem',
        border: '1px solid #4caf50'
      }}>
        <strong>Status:</strong> {walletStatus}
        {getWaasWallets().length > 0 && (
          <span style={{ marginLeft: '1rem', color: '#2e7d32' }}>
            ✓ User has embedded wallet
          </span>
        )}
      </div>

      {btcWallets.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Your Bitcoin Wallets</h2>
          <div style={{ 
            overflowX: 'auto',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white',
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#f5f5f5',
                  borderBottom: '2px solid #ddd',
                }}>
                  <th style={{ 
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    borderBottom: '1px solid #ddd',
                  }}>Address</th>
                  <th style={{ 
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    borderBottom: '1px solid #ddd',
                  }}>Type</th>
                  <th style={{ 
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    borderBottom: '1px solid #ddd',
                  }}>Network</th>
                </tr>
              </thead>
              <tbody>
                {btcWallets.map((wallet, index) => {
                  const walletType = (wallet as any).wallet?.additionalAddresses?.[0]?.type || 
                                    (wallet as any).additionalAddresses?.[0]?.type ||
                                    'Unknown';
                  
                  // Map type to display name
                  const displayType = walletType === 'payment' 
                    ? 'Native SegWit' 
                    : walletType === 'ordinals' 
                    ? 'Taproot' 
                    : walletType;
                  
                  const network = (wallet as any).network || 'mainnet';
                  
                  return (
                    <tr 
                      key={wallet.id || index}
                      style={{ 
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <td style={{ 
                        padding: '0.75rem',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      }}>
                        {wallet.address || 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {displayType}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {network}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="address-type-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Bitcoin Address Type:
        </label>
        <select
          id="address-type-select"
          value={selectedAddressType}
          onChange={(e) => setSelectedAddressType(e.target.value)}
          disabled={isCreating}
          style={{
            padding: '0.5rem',
            fontSize: '1rem',
            width: '100%',
            maxWidth: '300px',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        >
          <option value="native_segwit">Native SegWit (Bech32)</option>
          <option value="taproot">Taproot</option>
        </select>
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
          Select the address type for manually creating a new Bitcoin wallet.
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={handleCreateWallet}
          disabled={isCreating}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: isCreating ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isCreating ? 'not-allowed' : 'pointer',
            opacity: isCreating ? 0.6 : 1,
          }}
        >
          {isCreating ? 'Creating...' : 'Create Wallet Manually'}
        </button>
      </div>
    </>
  );
};

