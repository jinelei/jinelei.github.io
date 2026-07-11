import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { FiBookmark, FiLogOut, FiX, FiSettings, FiChevronDown, FiServer, FiEdit, FiShield } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { getCategoryTree } from '../api/categories'
import type { CategoryResponse } from '../types'

const links = [
  { to: '/', label: '书签', icon: FiBookmark },
  { to: '/moments', label: '时刻', icon: FiEdit },
  { to: '/system', label: '系统', icon: FiServer },
  { to: '/settings', label: '设置', icon: FiSettings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  displayName?: string
}

function getTopLevelCategories(tree: CategoryResponse[]): { id: number; name: string }[] {
  return tree.map(c => ({ id: c.id, name: c.name }))
}

export default function Sidebar({ open, onClose, displayName }: SidebarProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [bookmarkMenuOpen, setBookmarkMenuOpen] = useState(false)
  const [systemMenuOpen, setSystemMenuOpen] = useState(false)
  const [categoryList, setCategoryList] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    getCategoryTree()
      .then(res => setCategoryList(getTopLevelCategories(res.data)))
      .catch(() => {})
  }, [])

  const isBookmarkActive = location.pathname === '/' || location.pathname.startsWith('/bookmarks/')
  const isSystemActive = location.pathname.startsWith('/system-') || location.pathname.startsWith('/system/') || location.pathname.startsWith('/client-cert')

  const isCategoryActive = (id: number) => location.pathname === `/bookmarks/${id}`

  return (
    <AnimatePresence initial={false}>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-y-0 left-0 z-50 md:relative md:inset-auto md:z-auto h-full glass border-r border-white/5 overflow-hidden shrink-0"
          >
            <div className="w-[220px] h-full flex flex-col">
              <div className="h-14 flex items-center justify-between px-5 border-b border-white/5 shrink-0">
                <button onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    {(displayName || 'S')[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm tracking-wide">
                    <span className="gradient-text">{displayName || 'scalefish'}</span>
                  </span>
                </button>
                <button onClick={onClose} className="md:hidden text-gray-500 hover:text-white transition-colors p-1">
                  <FiX size={18} />
                </button>
              </div>

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {links.map(({ to, label, icon: Icon }) => {
                if (to === '/') {
                  return (
                    <div key={to}>
                      <div
                        onClick={() => setBookmarkMenuOpen(v => !v)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                          isBookmarkActive
                            ? 'bg-accent-500/10 text-accent-400 font-medium'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                      >
                        <Icon size={17} />
                        <span className="flex-1 min-w-0">{label}</span>
                        <FiChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${
                            bookmarkMenuOpen ? 'rotate-0' : '-rotate-90'
                          }`}
                        />
                      </div>
                      <AnimatePresence>
                        {bookmarkMenuOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-2 mt-0.5 space-y-0.5 border-l border-white/5 pl-2">
                              <NavLink
                                to="/"
                                end
                                className={({ isActive }) =>
                                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                    isActive
                                      ? 'bg-accent-500/10 text-accent-400 font-medium'
                                      : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                                  }`
                                }
                              >
                                全部
                              </NavLink>
                              {categoryList.map(cat => (
                                <NavLink
                                  key={cat.id}
                                  to={`/bookmarks/${cat.id}`}
                                  className={
                                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                      isCategoryActive(cat.id)
                                        ? 'bg-accent-500/10 text-accent-400 font-medium'
                                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                                    }`
                                  }
                                >
                                  <span className="truncate">{cat.name}</span>
                                </NavLink>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                }
                if (to === '/system') {
                  return (
                    <div key={to}>
                      <div
                        onClick={() => setSystemMenuOpen(v => !v)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                          isSystemActive
                            ? 'bg-accent-500/10 text-accent-400 font-medium'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                      >
                        <Icon size={17} />
                        <span className="flex-1 min-w-0">{label}</span>
                        <FiChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${
                            systemMenuOpen ? 'rotate-0' : '-rotate-90'
                          }`}
                        />
                      </div>
                      <AnimatePresence>
                        {systemMenuOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-2 mt-0.5 space-y-0.5 border-l border-white/5 pl-2">
                              <NavLink
                                to="/system-overview"
                                className={({ isActive }) =>
                                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                    isActive
                                      ? 'bg-accent-500/10 text-accent-400 font-medium'
                                      : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                                  }`
                                }
                              >
                                概览
                              </NavLink>
                              <NavLink
                                to="/system/services"
                                className={({ isActive }) =>
                                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                    isActive
                                      ? 'bg-accent-500/10 text-accent-400 font-medium'
                                      : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                                  }`
                                }
                              >
                                服务
                              </NavLink>
                              <NavLink
                                to="/system/certificates"
                                className={({ isActive }) =>
                                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                    isActive
                                      ? 'bg-accent-500/10 text-accent-400 font-medium'
                                      : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                                  }`
                                }
                              >
                                <FiShield size={14} />
                                证书
                              </NavLink>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                }
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-accent-500/10 text-accent-400 font-medium'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon size={17} />
                    {label}
                  </NavLink>
                )
              })}
            </nav>

            <div className="px-4 py-4 border-t border-white/5 space-y-2">
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-all duration-200"
              >
                <FiLogOut size={17} />
                退出登录
              </button>
            </div>
          </div>
        </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
