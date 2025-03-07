/**
 * Utility functions for WalletConnect
 * These are polyfills for functions that might be missing from the WalletConnect SDK
 */

/**
 * Check if the current device is running Android
 * @returns true if the device is running Android
 */
export const isAndroid = (): boolean => {
  return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
}

/**
 * Check if the current device is running iOS
 * @returns true if the device is running iOS
 */
export const isIos = (): boolean => {
  return (
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
  )
}

/**
 * Check if the current device is a mobile device
 * @returns true if the device is a mobile device
 */
export const isMobile = (): boolean => {
  return isAndroid() || isIos()
}

/**
 * Add polyfills to the global window object
 * This is needed because some libraries might expect these functions to be available globally
 */
export const addPolyfillsToWindow = (): void => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.isAndroid = window.isAndroid || isAndroid
    // @ts-ignore
    window.isIos = window.isIos || isIos
    // @ts-ignore
    window.isMobile = window.isMobile || isMobile
  }
}
