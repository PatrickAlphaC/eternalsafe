import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useWalletConnectContext } from '@/components/common/WalletConnectProvider'
import { AppRoutes } from '@/config/routes'
import useSafeInfo from '@/hooks/useSafeInfo'

const WalletConnectTransactionHandler = () => {
  const { pendingRequest } = useWalletConnectContext()
  const router = useRouter()
  const { safeAddress } = useSafeInfo()
  const redirectedRequestIds = useRef(new Set<number>())

  useEffect(() => {
    if (!pendingRequest) return

    if (router.pathname === AppRoutes.walletConnect.transaction) return

    console.log('pendingRequest', pendingRequest)
    console.log(redirectedRequestIds)

    if (redirectedRequestIds.current.has(pendingRequest.id)) return

    if (
      pendingRequest.params.request.method === 'eth_sendTransaction' &&
      safeAddress != undefined &&
      safeAddress != ''
    ) {
      redirectedRequestIds.current.add(pendingRequest.id)
      const query = router.query
      router.push({
        pathname: AppRoutes.walletConnect.transaction,
        query,
      })
    }
  }, [pendingRequest, router, router.pathname, safeAddress])

  return null
}

export default WalletConnectTransactionHandler
