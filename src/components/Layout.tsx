import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { FiSun, FiMoon, FiMonitor, FiSettings, FiLogOut, FiPlus, FiList } from 'react-icons/fi'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { getAppConfig } from '../api/app-config'
import { OPEN_CREATE_BOOKMARK_EVENT } from '../events'

const navLinks = [
  { to: '/', label: '书签' },
  { to: '/moments', label: '时刻' },
  { to: '/settings', label: '设置' },
]

export default function Layout() {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const { theme, cycleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    getAppConfig().then(res => {
      const name = res.data?.display_name
      if (name) setDisplayName(name)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const name = displayName || 'scalefish'
    document.title = name
  }, [displayName])

  const isBookmarkMode = location.pathname === '/' || location.pathname.startsWith('/bookmarks/')

  const themeLabel = theme === 'light' ? '亮色模式' : theme === 'dark' ? '暗色模式' : '跟随系统'

  const openCreateBookmark = () => {
    window.dispatchEvent(new CustomEvent(OPEN_CREATE_BOOKMARK_EVENT))
  }

  return (
    <div className="flex flex-col h-screen bg-surface-900 overflow-hidden">
      <header className="glass border-b border-white/5 h-14 flex items-center px-4 gap-3 shrink-0 relative z-30">
        <button onClick={() => navigate('/')} className="hidden sm:flex items-center gap-2.5 cursor-pointer mr-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
            {(displayName || 'S')[0].toUpperCase()}
          </div>
          <span className="font-semibold text-sm tracking-wide hidden sm:inline">
            <span className="gradient-text">{displayName || 'scalefish'}</span>
          </span>
        </button>
        <nav className="flex items-center gap-1">
          {navLinks.map(({ to, label }) => {
            const isActive = to === '/'
              ? location.pathname === '/' || location.pathname.startsWith('/bookmarks/') || location.pathname.startsWith('/manage')
              : to === '/moments'
                ? location.pathname.startsWith('/moments')
                : location.pathname === '/settings' || location.pathname.startsWith('/settings/')
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-accent-500/10 text-accent-400 font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            )
          })}
        </nav>
        <div className="flex-1" />
        {isBookmarkMode && (
          <button
            onClick={openCreateBookmark}
            title="新增书签"
            className="flex items-center gap-1 text-xs font-medium text-white bg-accent-600 hover:bg-accent-500 transition-colors px-2.5 py-1.5 rounded-lg"
          >
            <FiPlus size={14} />
            <span className="hidden sm:inline">新增书签</span>
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
          >
            <span className="w-5 h-5 rounded-full bg-accent-600 flex items-center justify-center text-white text-[10px] font-medium">
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </span>
            <span className="hidden sm:inline">{user?.username}</span>
          </button>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-44 glass rounded-lg py-1 shadow-xl border border-white/10">
                <div className="px-3 py-2 text-xs text-gray-400 border-b border-white/5">
                  {user?.name || user?.username}
                </div>
                <button
                  onClick={cycleTheme}
                  title="点击切换 亮色 / 暗色 / 跟随系统"
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
                >
                  {theme === 'system' ? <FiMonitor size={13} /> : theme === 'light' ? <FiSun size={13} /> : <FiMoon size={13} />}
                  <span className="flex-1 text-left">{themeLabel}</span>
                </button>
                {isBookmarkMode && (
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/manage') }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
                  >
                    <FiList size={13} />
                    管理书签
                  </button>
                )}
                <button
                  onClick={() => { setUserMenuOpen(false); navigate('/settings') }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
                >
                  <FiSettings size={13} />
                  设置
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); logout() }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                >
                  <FiLogOut size={13} />
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
