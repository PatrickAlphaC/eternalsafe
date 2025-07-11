import React, { useEffect, useContext, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Button } from '@mui/material'
import { useWalletConnectContext } from '@/components/common/WalletConnectProvider'
import { createTx } from '@/services/tx/tx-sender'
import SafeTxProvider, { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import PageHeader from '@/components/common/PageHeader'
import { AppRoutes } from '@/config/routes'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { extractTxDetails } from '@/services/tx/extractTxInfo'
import useSafeInfo from '@/hooks/useSafeInfo'

const WalletConnectTxContent = () => {
  const router = useRouter()
  const { pendingRequest, approveRequest, rejectRequest } = useWalletConnectContext()
  const { setSafeTx, setSafeTxError, safeTx } = useContext(SafeTxContext)
  const [txDetails, setTxDetails] = useState<TransactionDetails | undefined>(undefined)
  const { safe, safeAddress } = useSafeInfo()

  useEffect(() => {
    if (!pendingRequest || pendingRequest.params.request.method !== 'eth_sendTransaction') {
      router.push({
        pathname: AppRoutes.balances.index,
        query: router.query,
      })
    }
  }, [pendingRequest, router])

  useEffect(() => {
    if (!pendingRequest || pendingRequest.params.request.method !== 'eth_sendTransaction') {
      return
    }

    const txParams = pendingRequest.params.request.params[0]
    if (!txParams) {
      setSafeTxError(new Error('Failed to create transaction from WalletConnect request'))
      return
    }

    // TODO(eternalsafe): for some reason not all transaction details are being shown, e.g. 'value' and 'to'
    createTx({
      to: txParams.to,
      value: txParams.value || '0',
      data: txParams.data || '0x',
      operation: 0, // Call
    })
      .then(setSafeTx)
      .catch(setSafeTxError)
  }, [pendingRequest, setSafeTx, setSafeTxError])

  useEffect(() => {
    if (safeTx) {
      extractTxDetails(safeAddress, safeTx, safe).then(setTxDetails)
    }
  }, [safeAddress, safeTx, safe])

  const redirectToOriginalPage = () => {
    router.push({
      pathname: AppRoutes.balances.index,
      query: router.query,
    })
  }

  const handleSubmit = async (txId: string, isExecuted?: boolean) => {
    try {
      await approveRequest(txId)
      redirectToOriginalPage()
    } catch (err) {
      console.error('Failed to approve WalletConnect request:', err)
      setSafeTxError(err instanceof Error ? err : new Error('Failed to approve WalletConnect request'))
    }
  }

  const handleReject = async () => {
    try {
      await rejectRequest('User rejected the transaction')
      redirectToOriginalPage()
    } catch (err) {
      console.error('Failed to reject WalletConnect request:', err)
    }
  }

  if (!pendingRequest || pendingRequest.params.request.method !== 'eth_sendTransaction') {
    return null
  }

  return (
    <>
      <PageHeader
        title="WalletConnect Transaction Request"
        action={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                color: 'text.secondary',
                fontSize: '14px',
              }}
            >
              A dApp is requesting to submit a transaction through WalletConnect
            </Box>
          </Box>
        }
      />

      <main>
        <Box sx={{ p: 3 }}>
          <SignOrExecuteForm onSubmit={handleSubmit} isCreation txDetails={txDetails} />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button variant="contained" color="error" onClick={handleReject} sx={{ minWidth: '200px' }}>
              Reject Transaction
            </Button>
          </Box>
        </Box>
      </main>
    </>
  )
}

const WalletConnectTransactionPage = () => {
  return (
    <SafeTxProvider>
      <WalletConnectTxContent />
    </SafeTxProvider>
  )
}

export default WalletConnectTransactionPage
