import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiClock, FiCpu, FiServer, FiHardDrive, FiDatabase } from 'react-icons/fi'
import { getSystemStats } from '../api/system'
import type { SystemStats, MemoryInfo, DiskInfo } from '../types'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts: string[] = []
  if (d > 0) parts.push(`${d} 天`)
  if (h > 0) parts.push(`${h} 小时`)
  if (m > 0) parts.push(`${m} 分钟`)
  parts.push(`${s} 秒`)
  return parts.join(' ')
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

function ProgressBar({ value, label, color = 'accent', showValue = true }: { value: number; label: string; color?: string; showValue?: boolean }) {
  const pct = Math.min(Math.round(value * 100), 100)
  const barColor =
    color === 'accent' ? 'bg-accent-500' :
    color === 'rose' ? 'bg-rose-500' :
    color === 'amber' ? 'bg-amber-500' :
    color === 'emerald' ? 'bg-emerald-500' :
    color === 'purple' ? 'bg-purple-500' : 'bg-accent-500'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        {showValue && <span className="text-gray-800 dark:text-gray-300 font-medium">{pct}%</span>}
      </div>
      <div className="h-2 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, title, children, className = '' }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={item} className={`glass rounded-xl p-5 space-y-4 ${className}`}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
          <Icon size={16} className="text-accent-500" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}

function MemoryBlock({ title, info, color }: { title: string; info: MemoryInfo; color: string }) {
  const usage = info.total > 0 ? info.used / info.total : 0
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{title}</div>
      <ProgressBar value={usage} label="使用率" color={color} />
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-gray-500">总量</div>
          <div className="text-gray-800 dark:text-gray-200 font-medium mt-0.5">{formatBytes(info.total)}</div>
        </div>
        <div>
          <div className="text-gray-500">已用</div>
          <div className="text-gray-800 dark:text-gray-200 font-medium mt-0.5">{formatBytes(info.used)}</div>
        </div>
        <div>
          <div className="text-gray-500">剩余</div>
          <div className="text-gray-800 dark:text-gray-200 font-medium mt-0.5">{formatBytes(info.free)}</div>
        </div>
      </div>
    </div>
  )
}

function DiskSection({ title, disks, icon: Icon }: { title: string; disks: DiskInfo[]; icon: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
        <Icon size={14} />
        {title}
      </div>
      {disks.length === 0 && <p className="text-xs text-gray-500">无数据</p>}
      {disks.map((d, i) => {
        const color = d.usage > 0.9 ? 'rose' : d.usage > 0.7 ? 'amber' : 'emerald'
        return (
          <div key={i}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-700 dark:text-gray-300 font-medium truncate mr-2">{d.name}</span>
              <span className="text-gray-500 shrink-0">{formatBytes(d.used)} / {formatBytes(d.total)}</span>
            </div>
            <ProgressBar value={d.usage} label="" color={color} showValue={true} />
          </div>
        )
      })}
    </div>
  )
}

const POLL_INTERVAL = 1000

export default function SystemOverview() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getSystemStats()
        setStats(res.data)
        setError('')
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败')
      }
    }
    fetchStats()
    timerRef.current = setInterval(fetchStats, POLL_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (!stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl mx-auto">
        {[1,2,3,4].map(i => (
          <div key={i} className="glass rounded-xl p-5 space-y-4">
            <div className="h-9 w-32 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse" />
            <div className="space-y-3">
              <div className="h-4 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
              <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full animate-pulse" />
              <div className="h-4 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-rose-400">{error}</p>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl mx-auto">
      <StatCard icon={FiClock} title="开机时间">
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{new Date(stats.bootTime).toLocaleString('zh-CN')}</p>
        <p className="text-xs text-gray-500 mt-1">已运行 {formatUptime(stats.uptime)}</p>
      </StatCard>

      <StatCard icon={FiCpu} title="CPU">
        <div className="space-y-3">
          <ProgressBar value={stats.cpuUsage} label={`总使用率 (${stats.cpuCores} 核)`} color="rose" />
          <div className="grid grid-cols-2 gap-2 pt-1">
            {stats.cpuPerCore.map((load, i) => {
              const pct = Math.round(load * 100)
              const color = pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-7 shrink-0">CPU{i}</span>
                  <div className="flex-1 h-1.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-gray-800 dark:text-gray-300 w-8 text-right font-medium">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </StatCard>

      <StatCard icon={FiServer} title="物理内存" className="lg:col-span-2">
        <MemoryBlock title="内存" info={stats.physicalMemory} color="amber" />
        <div className="border-t border-black/5 dark:border-white/5 pt-3 mt-3">
          <MemoryBlock title="Swap" info={stats.swapMemory} color="purple" />
        </div>
        <div className="border-t border-black/5 dark:border-white/5 pt-3 mt-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            <FiDatabase size={14} />
            JVM 堆内存
          </div>
          <ProgressBar value={stats.jvmTotalMemory > 0 ? stats.jvmUsedMemory / stats.jvmTotalMemory : 0} label="使用率" color="accent" />
          <div className="grid grid-cols-3 gap-2 text-xs mt-2">
            <div>
              <div className="text-gray-500">已分配</div>
              <div className="text-gray-800 dark:text-gray-200 font-medium mt-0.5">{formatBytes(stats.jvmTotalMemory)}</div>
            </div>
            <div>
              <div className="text-gray-500">已用</div>
              <div className="text-gray-800 dark:text-gray-200 font-medium mt-0.5">{formatBytes(stats.jvmUsedMemory)}</div>
            </div>
            <div>
              <div className="text-gray-500">最大</div>
              <div className="text-gray-800 dark:text-gray-200 font-medium mt-0.5">{formatBytes(stats.jvmMaxMemory)}</div>
            </div>
          </div>
        </div>
      </StatCard>

      <StatCard icon={FiHardDrive} title="磁盘">
        <DiskSection title="文件系统" disks={stats.fileSystems} icon={FiHardDrive} />
      </StatCard>

      <StatCard icon={FiHardDrive} title="物理磁盘">
        <DiskSection title="物理磁盘" disks={stats.physicalDisks} icon={FiHardDrive} />
      </StatCard>
    </motion.div>
  )
}
