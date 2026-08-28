import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { login as loginApi, getMe, logout as logoutApi, refreshSession } from '../api/auth'
import { createLogger } from '../utils/logger'
import type { UserInfo } from '../types'
import { setAuthTokenAccessor } from '../api/client'

const log = createLogger('AuthContext')

interface AuthContextType {
  user: UserInfo | null
  accessToken: string | null
  loading: boolean
  login: (username?: string, password?: string, totpCode?: string, rememberMe?: boolean, fingerprint?: Record<string, string>) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setAuthTokenAccessor(
      () => accessToken,
      (token) => setAccessToken(token)
    )
  }, [accessToken])

  const refreshUser = useCallback(async () => {
    try {
      const res = await getMe()
      setUser(res.data)
      log.debug('User refreshed: userId=%d', res.data.id)
    } catch {
      log.warn('Failed to refresh user')
    }
  }, [])

  const clearSession = useCallback(() => {
    setUser(null)
    setAccessToken(null)
  }, [])

  const logout = useCallback(async () => {
    log.info('User logged out')
    try {
      await logoutApi()
    } catch {
      log.warn('Logout API call failed')
    }
    clearSession()
    window.location.href = '/login'
  }, [clearSession])

  // 页面加载时用刷新令牌 Cookie 恢复会话（access token 只保存在内存中，刷新页面后需重新换取）
  useEffect(() => {
    let alive = true
    const bootstrap = async () => {
      try {
        const res = await refreshSession()
        if (!alive) return
        setAccessToken(res.data.accessToken)
        setUser(res.data.user)
        log.info('Session restored via refresh token: userId=%d', res.data.user.id)
      } catch (err) {
        if (!alive) return
        // 被其他登录挤下线（FIFO 剔除）时把后端提示带到登录页
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('其他设备') || msg.includes('已失效')) {
          try { sessionStorage.setItem('authKickedMessage', msg) } catch { /* ignore */ }
        }
        log.info('No valid session on bootstrap: %s', msg)
      } finally {
        if (alive) setLoading(false)
      }
    }
    bootstrap()
    return () => { alive = false }
  }, [])

  const setAuthData = useCallback((data: { accessToken: string; user: UserInfo }) => {
    setAccessToken(data.accessToken)
    setUser(data.user)
  }, [])

  const login = useCallback(async (username?: string, password?: string, totpCode?: string, rememberMe?: boolean, fingerprint?: Record<string, string>) => {
    const isCertLogin = !username && !password
    log.info('Logging in: %s', isCertLogin ? 'certificate' : 'username=' + username)
    const res = await loginApi({ username: username || '', password: password || '', totpCode, rememberMe, fingerprint })
    const { accessToken: at, user: u } = res.data
    setAuthData({ accessToken: at, user: u })
    log.info('Login success: userId=%d', u.id)
  }, [setAuthData])

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
