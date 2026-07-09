import { useState, useEffect } from 'react'
import { FiExternalLink, FiMusic, FiCamera, FiFolder, FiShield, FiLock, FiGlobe, FiCode } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { getExternalLinks } from '../api/external-links'
import type { ExternalLinkResponse } from '../types'

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  FiMusic, FiCamera, FiFolder, FiShield, FiLock, FiGlobe, FiCode, FiExternalLink,
}

const DefaultIcon = FiExternalLink

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const tile = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function MyLinks() {
  const [links, setLinks] = useState<ExternalLinkResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getExternalLinks()
      .then(res => setLinks(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass rounded-xl p-4 sm:p-5 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-white/5 mb-3" />
                <div className="h-4 bg-white/5 rounded w-2/3 mb-2" />
                <div className="h-3 bg-white/5 rounded w-full" />
              </div>
            ))
          : links.length === 0
            ? (
              <div className="col-span-full text-center py-16">
                <FiExternalLink size={40} className="mx-auto text-gray-600 mb-3" />
                <p className="text-sm text-gray-500">暂无外部链接</p>
                <p className="text-xs text-gray-600 mt-1">前往设置页面添加外部链接</p>
              </div>
            )
            : links.map((link) => {
                const Icon = (link.icon && iconMap[link.icon]) || DefaultIcon
                return (
                  <motion.a
                    key={link.id}
                    variants={tile}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass rounded-xl p-4 sm:p-5 flex flex-col items-start gap-3 hover:bg-white/[0.04] transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-purple-500/20 flex items-center justify-center group-hover:from-accent-500/30 group-hover:to-purple-500/30 transition-colors">
                      <Icon size={20} className="text-accent-400" />
                    </div>
                    <div className="min-w-0 w-full flex-1">
                      <h3 className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">
                        {link.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate mt-0.5 group-hover:text-gray-400 transition-colors">
                        {link.url}
                      </p>
                    </div>
                    <FiExternalLink size={13} className="text-gray-600 group-hover:text-accent-400 transition-colors shrink-0 self-end" />
                  </motion.a>
                )
              })}
      </div>
    </motion.div>
  )
}
