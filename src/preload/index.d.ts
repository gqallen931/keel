import type { DesktopApi } from '../shared/bridge'

declare global {
  interface Window {
    desktop: DesktopApi
  }
}

export {}
