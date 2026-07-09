import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { login as loginApi, getMe, refreshToken as refreshTokenApi, verifyTotpLogin as verifyTotpLoginApi, heartbeat as heartbeatApi } from '../api/auth'
import { getStoredRefreshToken } from '../api/client'
import { createLogger } from '../utils/logger'
import type { UserInfo } from '../types'

const log = createLogger('AuthContext')

const HEARTBEAT_INTERVAL = 60000

interface AuthContextType {
  user: UserInfo | null
  loading: boolean
  login: (username: string, password: string) => Promise<string | null>
  verifyTotpLogin: (totpToken: string, code: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('scalefish_access_token'))
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshUser = useCallback(async () => {
    try {
      const res = await getMe()
      setUser(res.data)
      log.debug('User refreshed: userId=%d', res.data.id)
    } catch {
      log.warn('Failed to refresh user')
    }
  }, [])

  const logout = useCallback(() => {
    log.info('User logged out')
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('scalefish_access_token')
    localStorage.removeItem('scalefish_refresh_token')
    window.location.href = '/login'
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('scalefish_access_token')
    const refresh = getStoredRefreshToken()
    if (token && refresh) {
      setAccessToken(token)
      log.debug('Restoring session...')
      const restore = async () => {
        try {
          const res = await getMe()
          setUser(res.data)
          log.info('Session restored: userId=%d', res.data.id)
          return
        } catch {
          log.warn('Access token expired, attempting refresh...')
        }

        try {
          const res = await refreshTokenApi(refresh)
          const { accessToken, refreshToken: newRefresh, user: u } = res.data
          localStorage.setItem('scalefish_access_token', accessToken)
          localStorage.setItem('scalefish_refresh_token', newRefresh)
          setAccessToken(accessToken)
          setUser(u)
          log.info('Session restored via refresh: userId=%d', u.id)
        } catch {
          log.warn('Session restore failed, clearing tokens')
          setAccessToken(null)
          localStorage.removeItem('scalefish_access_token')
          localStorage.removeItem('scalefish_refresh_token')
        }
      }
      restore().finally(() => setLoading(false))
    } else {
      log.debug('No stored session')
      setLoading(false)
    }
  }, [])

  // HTTP heartbeat polling
  useEffect(() => {
    if (!accessToken) {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current)
        heartbeatTimerRef.current = null
      }
      return
    }

    const ping = async () => {
      try {
        await heartbeatApi()
      } catch {
        log.warn('Heartbeat failed, redirecting to login')
        localStorage.removeItem('scalefish_access_token')
        localStorage.removeItem('scalefish_refresh_token')
        window.location.href = '/login'
      }
    }

    ping()
    heartbeatTimerRef.current = setInterval(ping, HEARTBEAT_INTERVAL)
    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current)
        heartbeatTimerRef.current = null
      }
    }
  }, [accessToken])

  const setAuthData = useCallback((data: { accessToken: string; refreshToken: string; user: UserInfo }) => {
    localStorage.setItem('scalefish_access_token', data.accessToken)
    localStorage.setItem('scalefish_refresh_token', data.refreshToken)
    setAccessToken(data.accessToken)
    setUser(data.user)
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    log.info('Logging in: username=%s', username)
    const res = await loginApi({ username, password })
    const { accessToken, refreshToken: rt, user: u, totpRequired, totpToken } = res.data
    if (totpRequired && totpToken) {
      log.info('TOTP required for userId=%d', u.id)
      return totpToken
    }
    setAuthData({ accessToken, refreshToken: rt, user: u })
    log.info('Login success: userId=%d', u.id)
    return null
  }, [setAuthData])

  const verifyTotpLogin = useCallback(async (totpToken: string, code: string) => {
    log.info('Verifying TOTP login')
    const res = await verifyTotpLoginApi(totpToken, code)
    const { accessToken, refreshToken: rt, user: u } = res.data
    setAuthData({ accessToken, refreshToken: rt, user: u })
    log.info('TOTP login success: userId=%d', u.id)
  }, [setAuthData])

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyTotpLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
