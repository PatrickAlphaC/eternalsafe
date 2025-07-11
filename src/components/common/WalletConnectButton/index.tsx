import { useState, useRef } from 'react'
import { IconButton, Tooltip, SvgIcon, Badge } from '@mui/material'
import WalletConnectIcon from '@/public/images/common/walletconnect.svg'
import WalletConnectPairingModal from '@/components/common/WalletConnectPairingModal'
import { useWalletConnectContext } from '@/components/common/WalletConnectProvider'
import css from './styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'

const WalletConnectButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { sessions, pendingProposal, pendingRequest } = useWalletConnectContext()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { safeAddress } = useSafeInfo()

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const hasPendingProposals = !!pendingProposal
  const hasPendingRequests = !!pendingRequest
  const hasActiveSessions = sessions.length > 0
  const showBadge = hasPendingProposals || hasPendingRequests || hasActiveSessions

  return (
    <>
      <Tooltip
        title={
          hasPendingRequests
            ? 'WalletConnect: Pending transaction request'
            : hasPendingProposals
            ? 'WalletConnect: Pending connection proposal'
            : hasActiveSessions
            ? `WalletConnect: ${sessions.length} active connection${sessions.length > 1 ? 's' : ''}`
            : !!safeAddress
            ? 'WalletConnect Pairing'
            : 'Load a Safe first'
        }
        arrow
      >
        <IconButton
          ref={buttonRef}
          onClick={handleOpenModal}
          size="small"
          disabled={!safeAddress}
          color="primary"
          className={css.walletConnectButton}
          aria-label="WalletConnect Pairing"
        >
          <Badge
            color={hasPendingRequests || hasPendingProposals ? 'error' : 'primary'}
            variant="dot"
            invisible={!showBadge}
          >
            <SvgIcon component={WalletConnectIcon} inheritViewBox fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>
      <WalletConnectPairingModal open={isModalOpen} onClose={handleCloseModal} anchorEl={buttonRef.current} />
    </>
  )
}

export default WalletConnectButton
