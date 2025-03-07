import { createContext, useContext, type ReactElement, type ReactNode } from 'react'
import useWalletConnect, { type WalletConnectHook } from '@/hooks/wallets/useWalletConnect'

// Create a context for WalletConnect
export const WalletConnectContext = createContext<WalletConnectHook | null>(null)

// Custom hook to use the WalletConnect context
export const useWalletConnectContext = (): WalletConnectHook => {
  const context = useContext(WalletConnectContext)
  if (!context) {
    throw new Error('useWalletConnectContext must be used within a WalletConnectProvider')
  }
  return context
}

// Provider component
const WalletConnectProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const walletConnect = useWalletConnect()

  return <WalletConnectContext.Provider value={walletConnect}>{children}</WalletConnectContext.Provider>
}

export default WalletConnectProvider
