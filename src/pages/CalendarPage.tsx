import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiCalendar, FiLink, FiUser, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import CalendarView from '../components/CalendarView'
import { getCalDavConfig, updateCalDavConfig, getStoredPassword, fetchCalendarEvents } from '../api/calendar'
import type { CalendarEvent } from '../types'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export default function CalendarPage() {
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [configured, setConfigured] = useState(false)

  const [serverUrl, setServerUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showConfigForm, setShowConfigForm] = useState(false)

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true)
    try {
      const cfg = await getCalDavConfig()
      if (cfg.serverUrl && cfg.username && cfg.hasPassword) {
        setConfigured(true)
        setServerUrl(cfg.serverUrl)
        setUsername(cfg.username)
        setPassword(getStoredPassword())
      } else {
        setServerUrl(cfg.serverUrl)
        setUsername(cfg.username)
        setConfigured(false)
        setShowConfigForm(true)
      }
    } catch {
      setShowConfigForm(true)
    } finally {
      setLoadingConfig(false)
    }
  }, [])

  const loadEvents = useCallback(async () => {
    if (!serverUrl || !username || !password) return
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59)

    setLoadingEvents(true)
    setEventsError(null)
    try {
      const result = await fetchCalendarEvents(serverUrl, username, password, start, end)
      setEvents(result)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '无法连接日历服务器'
      setEventsError(msg)
    } finally {
      setLoadingEvents(false)
    }
  }, [serverUrl, username, password])

  useEffect(() => { loadConfig() }, [loadConfig])

  useEffect(() => {
    if (configured && !fetching) {
      setFetching(true)
      loadEvents().finally(() => setFetching(false))
    }
  }, [configured, loadEvents, fetching])

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serverUrl.trim() || !username.trim()) {
      toast.error('请填写服务器地址和用户名')
      return
    }

    setSaving(true)
    try {
      await updateCalDavConfig({
        serverUrl: serverUrl.trim(),
        username: username.trim(),
        password: password || undefined,
      })
      setPassword(password || getStoredPassword())
      toast.success('日历设置已保存')
      setConfigured(true)
      setShowConfigForm(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存失败'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (showConfigForm) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-lg mx-auto">
        <motion.div variants={item} className="glass rounded-xl p-6 sm:p-8 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
              <FiCalendar size={18} className="text-accent-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-300">日历设置</h2>
              <p className="text-xs text-gray-500 mt-0.5">配置 Radicale CalDAV 服务</p>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                服务器地址 <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <FiLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="url"
                  value={serverUrl}
                  onChange={e => setServerUrl(e.target.value)}
                  placeholder="https://radicale.example.com/user/calendar/"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-500/50 transition-colors"
                />
              </div>
              <p className="text-[10px] text-gray-600 mt-1">
                Radicale 日历集合地址，例如 https://example.com/{'{username}'}/default/
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                用户名 <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <FiUser size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="用户名"
                  autoComplete="username"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-500/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                密码 <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={getStoredPassword() ? '（已保存，留空使用已有密码）' : '密码'}
                  autoComplete="current-password"
                  className="w-full pl-3 pr-9 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-1">
                密码保存在浏览器本地，不会上传到服务器
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving || !serverUrl.trim() || !username.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 disabled:opacity-40 text-white text-xs font-semibold transition-all active:scale-95"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              {configured && (
                <button
                  type="button"
                  onClick={() => setShowConfigForm(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors"
                >
                  取消
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-start gap-2.5">
            <FiAlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              需要 Radicale 服务器启用 CORS。如果连接失败，请确保 Radicale 配置了正确的跨域头。
            </p>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <CalendarView
      events={events}
      loading={loadingEvents}
      error={eventsError}
      onSettings={() => setShowConfigForm(true)}
    />
  )
}
