import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { register as registerApi, getRegistrationStatus } from '../api/auth'

export default function Register() {
  const { user, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [allowRegister, setAllowRegister] = useState(true)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    getRegistrationStatus()
      .then(res => setAllowRegister(res.data.allowRegistration))
      .catch(() => setAllowRegister(false))
      .finally(() => setChecking(false))
  }, [])

  if (user) return <Navigate to="/" replace />

  if (!checking && !allowRegister) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900 px-4">
        <div className="w-full max-w-sm glass rounded-xl p-6 sm:p-8 space-y-6 text-center">
          <h1 className="text-xl font-bold">注册已关闭</h1>
          <p className="text-sm text-gray-500">管理员已关闭注册，请联系管理员开通</p>
          <Link to="/login" className="inline-block text-sm text-accent-400 hover:text-accent-300">返回登录</Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) { setError('请填写用户名和密码'); return }
    if (password !== confirm) { setError('两次密码输入不一致'); return }
    setSubmitting(true)
    setError('')
    try {
      await registerApi({ username, password, name: name.trim() || undefined, email: email.trim() || undefined })
      // After registration, log in the user (tokens are handled by AuthContext)
      await login(username, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
      // If backend rejects because registration is disabled, update state
      if (err instanceof Error && err.message.includes('关闭注册')) {
        setAllowRegister(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 px-4">
      <div className="w-full max-w-sm glass rounded-xl p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">创建账号</h1>
          <p className="text-sm text-gray-500 mt-1">第一个注册的用户自动成为管理员</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">用户名 *</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-500 transition-colors"
              placeholder="请输入用户名" autoComplete="username" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">显示名称</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-500 transition-colors"
              placeholder="选填" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">邮箱</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-500 transition-colors"
              placeholder="选填" autoComplete="email" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">密码 *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-500 transition-colors"
              placeholder="至少 6 位" autoComplete="new-password" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">确认密码 *</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-500 transition-colors"
              placeholder="再次输入密码" autoComplete="new-password" />
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <button type="submit" disabled={submitting}
            className="w-full bg-accent-600 hover:bg-accent-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
            {submitting ? '注册中...' : '注册'}
          </button>
        </form>
        <p className="text-xs text-center text-gray-500">
          已有账号？
          <Link to="/login" className="text-accent-400 hover:text-accent-300 ml-1">登录</Link>
        </p>
      </div>
    </div>
  )
}
