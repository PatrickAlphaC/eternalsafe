import { useEffect, useContext } from 'react'
import { useWalletConnectContext } from '@/components/common/WalletConnectProvider'
import { TxModalContext } from '@/components/tx-flow'
import { createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import SafeTxProvider from '@/components/tx-flow/SafeTxProvider'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import PageHeader from '@/components/common/PageHeader'
import { Box } from '@mui/material'

// Component that uses the SafeTxContext directly
const WalletConnectTxContent = () => {
  const { pendingRequest, approveRequest, rejectRequest } = useWalletConnectContext()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

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

  const handleSubmit = async (txId: string, isExecuted?: boolean) => {
    try {
      // The transaction was successfully submitted to the Safe
      // Now we need to approve the WalletConnect request
      await approveRequest(txId)
    } catch (err) {
      console.error('Failed to approve WalletConnect request:', err)
      setSafeTxError(err instanceof Error ? err : new Error('Failed to approve WalletConnect request'))
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
        </Box>
      </main>
    </>
  )
}

// Wrapper component that provides the SafeTxContext
const WalletConnectTxFlow = () => {
  return (
    <SafeTxProvider>
      <WalletConnectTxContent />
    </SafeTxProvider>
  )
}

// Main component that integrates with the TxModalContext
const WalletConnectTransactionHandler = () => {
  const { pendingRequest } = useWalletConnectContext()
  const { setTxFlow } = useContext(TxModalContext)

  // When a pending request is received, open the transaction flow
  useEffect(() => {
    if (!pendingRequest) return

    // Only handle eth_sendTransaction requests
    if (pendingRequest.params.request.method === 'eth_sendTransaction') {
      setTxFlow(<WalletConnectTxFlow />)
    }
  }, [pendingRequest, setTxFlow])

  return null
}

export default WalletConnectTransactionHandler
