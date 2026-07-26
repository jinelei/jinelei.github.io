import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FiSun, FiMoon, FiMonitor, FiSettings, FiLogOut } from 'react-icons/fi'
import { HiMenuAlt2 } from 'react-icons/hi'
import Sidebar from './Sidebar'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { getAppConfig } from '../api/app-config'
import { getCategoryTree } from '../api/categories'
import type { CategoryResponse } from '../types'

const pageTitles: Record<string, [string, string]> = {
  '/': ['书签', '书签管家'],
  '/moments': ['时刻', '记录你的灵光一现'],
  '/settings': ['设置', '账户 / Token / 插件'],
}

function findCategoryName(tree: CategoryResponse[], id: number): string | null {
  for (const c of tree) {
    if (c.id === id) return c.name
    const found = findCategoryName(c.children, id)
    if (found) return found
  }
  return null
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const { theme, cycleTheme } = useTheme()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isBookmarksCategory = location.pathname.startsWith('/bookmarks/') && location.pathname.split('/').length === 3
  const catId = isBookmarksCategory ? Number(location.pathname.split('/')[2]) : null

  const pageTitle = pageTitles[location.pathname]
  const [title, subtitle] = pageTitle || (isBookmarksCategory ? ['书签', categoryName || '...'] : ['', ''])

  const loadCategoryName = useCallback(async (id: number) => {
    try {
      const res = await getCategoryTree()
      const name = findCategoryName(res.data, id)
      setCategoryName(name)
    } catch {
      setCategoryName(null)
    }
  }, [])

  useEffect(() => {
    if (catId) {
      loadCategoryName(catId)
    } else {
      setCategoryName(null)
    }
  }, [catId, loadCategoryName])

  useEffect(() => {
    getAppConfig().then(res => {
      const name = res.data?.display_name
      if (name) setDisplayName(name)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const name = displayName || 'scalefish'
    document.title = `${name} - ${subtitle || title}`
  }, [displayName, location.pathname, title, subtitle])
  const themeLabel = theme === 'light' ? '亮色' : theme === 'dark' ? '暗色' : '跟随系统'

  return (
    <div className="flex h-screen bg-surface-900 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} displayName={displayName} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="glass border-b border-white/5 h-14 flex items-center px-4 gap-3 shrink-0 relative z-30">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <HiMenuAlt2 size={22} />
          </button>
          <button onClick={() => navigate('/')} className="flex items-baseline gap-2 min-w-0 cursor-pointer">
            <span className="text-sm font-bold gradient-text truncate">{title}</span>
            {subtitle && <span className="text-[11px] text-gray-500 truncate">{subtitle}</span>}
          </button>
          <div className="flex-1" />
          <button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
            title={themeLabel}
          >
            {theme === 'system' ? <FiMonitor size={14} /> : theme === 'light' ? <FiSun size={14} /> : <FiMoon size={14} />}
          </button>
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
                <div className="absolute right-0 top-full mt-1 z-50 w-40 glass rounded-lg py-1 shadow-xl border border-white/10">
                  <div className="px-3 py-2 text-xs text-gray-400 border-b border-white/5">
                    {user?.name || user?.username}
                  </div>
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
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
