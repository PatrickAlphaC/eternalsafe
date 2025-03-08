import { AppRoutes } from '@/config/routes'
import { usePathname } from 'next/navigation'

const NO_SIDEBAR_ROUTES = [AppRoutes.newSafe.load, AppRoutes.index, AppRoutes.imprint]

export function useIsSidebarRoute(): boolean {
  const pathname = usePathname()
  return !NO_SIDEBAR_ROUTES.includes(pathname)
}
