import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useWalletConnectContext } from '@/components/common/WalletConnectProvider'
import { AppRoutes } from '@/config/routes'

// Main component that redirects to the WalletConnect transaction page
const WalletConnectTransactionHandler = () => {
  const { pendingRequest } = useWalletConnectContext()
  const router = useRouter()

  // When a pending request is received, redirect to the transaction page
  useEffect(() => {
    if (!pendingRequest) return

    // Only handle eth_sendTransaction requests
    if (pendingRequest.params.request.method === 'eth_sendTransaction') {
      // Redirect to the WalletConnect transaction page while preserving query parameters
      // Use Next.js router.query to ensure we get all query parameters, including the 'safe' parameter
      const query = router.query
      // Redirect to the WalletConnect transaction page with the same query parameters
      router.push({
        pathname: AppRoutes.walletConnect.transaction,
        query,
      })
    }
  }, [pendingRequest, router])

  return null
}

export default WalletConnectTransactionHandler
