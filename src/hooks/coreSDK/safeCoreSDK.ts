import { getMultiWeb3ReadOnly } from '@/hooks/wallets/web3'
import { _SAFE_DEPLOYMENTS } from '@safe-global/safe-deployments/dist/deployments'
import ExternalStore from '@/services/ExternalStore'
import { Gnosis_safe__factory } from '@/types/contracts'
import { invariant } from '@/utils/helpers'
import type { Web3Provider } from '@ethersproject/providers'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import semverSatisfies from 'semver/functions/satisfies'

export const isLegacyVersion = (safeVersion: string): boolean => {
  const LEGACY_VERSION = '<1.3.0'
  return semverSatisfies(safeVersion, LEGACY_VERSION)
}

export type ModernSafeVersion = '1.1.1' | '1.2.0' | '1.3.0' | '1.4.1'

export const isValidSafeVersion = (safeVersion?: SafeInfo['version']): safeVersion is ModernSafeVersion => {
  const SAFE_VERSIONS: ModernSafeVersion[] = ['1.4.1', '1.3.0', '1.2.0', '1.1.1']
  return !!safeVersion && SAFE_VERSIONS.some((version) => semverSatisfies(safeVersion, version))
}

// `assert` does not work with arrow functions
export function assertValidSafeVersion<T extends SafeInfo['version']>(safeVersion?: T): asserts safeVersion {
  return invariant(isValidSafeVersion(safeVersion), `${safeVersion} is not a valid Safe Account version`)
}

export const createEthersAdapter = (provider: Web3Provider) => {
  const signer = provider.getSigner(0)
  return new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  })
}

export const createReadOnlyEthersAdapter = (provider: Provider | undefined = getMultiWeb3ReadOnly()) => {
  if (!provider) {
    throw new Error('Unable to create `EthersAdapter` without a provider')
  }

  return new EthersAdapter({
    ethers,
    signerOrProvider: provider,
  })
}

type SafeCoreSDKProps = {
  provider: Provider
  chainId: SafeInfo['chainId']
  address: SafeInfo['address']['value']
  implementation: SafeInfo['implementation']['value']
  multisendAddress?: string
  multisendCallOnlyAddress?: string
}

// Safe Core SDK
export const initSafeSDK = async ({
  provider,
  address,
  implementation,
  multisendAddress,
  multisendCallOnlyAddress
}: SafeCoreSDKProps): Promise<Safe> => {
  const safeVersion = await Gnosis_safe__factory.connect(address, provider).VERSION()

  // find out if the implementation is any of the possible L1Safe singletons
  let isL1SafeMasterCopy = _SAFE_DEPLOYMENTS.some((safeDeployments) =>
    (Object.values(safeDeployments.deployments) ?? []).some((deployment) => deployment.address === implementation),
  )

  // Legacy Safe contracts
  if (isLegacyVersion(safeVersion)) {
    isL1SafeMasterCopy = true
  }

  // Create an adapter
  const ethAdapter = createReadOnlyEthersAdapter(provider)

  try {
    // Check if we need to provide custom contract addresses
    if (multisendAddress || multisendCallOnlyAddress) {
      // Get the chain ID
      const network = await provider.getNetwork()
      const chainId = network.chainId.toString() // Convert to string as required by the SDK

      // Get the default deployments for this chain to keep other addresses
      let defaultContracts: any = {}

      // Look through all deployed contracts to find matching deployments for this chain
      const chainDeployments = _SAFE_DEPLOYMENTS.find(deployment =>
        Object.keys(deployment.deployments).includes(chainId)
      )

      if (chainDeployments) {
        const deployment = chainDeployments.deployments[chainId]
        if (deployment) {
          // Get the latest version's deployment
          defaultContracts = {
            safeMasterCopyAddress: deployment.masterCopy?.address || implementation,
            safeProxyFactoryAddress: deployment.proxyFactory?.address || '',
            multiSendAddress: deployment.multiSend?.address || '',
            multiSendCallOnlyAddress: deployment.multiSendCallOnly?.address || '',
            fallbackHandlerAddress: deployment.fallbackHandler?.address || '',
            signMessageLibAddress: deployment.signMessageLib?.address || '',
            createCallAddress: deployment.createCall?.address || '',
            simulateTxAccessorAddress: deployment.simulateTxAccessor?.address || ''
          }
        }
      }

      // Verify multisend addresses if provided
      if (multisendAddress) {
        const isValidAddress = await provider.getCode(multisendAddress).then(code => code !== '0x')
        if (!isValidAddress) {
          throw new Error('Invalid MultiSend contract address - no code at this address')
        }
      }

      if (multisendCallOnlyAddress) {
        const isValidAddress = await provider.getCode(multisendCallOnlyAddress).then(code => code !== '0x')
        if (!isValidAddress) {
          throw new Error('Invalid MultiSendCallOnly contract address - no code at this address')
        }
      }

      // Create Safe with custom contractNetworks
      return Safe.create({
        ethAdapter,
        safeAddress: address,
        isL1SafeMasterCopy,
        contractNetworks: {
          [chainId]: {
            ...defaultContracts,
            // Override only the provided addresses
            ...(multisendAddress ? { multiSendAddress } : {}),
            ...(multisendCallOnlyAddress ? { multiSendCallOnlyAddress } : {})
          }
        }
      })
    }

    // Default initialization without custom contractNetworks
    return Safe.create({
      ethAdapter,
      safeAddress: address,
      isL1SafeMasterCopy
    })
  } catch (error) {
    console.error('Error initializing Safe SDK:', error)

    // Attempt to create the Safe without custom addresses if that was the issue
    if (multisendAddress || multisendCallOnlyAddress) {
      console.log('Falling back to default contract addresses')
      return Safe.create({
        ethAdapter,
        safeAddress: address,
        isL1SafeMasterCopy
      })
    }

    // If it's not related to custom addresses, rethrow the error
    throw error
  }
}

export const {
  getStore: getSafeSDK,
  setStore: setSafeSDK,
  useStore: useSafeSDK,
} = new ExternalStore<Safe | undefined>()

export const {
  getStore: getSafeImplementation,
  setStore: setSafeImplementation,
  useStore: useSafeImplementation,
} = new ExternalStore<string | undefined>()
