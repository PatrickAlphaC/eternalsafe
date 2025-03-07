/**
 * This file contains patches for the WalletConnect SDK
 * It should be imported before any WalletConnect imports
 */

// Define the missing functions
const isAndroid = (): boolean => false
const isIos = (): boolean => false
const isMobile = (): boolean => false

// Apply the patches to the global scope
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.isAndroid = isAndroid
  // @ts-ignore
  window.isIos = isIos
  // @ts-ignore
  window.isMobile = isMobile

  // Try to patch the module directly
  try {
    // @ts-ignore
    if (window.walletconnect_utils) {
      // @ts-ignore
      window.walletconnect_utils.isAndroid = isAndroid
      // @ts-ignore
      window.walletconnect_utils.isIos = isIos
      // @ts-ignore
      window.walletconnect_utils.isMobile = isMobile
    }
  } catch (e) {
    console.error('Failed to patch WalletConnect utils:', e)
  }

  // Patch the module loader
  const originalDefine = window.define
  if (originalDefine) {
    // @ts-ignore
    window.define = function (name, deps, callback) {
      // Check if this is the WalletConnect utils module
      if (typeof name === 'string' && name.includes('walletconnect') && name.includes('utils')) {
        const originalCallback = callback
        callback = function (...args: any[]) {
          const result = originalCallback.apply(this, args)
          // Add our functions to the module exports
          if (result) {
            result.isAndroid = isAndroid
            result.isIos = isIos
            result.isMobile = isMobile
          }
          return result
        }
      }
      return originalDefine(name, deps, callback)
    }
    // Copy properties from the original define function
    for (const key in originalDefine) {
      // @ts-ignore
      window.define[key] = originalDefine[key]
    }
  }
}

// Export the functions for direct use
export { isAndroid, isIos, isMobile }
