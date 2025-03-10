import { createContext, useContext, useState, type ReactElement, type ReactNode } from 'react'
import useWalletConnect, { type WalletConnectHook } from '@/hooks/wallets/useWalletConnect'
import WalletKit from '@reown/walletkit'

export const WalletConnectContext = createContext<WalletConnectHook | null>(null)

export const useWalletConnectContext = (): WalletConnectHook => {
  const context = useContext(WalletConnectContext)
  if (!context) {
    throw new Error('useWalletConnectContext must be used within a WalletConnectProvider')
  }
  return context
}

const WalletConnectProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [walletKitInstance, setWalletKitInstance] = useState<WalletKit | undefined>()

  const walletConnect = useWalletConnect(walletKitInstance, setWalletKitInstance)

  return <WalletConnectContext.Provider value={walletConnect}>{children}</WalletConnectContext.Provider>
}

export default WalletConnectProvider
