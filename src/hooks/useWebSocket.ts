import { useEffect, useRef, useCallback } from 'react'
import { createLogger } from '../utils/logger'

const log = createLogger('WebSocket')

const HEARTBEAT_INTERVAL = 3000
const RECONNECT_DELAY = 5000

export function useWebSocket(token: string | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/ws/heartbeat?token=${encodeURIComponent(token)}`

    log.debug('Connecting WebSocket...')
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      log.debug('WebSocket connected')
    }

    ws.onmessage = (e) => {
      if (e.data === 'unauthorized') {
        log.warn('Heartbeat unauthorized, redirecting to login')
        localStorage.removeItem('scalefish_access_token')
        localStorage.removeItem('scalefish_refresh_token')
        window.location.href = '/login'
      }
    }

    ws.onclose = (e) => {
      log.debug('WebSocket closed: code=%d, reason=%s', e.code, e.reason)
      wsRef.current = null
      if (token) {
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY)
      }
    }

    ws.onerror = () => {
      log.warn('WebSocket error')
      ws.close()
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      cleanup()
      return
    }

    connect()

    heartbeatTimerRef.current = setInterval(() => {
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, HEARTBEAT_INTERVAL)

    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function cleanup() {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }
}
