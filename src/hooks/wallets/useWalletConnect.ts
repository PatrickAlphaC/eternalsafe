import { useEffect, useState, useCallback, useRef, type Dispatch, type SetStateAction } from 'react'
import { Core } from '@walletconnect/core'
import { WalletKit } from '@reown/walletkit'
import type { SessionTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { useAppSelector } from '@/store'
import { selectWalletConnectApiKey, selectWalletConnectPairingCode } from '@/store/settingsSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '../useChainId'
import type { WalletKit as WalletKitType } from '@reown/walletkit/dist/types/client'

export type SessionProposal = {
  id: number
  params: {
    id: number
    pairingTopic: string
    proposer: {
      publicKey: string
      metadata: {
        name: string
        description: string
        url: string
        icons: string[]
      }
    }
    requiredNamespaces: Record<
      string,
      {
        chains?: string[]
        methods: string[]
        events: string[]
      }
    >
    optionalNamespaces?: Record<
      string,
      {
        chains?: string[]
        methods: string[]
        events: string[]
      }
    >
  }
}

export type SessionRequest = {
  id: number
  topic: string
  params: {
    request: {
      method: string
      params: any
    }
    chainId: string
  }
}
export type SessionEvent = {
  topic: string
  event: {
    name: string
    data: any
  }
  chainId: string
}

export type WalletConnectHook = {
  isInitialized: boolean
  isInitializing: boolean
  sessions: SessionTypes.Struct[]
  pendingProposal: SessionProposal | null
  pendingRequest: SessionRequest | null
  error: Error | null
  pair: (uri: string) => Promise<void>
  approveSession: (id: number, namespaces: Record<string, any>) => Promise<SessionTypes.Struct>
  rejectSession: (id: number) => Promise<void>
  approveRequest: (result: any) => Promise<void>
  rejectRequest: (reason?: string) => Promise<void>
  disconnectSession: (topic: string) => Promise<void>
  updateSession: (topic: string, namespaces: Record<string, any>) => Promise<void>
}

const useWalletConnect = (
  walletKitInstance: WalletKitType | undefined,
  setWalletKitInstance: Dispatch<SetStateAction<WalletKitType | undefined>>,
): WalletConnectHook => {
  const projectId = useAppSelector(selectWalletConnectApiKey)
  const pairingCode = useAppSelector(selectWalletConnectPairingCode)
  // TODO(eternalsafe): When the safeAddress and chainId change, we need to update the approved namespaces in the session, or maybe easier to just start a new session
  const { safeAddress } = useSafeInfo()
  const chainId = useChainId()

  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [sessions, setSessions] = useState<SessionTypes.Struct[]>([])
  const [pendingProposal, setPendingProposal] = useState<SessionProposal | null>(null)
  const [pendingRequest, setPendingRequest] = useState<SessionRequest | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const pendingProposalRef = useRef<SessionProposal | null>(null)
  const pendingRequestRef = useRef<SessionRequest | null>(null)

  useEffect(() => {
    pendingProposalRef.current = pendingProposal
    pendingRequestRef.current = pendingRequest
  }, [pendingProposal, pendingRequest])

  // Set up event listeners for WalletKit
  const setupEventListeners = useCallback((walletKit: any) => {
    // Session proposal event
    walletKit.on('session_proposal', (proposal: SessionProposal) => {
      console.log('Received session proposal:', proposal)
      setPendingProposal(proposal)
    })

    // Session request event
    walletKit.on('session_request', (request: SessionRequest) => {
      console.log('Received session request:', request)
      setPendingRequest(request)
    })

    // Session delete event
    walletKit.on('session_delete', ({ topic }: { topic: string }) => {
      console.log('Session deleted:', topic)
      setSessions((prev) => prev.filter((session) => session.topic !== topic))
    })

    // Session update event
    walletKit.on(
      'session_update',
      ({ topic, params }: { topic: string; params: { namespaces: Record<string, any> } }) => {
        console.log('Session updated:', topic, params)
        setSessions((prev) => {
          const updatedSessions = [...prev]
          const sessionIndex = updatedSessions.findIndex((session) => session.topic === topic)
          if (sessionIndex !== -1) {
            updatedSessions[sessionIndex] = {
              ...updatedSessions[sessionIndex],
              namespaces: params.namespaces,
            }
          }
          return updatedSessions
        })
      },
    )

    // Session event
    walletKit.on('session_event', ({ topic, params }: { topic: string; params: any }) => {
      console.log('Session event:', topic, params)
    })
  }, [])

  useEffect(() => {
    const initWalletKit = async () => {
      if (!projectId || isInitialized || isInitializing) {
        return
      }

      try {
        console.log('Initializing WalletKit with project ID:', projectId)
        setIsInitializing(true)
        setError(null)

        const core = new Core({
          projectId,
        })

        let walletKitInstance: WalletKitType | undefined

        try {
          console.log('Creating WalletKit instance...')

          walletKitInstance = await WalletKit.init({
            core,
            metadata: {
              name: 'Eternal Safe Wallet',
              description: 'Eternal Safe Wallet for Web3',
              url: window.location.origin,
              icons: [`${window.location.origin}/favicon.ico`],
            },
          })

          console.log('WalletKit instance created successfully')
        } catch (initError) {
          console.error('Error creating WalletKit instance:', initError)
          throw initError
        }

        // Set up event listeners
        try {
          console.log('Setting up event listeners...')
          setupEventListeners(walletKitInstance)
          console.log('Event listeners set up successfully')
        } catch (listenerError) {
          console.error('Error setting up event listeners:', listenerError)
          // Continue even if event listeners fail
        }

        // Get active sessions
        try {
          console.log('Getting active sessions...')
          const activeSessions = walletKitInstance.getActiveSessions()
          setSessions(Object.values(activeSessions))
          console.log('Active sessions retrieved successfully')
        } catch (sessionsError) {
          console.error('Error getting active sessions:', sessionsError)
          // Continue even if getting sessions fails
        }

        // Try to pair with existing code if available
        if (pairingCode) {
          try {
            console.log('Pairing with existing code...')
            await walletKitInstance.pair({ uri: pairingCode })
            console.log('Paired successfully with existing code')
          } catch (pairError) {
            console.warn('Failed to pair with saved code:', pairError)
            // Continue even if pairing fails
          }
        }

        setIsInitialized(true)
        setWalletKitInstance(walletKitInstance)
        console.log('WalletKit initialized successfully')
      } catch (e) {
        console.error('Failed to initialize WalletKit:', e)
        setError(e instanceof Error ? e : new Error('Failed to initialize WalletKit'))
      } finally {
        setIsInitializing(false)
      }
    }

    initWalletKit()
  }, [projectId, isInitialized, isInitializing, pairingCode, setupEventListeners, setWalletKitInstance])

  // Pair with a dApp
  const pair = useCallback(
    async (uri: string) => {
      if (!walletKitInstance || !isInitialized) {
        throw new Error('WalletKit not initialized')
      }

      try {
        await walletKitInstance.pair({ uri })
      } catch (e) {
        console.error('Failed to pair:', e)
        setError(e instanceof Error ? e : new Error('Failed to pair'))
        throw e
      }
    },
    [isInitialized, walletKitInstance],
  )

  // Approve a session proposal
  const approveSession = useCallback(
    async (id: number, namespaces: Record<string, any>) => {
      if (!walletKitInstance || !isInitialized) {
        throw new Error('WalletKit not initialized')
      }

      if (!pendingProposalRef.current) {
        throw new Error('No pending session proposal')
      }

      try {
        // If no namespaces are provided, build them using the utility
        let approvedNamespaces = namespaces

        if (Object.keys(namespaces).length === 0) {
          // Create a custom namespaces object directly
          approvedNamespaces = {
            eip155: {
              chains: [`eip155:${chainId}`],
              methods: ['eth_sendTransaction'],
              events: ['accountsChanged', 'chainChanged'],
              accounts: [`eip155:${chainId}:${safeAddress}`],
            },
          }
        }

        // Approve the session with the built namespaces
        const session = await walletKitInstance.approveSession({
          id,
          namespaces: approvedNamespaces,
        })

        setSessions((prev) => [...prev, session])
        setPendingProposal(null)

        return session
      } catch (error) {
        console.error('Failed to approve session:', error)
        setError(error instanceof Error ? error : new Error('Failed to approve session'))

        // Reject the session on error
        await walletKitInstance.rejectSession({
          id,
          reason: getSdkError('USER_REJECTED'),
        })

        setPendingProposal(null)

        throw error
      }
    },
    [walletKitInstance, isInitialized, chainId, safeAddress],
  )

  // Reject a session proposal
  const rejectSession = useCallback(
    async (id: number) => {
      if (!walletKitInstance || !isInitialized) {
        throw new Error('WalletKit not initialized')
      }

      if (!pendingProposalRef.current) {
        throw new Error('No pending session proposal')
      }

      try {
        await walletKitInstance.rejectSession({
          id,
          reason: getSdkError('USER_REJECTED'),
        })

        setPendingProposal(null)
      } catch (e) {
        console.error('Failed to reject session:', e)
        setError(e instanceof Error ? e : new Error('Failed to reject session'))

        setPendingProposal(null)

        throw e
      }
    },
    [isInitialized, walletKitInstance],
  )

  // Approve a session request
  const approveRequest = useCallback(
    async (result: any) => {
      if (!walletKitInstance || !isInitialized) {
        throw new Error('WalletKit not initialized')
      }

      if (!pendingRequestRef.current) {
        throw new Error('No pending session request')
      }

      try {
        const { topic, id } = pendingRequestRef.current

        await walletKitInstance.respondSessionRequest({
          topic,
          response: {
            id,
            jsonrpc: '2.0',
            result,
          },
        })

        setPendingRequest(null)
      } catch (e) {
        console.error('Failed to approve request:', e)
        setError(e instanceof Error ? e : new Error('Failed to approve request'))
        throw e
      }
    },
    [isInitialized, walletKitInstance],
  )

  // Reject a session request
  const rejectRequest = useCallback(
    async (reason = 'User rejected request') => {
      if (!walletKitInstance || !isInitialized) {
        throw new Error('WalletKit not initialized')
      }

      if (!pendingRequestRef.current) {
        throw new Error('No pending session request')
      }

      try {
        const { topic, id } = pendingRequestRef.current

        await walletKitInstance.respondSessionRequest({
          topic,
          response: {
            id,
            jsonrpc: '2.0',
            error: {
              code: 4001,
              message: reason,
            },
          },
        })

        setPendingRequest(null)
      } catch (e) {
        console.error('Failed to reject request:', e)
        setError(e instanceof Error ? e : new Error('Failed to reject request'))
        throw e
      }
    },
    [isInitialized, walletKitInstance],
  )

  // Disconnect a session
  const disconnectSession = useCallback(
    async (topic: string) => {
      if (!walletKitInstance || !isInitialized) {
        throw new Error('WalletKit not initialized')
      }

      try {
        await walletKitInstance.disconnectSession({
          topic,
          reason: getSdkError('USER_DISCONNECTED'),
        })

        setSessions((prev) => prev.filter((session) => session.topic !== topic))
      } catch (e) {
        console.error('Failed to disconnect session:', e)
        setError(e instanceof Error ? e : new Error('Failed to disconnect session'))
        throw e
      }
    },
    [isInitialized, walletKitInstance],
  )

  // Update a session
  const updateSession = useCallback(
    async (topic: string, namespaces: Record<string, any>) => {
      if (!walletKitInstance || !isInitialized) {
        throw new Error('WalletKit not initialized')
      }

      try {
        await walletKitInstance.updateSession({
          topic,
          namespaces,
        })

        setSessions((prev) => {
          const updatedSessions = [...prev]
          const sessionIndex = updatedSessions.findIndex((session) => session.topic === topic)
          if (sessionIndex !== -1) {
            updatedSessions[sessionIndex] = {
              ...updatedSessions[sessionIndex],
              namespaces,
            }
          }
          return updatedSessions
        })
      } catch (e) {
        console.error('Failed to update session:', e)
        setError(e instanceof Error ? e : new Error('Failed to update session'))
        throw e
      }
    },
    [isInitialized, walletKitInstance],
  )

  return {
    isInitialized,
    isInitializing,
    sessions,
    pendingProposal,
    pendingRequest,
    error,
    pair,
    approveSession,
    rejectSession,
    approveRequest,
    rejectRequest,
    disconnectSession,
    updateSession,
  }
}

export default useWalletConnect
