import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { useTheme } from '../contexts/ThemeContext'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeClasses: Record<string, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'sm:max-w-[95vw] sm:max-h-[95vh] sm:h-[95vh]',
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const { resolved } = useTheme()
  const isLight = resolved === 'light'

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ background: isLight ? '#ffffff' : '#15171f', scrollbarWidth: 'none' }}
            className={`relative w-full border border-surface-500/50 shadow-2xl max-h-[90dvh] sm:max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden rounded-none sm:rounded-xl sm:mx-4 ${sizeClasses[size] || sizeClasses.md}`}
          >
            <div
              style={{ background: isLight ? '#e2e8f0' : '#1e2939' }}
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 rounded-t-none sm:rounded-t-xl"
            >
              <h2 className={`font-semibold text-sm ${isLight ? 'text-gray-800' : 'text-white'}`}>{title}</h2>
              <button onClick={onClose} className={`transition-colors p-1 ${isLight ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-white'}`}>
                <FiX size={20} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
