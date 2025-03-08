import { AppRoutes } from '@/config/routes'
import { usePathname } from 'next/navigation'

// Routes that should NOT display the sidebar
const NO_SIDEBAR_ROUTES = [
  AppRoutes.newSafe.load,
  AppRoutes.index,
  AppRoutes.imprint,
  // Do NOT add the WalletConnect transaction route here
  // We want the sidebar to be visible on the WalletConnect transaction page
]

export function useIsSidebarRoute(): boolean {
  const pathname = usePathname()
  return !NO_SIDEBAR_ROUTES.includes(pathname)
}
