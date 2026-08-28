import { useState, useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { FiShield, FiAlertOctagon } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { getRegistrationStatus, certStatus } from '../api/auth'
import { loginCheck, type LoginCheckResult } from '../api/device-fingerprints'
import { collectFingerprintFeatures } from '../utils/fingerprint'
import { createLogger } from '../utils/logger'

const log = createLogger('Login')

export default function Login() {
  const { user, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  // 被挤下线（同账号超出并发登录上限，FIFO 剔除最早会话）或会话过期时，拦截器把后端提示写入 sessionStorage
  const [error, setError] = useState(() => {
    try {
      const kicked = sessionStorage.getItem('authKickedMessage')
      if (kicked) {
        sessionStorage.removeItem('authKickedMessage')
        return kicked
      }
    } catch { /* ignore */ }
    return ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [allowRegister, setAllowRegister] = useState(true)
  const [checking, setChecking] = useState(true)
  const [certAvailable, setCertAvailable] = useState(false)
  const [checkResult, setCheckResult] = useState<LoginCheckResult | null>(null)
  const [checkingLogin, setCheckingLogin] = useState(false)
  const checkedUsernameRef = useRef('')

  useEffect(() => {
    getRegistrationStatus()
      .then(res => setAllowRegister(res.data.allowRegistration))
      .catch(() => setAllowRegister(false))

    certStatus()
      .then(res => setCertAvailable(res.data.available))
      .catch(() => setCertAvailable(false))
      .finally(() => setChecking(false))
  }, [])

  if (user) return <Navigate to="/" replace />

  const runLoginCheck = async (name: string): Promise<LoginCheckResult | null> => {
    const trimmed = name.trim()
    if (!trimmed) return null
    setCheckingLogin(true)
    setError('')
    try {
      const fingerprint = collectFingerprintFeatures()
      const res = await loginCheck(trimmed, fingerprint)
      checkedUsernameRef.current = trimmed
      setCheckResult(res.data)
      return res.data
    } catch (err) {
      // 登录检查失败不阻断流程，回退为按两步验证开启情况处理（要求输入验证码）
      setCheckResult(null)
      checkedUsernameRef.current = ''
      log.warn('login-check failed: %o', err)
      return null
    } finally {
      setCheckingLogin(false)
    }
  }

  const handleUsernameBlur = () => {
    const trimmed = username.trim()
    if (trimmed && trimmed !== checkedUsernameRef.current) {
      runLoginCheck(trimmed)
    }
  }

  const handleCertLogin = async () => {
    setSubmitting(true)
    setError('')
    try {
      await login()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!certAvailable && !username.trim()) { setError('请填写用户名'); return }
    if (!certAvailable && !password) { setError('请填写密码'); return }

    // 提交前进行登录检查（用户名未检查过或已变化时）
    let result = checkResult
    if (!certAvailable && username.trim() !== checkedUsernameRef.current) {
      result = await runLoginCheck(username)
    }

    if (result?.blocked) {
      setError('该设备已被标记为不信任，登录已被阻止，请在已信任的设备上登录后于设置页调整')
      return
    }

    if (result?.totpRequired && !totpCode.trim()) {
      setError('请输入两步验证码')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const fingerprint = certAvailable ? undefined : collectFingerprintFeatures()
      await login(username, password, totpCode.trim() || undefined, rememberMe, fingerprint)
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  const showCertButton = certAvailable
  const showTotpInput = !showCertButton && !!checkResult?.totpRequired
  const deviceBlocked = !!checkResult?.blocked
  const deviceTrusted = !!checkResult?.trusted

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 px-4">
      <div className="w-full max-w-sm glass rounded-xl p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">Scalefish</h1>
          <p className="text-sm text-gray-500 mt-1">{showCertButton ? '检测到客户端证书' : '登录以继续'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!showCertButton && (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">用户名</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={handleUsernameBlur}
                  className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-500 transition-colors"
                  placeholder="请输入用户名"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-500 transition-colors"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </div>
            </>
          )}
          {showTotpInput && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">两步验证码</label>
              <input
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-500 transition-colors text-center text-lg tracking-[0.5em]"
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
          )}
          {!showCertButton && checkResult && !deviceBlocked && (
            <div className="flex items-center gap-1.5 text-[11px]">
              {deviceTrusted ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <FiShield size={11} />
                  已信任设备，无需两步验证
                </span>
              ) : showTotpInput ? (
                <span className="flex items-center gap-1 text-amber-400">
                  <FiShield size={11} />
                  新设备或待确认设备，需要两步验证
                </span>
              ) : null}
            </div>
          )}
          {deviceBlocked && (
            <div className="flex items-start gap-1.5 text-[11px] text-rose-400 bg-rose-500/10 rounded-lg px-3 py-2">
              <FiAlertOctagon size={13} className="mt-0.5 shrink-0" />
              <span>该设备已被标记为不信任，登录已被阻止。请使用已信任设备登录后，在「设置 - 指纹管理」中调整。</span>
            </div>
          )}
          {!showCertButton && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-accent-600 bg-surface-700 border-gray-600 rounded focus:ring-accent-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-300 cursor-pointer">
                记住我
              </label>
            </div>
          )}
          {error && <p className="text-xs text-rose-400">{error}</p>}
          {showCertButton ? (
            <button
              type="button"
              disabled={submitting}
              onClick={handleCertLogin}
              className="w-full bg-accent-600 hover:bg-accent-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? '登录中...' : '登录'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || checkingLogin || deviceBlocked}
              className="w-full bg-accent-600 hover:bg-accent-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? '验证中...' : checkingLogin ? '检查中...' : '登录'}
            </button>
          )}
        </form>
        {!checking && allowRegister && !showCertButton && (
          <p className="text-xs text-center text-gray-500">
            没有账号？
            <Link to="/register" className="text-accent-400 hover:text-accent-300 ml-1">注册</Link>
          </p>
        )}
      </div>
    </div>
  )
}
