import React, { useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import { Box, Button } from '@mui/material'
import { useWalletConnectContext } from '@/components/common/WalletConnectProvider'
import { createTx } from '@/services/tx/tx-sender'
import SafeTxProvider, { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import PageHeader from '@/components/common/PageHeader'
import { AppRoutes } from '@/config/routes'

// Component that uses the SafeTxContext directly
const WalletConnectTxContent = () => {
  const router = useRouter()
  const { pendingRequest, approveRequest, rejectRequest } = useWalletConnectContext()
  const { setSafeTx, setSafeTxError, safeTx, safeTxError } = useContext(SafeTxContext)

  // No debug logs to avoid potential issues

  // Redirect to home if there's no pending request
  useEffect(() => {
    if (!pendingRequest || pendingRequest.params.request.method !== 'eth_sendTransaction') {
      // Redirect to home page with the same query parameters
      router.push({
        pathname: AppRoutes.index,
        query: router.query,
      })
    }
  }, [pendingRequest, router])

  // Create a SafeTransaction from the WalletConnect request and set it in the context
  useEffect(() => {
    const createSafeTx = async () => {
      if (!pendingRequest || pendingRequest.params.request.method !== 'eth_sendTransaction') {
        return
      }

      try {
        const txParams = pendingRequest.params.request.params[0]
        if (!txParams) {
          throw new Error('No transaction parameters provided')
        }

        // Create a SafeTransaction from the transaction parameters
        const tx = await createTx({
          to: txParams.to,
          value: txParams.value || '0',
          data: txParams.data || '0x',
          operation: 0, // Call
        })

        // Set the transaction in the SafeTxContext
        setSafeTx(tx)
      } catch (err) {
        console.error('Failed to create SafeTransaction:', err)
        setSafeTxError(err instanceof Error ? err : new Error('Failed to create transaction'))
      }
    }

    createSafeTx()
  }, [pendingRequest, setSafeTx, setSafeTxError])

  // Helper function to redirect back to the original page with query params
  const redirectToOriginalPage = () => {
    router.push({
      pathname: AppRoutes.index,
      query: router.query,
    })
  }

  const handleSubmit = async (txId: string, isExecuted?: boolean) => {
    try {
      // The transaction was successfully submitted to the Safe
      // Now we need to approve the WalletConnect request
      await approveRequest(txId)
      // Redirect to home after successful submission, preserving query params
      redirectToOriginalPage()
    } catch (err) {
      console.error('Failed to approve WalletConnect request:', err)
      setSafeTxError(err instanceof Error ? err : new Error('Failed to approve WalletConnect request'))
    }
  }

  const handleReject = async () => {
    try {
      await rejectRequest('User rejected the transaction')
      // Redirect to home after rejection, preserving query params
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
          <SignOrExecuteForm onSubmit={handleSubmit} isCreation />
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

// Wrapper component that provides the SafeTxContext
const WalletConnectTransactionPage = () => {
  const router = useRouter()
  // Remove all debug logs and URL manipulation that was causing infinite loops
  // The sidebar visibility will be handled differently

  return (
    <SafeTxProvider>
      <WalletConnectTxContent />
    </SafeTxProvider>
  )
}

// Make sure this page is not in the NO_SIDEBAR_ROUTES list in useIsSidebarRoute.ts
// The sidebar will be shown as long as there's a "safe" query parameter

export default WalletConnectTransactionPage
