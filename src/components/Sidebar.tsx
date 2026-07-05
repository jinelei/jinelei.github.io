import { NavLink, useNavigate } from 'react-router-dom'
import { FiBookmark, FiLogOut, FiX, FiSettings, FiGrid } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const links = [
  { to: '/', label: '书签', icon: FiBookmark },
  { to: '/my-links', label: '我的', icon: FiGrid },
  { to: '/settings', label: '设置', icon: FiSettings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  displayName?: string
}

export default function Sidebar({ open, onClose, displayName }: SidebarProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
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
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
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
              ))}

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
