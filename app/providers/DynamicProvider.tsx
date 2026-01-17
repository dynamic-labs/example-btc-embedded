'use client'

import { DynamicContextProvider as DynamicSDKProvider } from '@dynamic-labs/sdk-react-core'
import { BitcoinWalletConnectors } from '@dynamic-labs/bitcoin'

export function DynamicContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DynamicSDKProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || '',
        apiBaseUrl: 'https://app.dynamic-preprod.xyz/api/v0',
        walletConnectors: [
          BitcoinWalletConnectors,
        ],
      }}
    >
      {children}
    </DynamicSDKProvider>
  )
}

