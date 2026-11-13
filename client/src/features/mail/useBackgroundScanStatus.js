import { useEffect } from 'react'

export default function useBackgroundScanStatus(sync, paused, refresh) {
  const watching = sync?.background && ['QUEUED', 'SCANNING', 'PROCESSING'].includes(sync.status)
  useEffect(() => {
    if (!watching || paused) return undefined
    let stopped = false
    let timer
    async function poll() {
      await refresh({ clearError: false, quiet: true, isCurrent: () => !stopped })
      if (!stopped) timer = window.setTimeout(poll, 15_000)
    }
    timer = window.setTimeout(poll, 3000)
    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [watching, paused, refresh])
}
