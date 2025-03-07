/**
 * This file provides a shim for WalletConnect's utility functions
 * It should be imported as early as possible in the application
 */

// Define the utility functions directly on the window object
if (typeof window !== 'undefined') {
  // Define isAndroid function
  if (!window.hasOwnProperty('isAndroid')) {
    Object.defineProperty(window, 'isAndroid', {
      value: function () {
        return false
      },
      writable: false,
      configurable: true,
    })
  }

  // Define isIos function
  if (!window.hasOwnProperty('isIos')) {
    Object.defineProperty(window, 'isIos', {
      value: function () {
        return false
      },
      writable: false,
      configurable: true,
    })
  }

  // Define isMobile function
  if (!window.hasOwnProperty('isMobile')) {
    Object.defineProperty(window, 'isMobile', {
      value: function () {
        return false
      },
      writable: false,
      configurable: true,
    })
  }

  // Try to patch the webpack module directly
  try {
    // Create a getter for the webpack module
    Object.defineProperty(window, '_walletconnect_utils__WEBPACK_IMPORTED_MODULE_13__', {
      get: function () {
        return {
          isAndroid: function () {
            return false
          },
          isIos: function () {
            return false
          },
          isMobile: function () {
            return false
          },
        }
      },
      configurable: true,
    })
  } catch (e) {
    console.warn('Failed to patch webpack module:', e)
  }

  console.log('WalletConnect shim installed')
}

export {}
