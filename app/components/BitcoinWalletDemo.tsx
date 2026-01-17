'use client'

import { useState, useEffect } from 'react';
import { useDynamicContext, DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { CreateWalletsTab } from './CreateWalletsTab';
import { SignMessagesTab } from './SignMessagesTab';
import { TransactionsTab } from './TransactionsTab';
import { ExportPrivateKeyTab } from './ExportPrivateKeyTab';
import { ImportPrivateKeyTab } from './ImportPrivateKeyTab';

export const BitcoinWalletDemo = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'sign' | 'transactions' | 'export' | 'import'>('create');
  const [mounted, setMounted] = useState(false);
  const { user } = useDynamicContext();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by only rendering user-dependent content after mount
  if (!mounted) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0 }}>Bitcoin Wallet Demo</h1>
          <DynamicWidget />
        </div>
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Bitcoin Wallet Demo</h1>
        <DynamicWidget />
      </div>

      {!user ? (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Please log in to view your Bitcoin wallets
          </p>
          <p style={{ color: '#666' }}>
            Wallets are created automatically when you sign up (if enabled in dashboard), or you can create one manually after logging in.
          </p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '1.5rem',
            borderBottom: '2px solid #ddd'
          }}>
            <button
              onClick={() => setActiveTab('create')}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: activeTab === 'create' ? '#0070f3' : 'transparent',
                color: activeTab === 'create' ? 'white' : '#666',
                border: 'none',
                borderBottom: activeTab === 'create' ? '2px solid #0070f3' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === 'create' ? '600' : '400',
              }}
            >
              Create Wallets
            </button>
            <button
              onClick={() => setActiveTab('sign')}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: activeTab === 'sign' ? '#0070f3' : 'transparent',
                color: activeTab === 'sign' ? 'white' : '#666',
                border: 'none',
                borderBottom: activeTab === 'sign' ? '2px solid #0070f3' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === 'sign' ? '600' : '400',
              }}
            >
              Sign Messages
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: activeTab === 'transactions' ? '#0070f3' : 'transparent',
                color: activeTab === 'transactions' ? 'white' : '#666',
                border: 'none',
                borderBottom: activeTab === 'transactions' ? '2px solid #0070f3' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === 'transactions' ? '600' : '400',
              }}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('export')}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: activeTab === 'export' ? '#0070f3' : 'transparent',
                color: activeTab === 'export' ? 'white' : '#666',
                border: 'none',
                borderBottom: activeTab === 'export' ? '2px solid #0070f3' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === 'export' ? '600' : '400',
              }}
            >
              Export Private Key
            </button>
            <button
              onClick={() => setActiveTab('import')}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: activeTab === 'import' ? '#0070f3' : 'transparent',
                color: activeTab === 'import' ? 'white' : '#666',
                border: 'none',
                borderBottom: activeTab === 'import' ? '2px solid #0070f3' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === 'import' ? '600' : '400',
              }}
            >
              Import Private Key
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'create' && <CreateWalletsTab />}
          {activeTab === 'sign' && <SignMessagesTab />}
          {activeTab === 'transactions' && <TransactionsTab />}
          {activeTab === 'export' && <ExportPrivateKeyTab />}
          {activeTab === 'import' && <ImportPrivateKeyTab />}
        </>
      )}
    </div>
  );
};

