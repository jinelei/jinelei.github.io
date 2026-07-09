import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiClock, FiCpu, FiServer, FiHardDrive, FiDatabase, FiActivity, FiArrowUp, FiArrowDown, FiTriangle } from 'react-icons/fi'
import { getSystemStats, getSystemUptime, getSystemLoad, getSystemCpu, getSystemMemory, getSystemDisk, getSystemProcesses } from '../api/system'
import type { SystemStats, DiskInfo } from '../types'

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
        {showValue && <motion.span key={pct} initial={{ opacity: 0.4, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="text-gray-800 dark:text-gray-300 font-medium">{pct}%</motion.span>}
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

function StatCard({ icon: Icon, title, children, className = '', onRefresh, loading }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; children: React.ReactNode; className?: string; onRefresh?: () => void; loading?: boolean }) {
  return (
    <motion.div variants={item} className={`glass rounded-xl p-5 flex flex-col ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
            <Icon size={16} className="text-accent-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          {loading && <span className="w-3 h-3 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg text-gray-500 hover:text-accent-400 hover:bg-white/5 transition-all cursor-pointer"
              title="刷新"
            >
              <FiActivity size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 mt-4 space-y-4">{children}</div>
    </motion.div>
  )
}

function MemoryBlock({ title, info, color }: { title: string; info: { total: number; used: number; free: number }; color: string }) {
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

type SortField = 'cpu' | 'memory' | 'pid' | 'name' | 'state'

const SORT_LABELS: Record<SortField, string> = {
  cpu: 'CPU',
  memory: '内存',
  pid: 'PID',
  name: '进程名',
  state: '状态',
}

const POLL_INTERVAL = 10000

interface BootInfo { bootTime: number; uptime: number }
interface LoadInfo { cpuCores: number; loadAverage1: number; loadAverage5: number; loadAverage15: number }
interface CpuInfo { cpuCores: number; totalCpuLoad: number; cpuPerCore: number[] }
interface MemInfo { physicalTotal: number; physicalUsed: number; physicalFree: number; swapTotal: number; swapUsed: number; swapFree: number; jvmTotal: number; jvmUsed: number; jvmMax: number }
interface DiskInfoData { fileSystems: DiskInfo[]; physicalDisks: DiskInfo[] }

export default function SystemOverview() {
  const [bootInfo, setBootInfo] = useState<BootInfo | null>(null)
  const [loadInfo, setLoadInfo] = useState<LoadInfo | null>(null)
  const [cpuInfo, setCpuInfo] = useState<CpuInfo | null>(null)
  const [memInfo, setMemInfo] = useState<MemInfo | null>(null)
  const [diskInfoData, setDiskInfoData] = useState<DiskInfoData | null>(null)
  const [processes, setProcesses] = useState<SystemStats['processes']>([])

  const [loading, setLoading] = useState(true)
  const [cardLoading, setCardLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('cpu')
  const [sortAsc, setSortAsc] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshAll = useCallback(async () => {
    try {
      const res = await getSystemStats()
      const d = res.data
      setBootInfo({ bootTime: d.bootTime, uptime: d.uptime })
      setLoadInfo({ cpuCores: d.cpuCores, loadAverage1: d.loadAverage[0], loadAverage5: d.loadAverage[1], loadAverage15: d.loadAverage[2] })
      setCpuInfo({ cpuCores: d.cpuCores, totalCpuLoad: d.cpuUsage, cpuPerCore: d.cpuPerCore })
      setMemInfo({
        physicalTotal: d.physicalMemory.total, physicalUsed: d.physicalMemory.used, physicalFree: d.physicalMemory.free,
        swapTotal: d.swapMemory.total, swapUsed: d.swapMemory.used, swapFree: d.swapMemory.free,
        jvmTotal: d.jvmTotalMemory, jvmUsed: d.jvmUsedMemory, jvmMax: d.jvmMaxMemory,
      })
      setDiskInfoData({ fileSystems: d.fileSystems, physicalDisks: d.physicalDisks })
      setProcesses(d.processes)
      setLastFetchTime(new Date().toLocaleTimeString('zh-CN'))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshBoot = useCallback(async () => {
    setCardLoading(p => ({ ...p, boot: true }))
    try { const res = await getSystemUptime(); setBootInfo(res.data) } catch { /* ignore */ }
    finally { setCardLoading(p => ({ ...p, boot: false })) }
  }, [])

  const refreshLoad = useCallback(async () => {
    setCardLoading(p => ({ ...p, load: true }))
    try { const res = await getSystemLoad(); setLoadInfo(res.data) } catch { /* ignore */ }
    finally { setCardLoading(p => ({ ...p, load: false })) }
  }, [])

  const refreshCpu = useCallback(async () => {
    setCardLoading(p => ({ ...p, cpu: true }))
    try { const res = await getSystemCpu(); setCpuInfo(res.data) } catch { /* ignore */ }
    finally { setCardLoading(p => ({ ...p, cpu: false })) }
  }, [])

  const refreshMem = useCallback(async () => {
    setCardLoading(p => ({ ...p, mem: true }))
    try { const res = await getSystemMemory(); setMemInfo(res.data) } catch { /* ignore */ }
    finally { setCardLoading(p => ({ ...p, mem: false })) }
  }, [])

  const refreshDisk = useCallback(async () => {
    setCardLoading(p => ({ ...p, disk: true }))
    try { const res = await getSystemDisk(); setDiskInfoData(res.data) } catch { /* ignore */ }
    finally { setCardLoading(p => ({ ...p, disk: false })) }
  }, [])

  const refreshProcesses = useCallback(async () => {
    setCardLoading(p => ({ ...p, processes: true }))
    try { const res = await getSystemProcesses(); setProcesses(res.data) } catch { /* ignore */ }
    finally { setCardLoading(p => ({ ...p, processes: false })) }
  }, [])

  useEffect(() => {
    const startPolling = () => {
      stopPolling()
      timerRef.current = setInterval(refreshAll, POLL_INTERVAL)
    }
    const stopPolling = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    refreshAll()
    startPolling()

    const onVisibility = () => {
      if (document.hidden) stopPolling()
      else refreshAll().then(startPolling)
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refreshAll])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(field === 'name' || field === 'state')
    }
  }

  const sortedProcesses = useMemo(() => {
    return [...processes].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'cpu': cmp = a.cpuUsage - b.cpuUsage; break
        case 'memory': cmp = a.memoryBytes - b.memoryBytes; break
        case 'pid': cmp = a.pid - b.pid; break
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'state': cmp = a.state.localeCompare(b.state); break
      }
      return sortAsc ? cmp : -cmp
    })
  }, [processes, sortField, sortAsc])

  if (loading) {
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

  if (error && !bootInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-rose-400">{error}</p>
      </div>
    )
  }

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl mx-auto">
        <StatCard icon={FiClock} title="开机时间" onRefresh={refreshBoot} loading={cardLoading.boot}>
          {bootInfo && (
            <>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{new Date(bootInfo.bootTime).toLocaleString('zh-CN')}</p>
              <p className="text-xs text-gray-500 mt-1">已运行 {formatUptime(bootInfo.uptime)}</p>
              <p className="text-xs text-gray-600 mt-2">上次刷新: {lastFetchTime}</p>
            </>
          )}
        </StatCard>

        <StatCard icon={FiActivity} title="系统负载" onRefresh={refreshLoad} loading={cardLoading.load}>
          {loadInfo && (
            <>
              {loadInfo.loadAverage1 >= 0 ? (
                <div className="flex gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">1 分钟</div>
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-0.5">{loadInfo.loadAverage1.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">5 分钟</div>
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-0.5">{loadInfo.loadAverage5.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">15 分钟</div>
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-0.5">{loadInfo.loadAverage15.toFixed(2)}</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">暂不支持</p>
              )}
              <p className="text-xs text-gray-500 mt-1">CPU 核心数: {loadInfo.cpuCores}</p>
            </>
          )}
        </StatCard>

        <StatCard icon={FiCpu} title="CPU" onRefresh={refreshCpu} loading={cardLoading.cpu}>
          {cpuInfo && (
            <div className="space-y-3">
              <ProgressBar value={cpuInfo.totalCpuLoad} label={`总使用率 (${cpuInfo.cpuCores} 核)`} color="rose" />
              <div className="space-y-5 pt-1">
                {cpuInfo.cpuPerCore.map((load, i) => {
                  const pct = Math.round(load * 100)
                  const color = pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 w-7 shrink-0">CPU{i}</span>
                      <div className="flex-1 h-2.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${color}`}
                          initial={false}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                      </div>
                      <motion.span
                        key={pct}
                        initial={{ opacity: 0.4, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="text-gray-800 dark:text-gray-300 w-10 text-right font-medium tabular-nums"
                      >{pct}%</motion.span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </StatCard>

        <StatCard icon={FiServer} title="物理内存" onRefresh={refreshMem} loading={cardLoading.mem}>
          {memInfo && (
            <>
              <MemoryBlock title="内存" info={{ total: memInfo.physicalTotal, used: memInfo.physicalUsed, free: memInfo.physicalFree }} color="amber" />
              <div className="border-t border-black/5 dark:border-white/5 pt-3 mt-3">
                <MemoryBlock title="Swap" info={{ total: memInfo.swapTotal, used: memInfo.swapUsed, free: memInfo.swapFree }} color="purple" />
              </div>
              <div className="border-t border-black/5 dark:border-white/5 pt-3 mt-3">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  <FiDatabase size={14} />
                  JVM 堆内存
                </div>
                <ProgressBar value={memInfo.jvmTotal > 0 ? memInfo.jvmUsed / memInfo.jvmTotal : 0} label="使用率" color="accent" />
                <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                  <div><div className="text-gray-500">已分配</div><div className="text-gray-800 dark:text-gray-200 font-medium mt-0.5">{formatBytes(memInfo.jvmTotal)}</div></div>
                  <div><div className="text-gray-500">已用</div><div className="text-gray-800 dark:text-gray-200 font-medium mt-0.5">{formatBytes(memInfo.jvmUsed)}</div></div>
                  <div><div className="text-gray-500">最大</div><div className="text-gray-800 dark:text-gray-200 font-medium mt-0.5">{formatBytes(memInfo.jvmMax)}</div></div>
                </div>
              </div>
            </>
          )}
        </StatCard>

        <StatCard icon={FiHardDrive} title="磁盘" onRefresh={refreshDisk} loading={cardLoading.disk}>
          {diskInfoData && (
            <>
              <DiskSection title="文件系统" disks={diskInfoData.fileSystems} icon={FiHardDrive} />
            </>
          )}
        </StatCard>

        <StatCard icon={FiHardDrive} title="物理磁盘" onRefresh={refreshDisk} loading={cardLoading.disk}>
          {diskInfoData && (
            <DiskSection title="物理磁盘" disks={diskInfoData.physicalDisks} icon={FiHardDrive} />
          )}
        </StatCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 max-w-4xl mx-auto mt-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
              <FiTriangle size={16} className="text-accent-500" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">进程 (Top 20)</h3>
          </div>
          <div className="flex items-center gap-1">
            {cardLoading.processes && <span className="w-3 h-3 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />}
            <button
              onClick={refreshProcesses}
              className="p-1.5 rounded-lg text-gray-500 hover:text-accent-400 hover:bg-white/5 transition-all cursor-pointer"
              title="刷新"
            >
              <FiActivity size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs table-fixed">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 select-none w-16" onClick={() => toggleSort('pid')}>
                  <div className="flex items-center gap-1">{SORT_LABELS.pid}{sortField === 'pid' && (sortAsc ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />)}</div>
                </th>
                <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 select-none" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">{SORT_LABELS.name}{sortField === 'name' && (sortAsc ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />)}</div>
                </th>
                <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 select-none w-36" onClick={() => toggleSort('cpu')}>
                  <div className="flex items-center gap-1">{SORT_LABELS.cpu}{sortField === 'cpu' && (sortAsc ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />)}</div>
                </th>
                <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 select-none w-28" onClick={() => toggleSort('memory')}>
                  <div className="flex items-center gap-1">{SORT_LABELS.memory}{sortField === 'memory' && (sortAsc ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />)}</div>
                </th>
                <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 select-none w-14" onClick={() => toggleSort('state')}>
                  <div className="flex items-center gap-1">{SORT_LABELS.state}{sortField === 'state' && (sortAsc ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />)}</div>
                </th>
                <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium w-20">用户</th>
              </tr>
            </thead>
            <tbody>
              {sortedProcesses.map((p, i) => (
                <tr
                  key={p.pid}
                  className={`border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 ${i % 2 === 0 ? 'bg-black/[0.02] dark:bg-white/[0.02]' : ''}`}
                >
                  <td className="py-1.5 px-2 text-gray-500 font-mono truncate">{p.pid}</td>
                  <td className="py-1.5 px-2 text-gray-800 dark:text-gray-200 truncate" title={p.name}>{p.name}</td>
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden max-w-[80px]">
                        <div
                          className={`h-full rounded-full ${p.cpuUsage > 0.8 ? 'bg-rose-500' : p.cpuUsage > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(p.cpuUsage * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-gray-800 dark:text-gray-300 font-medium tabular-nums">{(p.cpuUsage * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-gray-800 dark:text-gray-200 font-medium tabular-nums">{formatBytes(p.memoryBytes)}</td>
                  <td className="py-1.5 px-2">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      p.state === 'R' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      p.state === 'S' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                      p.state === 'D' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                      p.state === 'Z' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                      'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                      }`}>{p.state}</span></td>
                  <td className="py-1.5 px-2 text-gray-500 truncate">{p.user}</td>
                </tr>
              ))}
              {sortedProcesses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  )
}
