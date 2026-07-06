import { useEffect, useRef, useCallback } from 'react'
import type { SystemStats } from '../types'
import { createLogger } from '../utils/logger'

const log = createLogger('SystemStatsWS')

const RECONNECT_DELAY = 3000

export function useSystemStatsWS(
  enabled: boolean,
  onStats: (stats: SystemStats) => void,
  onError: (err: string) => void,
) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onStatsRef = useRef(onStats)
  const onErrorRef = useRef(onError)
  onStatsRef.current = onStats
  onErrorRef.current = onError

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    const token = localStorage.getItem('scalefish_access_token')
    if (!enabled || !token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/ws/system-stats?token=${encodeURIComponent(token)}`

    log.debug('Connecting system stats WebSocket...')
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      log.debug('System stats WebSocket connected')
      onErrorRef.current('')
    }

    ws.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data)
        if (parsed.code === 200 && parsed.data) {
          onStatsRef.current(parsed.data)
        }
      } catch {
        log.warn('Failed to parse system stats message')
      }
    }

    ws.onclose = () => {
      log.debug('System stats WebSocket closed, reconnecting...')
      wsRef.current = null
      onErrorRef.current('WebSocket 断开，正在重连...')
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY)
    }

    ws.onerror = () => {
      log.warn('System stats WebSocket error')
      ws.close()
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      cleanup()
      return
    }
    connect()
    return cleanup
  }, [enabled, connect, cleanup])
}
