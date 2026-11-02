import { useEffect } from 'react'
import { HashRouter } from 'react-router-dom'
import AppRouter from './router'
import { eventStream } from './api/ws'
import { isBackendReady } from './api/client'
import { useEventStore } from './stores/eventStore'

export default function App(): JSX.Element {
  const push = useEventStore((s) => s.push)

  useEffect(() => {
    void isBackendReady()
    eventStream.connect()
    const off = eventStream.subscribe(push)
    return () => {
      off()
      eventStream.disconnect()
    }
  }, [push])

  return (
    <HashRouter>
      <AppRouter />
    </HashRouter>
  )
}
