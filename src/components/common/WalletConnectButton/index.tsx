import { useState } from 'react'
import { IconButton, Tooltip, SvgIcon } from '@mui/material'
import WalletConnectIcon from '@/public/images/common/walletconnect.svg'
import WalletConnectPairingModal from '@/components/common/WalletConnectPairingModal'
import css from './styles.module.css'

const WalletConnectButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <Tooltip title="WalletConnect Pairing" arrow>
        <IconButton
          onClick={handleOpenModal}
          size="small"
          color="primary"
          className={css.walletConnectButton}
          aria-label="WalletConnect Pairing"
        >
          <SvgIcon component={WalletConnectIcon} inheritViewBox fontSize="small" />
        </IconButton>
      </Tooltip>
      <WalletConnectPairingModal open={isModalOpen} onClose={handleCloseModal} />
    </>
  )
}

export default WalletConnectButton
