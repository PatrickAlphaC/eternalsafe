import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Typography,
  Box,
  Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useRouter } from 'next/router'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectWalletConnectApiKey, setWalletConnectPairingCode } from '@/store/settingsSlice'
import { AppRoutes } from '@/config/routes'

type WalletConnectPairingModalProps = {
  open: boolean
  onClose: () => void
}

const WalletConnectPairingModal = ({ open, onClose }: WalletConnectPairingModalProps) => {
  const [pairingCode, setPairingCode] = useState('')
  const router = useRouter()
  const dispatch = useAppDispatch()
  const walletConnectApiKey = useAppSelector(selectWalletConnectApiKey)
  const isApiKeySet = walletConnectApiKey && walletConnectApiKey.trim() !== ''

  const handleSubmit = () => {
    if (pairingCode.trim() !== '') {
      // Store the pairing code in the settings
      dispatch(setWalletConnectPairingCode(pairingCode.trim()))
      // Here you would also handle the actual WalletConnect pairing
      // using the WalletConnect SDK
      onClose()
    }
  }

  const navigateToSettings = () => {
    onClose()
    router.push(AppRoutes.settings.environmentVariables)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        WalletConnect Pairing
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {isApiKeySet ? (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Enter your WalletConnect pairing code to connect to a wallet.
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              id="pairing-code"
              label="Pairing Code"
              type="text"
              fullWidth
              variant="outlined"
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value)}
            />
          </>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              You need to set a WalletConnect API key before you can use this feature.
            </Alert>
            <Typography variant="body1">
              Please go to Settings &gt; Environment Variables and enter your WalletConnect API key.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {isApiKeySet ? (
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Connect
          </Button>
        ) : (
          <Button onClick={navigateToSettings} variant="contained" color="primary">
            Go to Settings
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default WalletConnectPairingModal
