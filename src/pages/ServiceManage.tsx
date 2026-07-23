import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiServer, FiRefreshCw, FiPlay, FiSquare, FiRotateCcw, FiPlus, FiCopy, FiEdit2, FiTrash2, FiChevronDown, FiExternalLink, FiGrid, FiList } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getServiceConfigs, createServiceConfig, updateServiceConfig, deleteServiceConfig, executeStatus, executeStart, executeStop, executeRestart, executeLog } from '../api/system-services'
import type { ServiceConfigResponse, ServiceConfigRequest, ScriptExecuteResponse } from '../types'
import Modal from '../components/Modal'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

type RunningAction = 'status' | 'start' | 'stop' | 'restart' | 'log' | null

export default function ServiceManage() {
  const [services, setServices] = useState<ServiceConfigResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState<Record<number, ScriptExecuteResponse | null>>({})
  const [logs, setLogs] = useState<Record<number, ScriptExecuteResponse | null>>({})
  const [runningActions, setRunningActions] = useState<Record<number, RunningAction>>({})
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceConfigResponse | null>(null)
  const [formData, setFormData] = useState<ServiceConfigRequest>({ name: '' })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [logOpen, setLogOpen] = useState<Record<number, boolean>>({})
  const [logLoaded, setLogLoaded] = useState<Record<number, boolean>>({})
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getServiceConfigs()
      setServices(res.data)
      return res.data
    } catch {
      toast.error('加载服务配置失败')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStatus = useCallback(async (svc: ServiceConfigResponse) => {
    if (!svc.statusScript) return
    setRunningActions(prev => ({ ...prev, [svc.id]: 'status' }))
    try {
      const res = await executeStatus(svc.id)
      setStatuses(prev => ({ ...prev, [svc.id]: res.data }))
    } catch {
      setStatuses(prev => ({ ...prev, [svc.id]: { output: '查询失败', exitCode: -1 } }))
    } finally {
      setRunningActions(prev => ({ ...prev, [svc.id]: null }))
    }
  }, [])

  useEffect(() => {
    fetchServices().then(list => {
      list.forEach(svc => fetchStatus(svc))
    })
  }, [fetchServices, fetchStatus])

  const fetchLog = useCallback(async (svc: ServiceConfigResponse) => {
    if (!svc.logScript) {
      setLogs(prev => ({ ...prev, [svc.id]: { output: '未配置日志查询命令', exitCode: -1 } }))
      return
    }
    setRunningActions(prev => ({ ...prev, [svc.id]: 'log' }))
    try {
      const res = await executeLog(svc.id)
      setLogs(prev => ({ ...prev, [svc.id]: res.data }))
    } catch {
      setLogs(prev => ({ ...prev, [svc.id]: { output: '日志查询失败', exitCode: -1 } }))
    } finally {
      setRunningActions(prev => ({ ...prev, [svc.id]: null }))
      setLogLoaded(prev => ({ ...prev, [svc.id]: true }))
    }
  }, [])

  const statusText = (s: ScriptExecuteResponse) => {
    const firstLine = s.output.split('\n').find(l => l.trim())
    return firstLine || s.output || '(无输出)'
  }

  const handleAction = async (id: number, action: 'start' | 'stop' | 'restart') => {
    setRunningActions(prev => ({ ...prev, [id]: action }))
    try {
      const fn = action === 'start' ? executeStart : action === 'stop' ? executeStop : executeRestart
      const res = await fn(id)
      setStatuses(prev => ({ ...prev, [id]: res.data }))
      const actionLabel = action === 'start' ? '启动' : action === 'stop' ? '停止' : '重启'
      if (res.data.exitCode === 0) {
        toast.success(`${actionLabel}成功`)
      } else {
        toast.error(`${actionLabel}失败`)
      }
    } catch {
      toast.error('操作失败')
    } finally {
      setRunningActions(prev => ({ ...prev, [id]: null }))
    }
  }

  const openCreate = () => {
    setEditing(null)
    setFormData({ name: '' })
    setFormOpen(true)
  }

  const openEdit = (svc: ServiceConfigResponse) => {
    setEditing(svc)
    setFormData({
      name: svc.name,
      statusScript: svc.statusScript || '',
      statusArgs: svc.statusArgs || '',
      startScript: svc.startScript || '',
      startArgs: svc.startArgs || '',
      stopScript: svc.stopScript || '',
      stopArgs: svc.stopArgs || '',
      restartScript: svc.restartScript || '',
      restartArgs: svc.restartArgs || '',
      logScript: svc.logScript || '',
      logArgs: svc.logArgs || '',
      url: svc.url || '',
      description: svc.description || '',
      sortOrder: svc.sortOrder ?? undefined,
    })
    setFormOpen(true)
  }

  const handleDelete = async (svc: ServiceConfigResponse) => {
    if (!confirm(`确认删除服务「${svc.name}」？`)) return
    try {
      await deleteServiceConfig(svc.id)
      toast.success('已删除')
      setServices(prev => prev.filter(s => s.id !== svc.id))
    } catch {
      toast.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('服务名称不能为空')
      return
    }
    setFormSubmitting(true)
    try {
      if (editing) {
        const res = await updateServiceConfig(editing.id, formData)
        setServices(prev => prev.map(s => s.id === editing.id ? res.data : s))
        toast.success('服务已更新')
      } else {
        const res = await createServiceConfig(formData)
        setServices(prev => [...prev, res.data])
        fetchStatus(res.data)
        toast.success('服务已创建')
      }
      setFormOpen(false)
    } catch {
      toast.error(editing ? '更新失败' : '创建失败')
    } finally {
      setFormSubmitting(false)
    }
  }

  const updateField = (field: keyof ServiceConfigRequest, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">服务管理</h2>
        <div className="flex items-center gap-1 bg-surface-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-accent-500/20 text-accent-400' : 'text-gray-400 hover:text-gray-200'}`}
            title="图块布局"
          >
            <FiGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-accent-500/20 text-accent-400' : 'text-gray-400 hover:text-gray-200'}`}
            title="列表布局"
          >
            <FiList size={16} />
          </button>
        </div>
      </div>
      {loading && services.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass rounded-xl p-4 space-y-3">
              <div className="h-5 w-28 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse" />
              <div className="h-16 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse" />
              <div className="flex gap-2">
                <div className="h-7 w-14 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse" />
                <div className="h-7 w-14 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-20 text-center">
          <FiServer size={40} className="text-gray-600 mb-3" />
          <p className="text-sm text-gray-500">暂无服务配置</p>
          <p className="text-xs text-gray-600 mt-1">点击下方图块新增</p>
        </motion.div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {services.map(svc => {
            const action = runningActions[svc.id]
            const status = statuses[svc.id]
            const isActive = status !== null && status !== undefined && status.exitCode === 0
            return (
              <motion.div key={svc.id} variants={item} className="glass rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${action === 'status' ? 'bg-yellow-400 animate-pulse' : status ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{svc.name}</h3>
                    {svc.url && (
                      <a
                        href={svc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="shrink-0 text-gray-400 hover:text-accent-400 transition-colors"
                        title="打开服务地址"
                      >
                        <FiExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => fetchStatus(svc)}
                      disabled={!!action}
                      className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
                      title="刷新状态"
                    >
                      <FiRefreshCw size={13} className={action === 'status' ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={() => {
                        setEditing(null)
                        setFormData({
                          name: '',
                          statusScript: svc.statusScript || '',
                          statusArgs: svc.statusArgs || '',
                          startScript: svc.startScript || '',
                          startArgs: svc.startArgs || '',
                          stopScript: svc.stopScript || '',
                          stopArgs: svc.stopArgs || '',
                          restartScript: svc.restartScript || '',
                          restartArgs: svc.restartArgs || '',
                          logScript: svc.logScript || '',
                          logArgs: svc.logArgs || '',
                          url: svc.url || '',
                          description: svc.description || '',
                          sortOrder: svc.sortOrder ?? undefined,
                        })
                        setFormOpen(true)
                      }}
                      className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
                      title="复制配置"
                    >
                      <FiCopy size={13} />
                    </button>
                    <button
                      onClick={() => openEdit(svc)}
                      className="p-1.5 rounded hover:bg-white/10 text-accent-400 hover:text-accent-300 transition-colors"
                      title="编辑"
                    >
                      <FiEdit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(svc)}
                      className="p-1.5 rounded hover:bg-white/10 text-rose-400 hover:text-rose-300 transition-colors"
                      title="删除"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {action === 'status' ? (
                    <span className="text-xs text-gray-500 animate-pulse">查询中...</span>
                  ) : status ? (
                    <span className="text-xs text-green-400 font-mono truncate max-w-full" title={status.output}>
                      {statusText(status)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">未查询</span>
                  )}
                </div>

                {svc.description && (
                  <p className="text-xs text-gray-500 leading-relaxed">{svc.description}</p>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!logLoaded[svc.id]) fetchLog(svc)
                        setLogOpen(prev => ({ ...prev, [svc.id]: !prev[svc.id] }))
                      }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <FiChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${logOpen[svc.id] ? 'rotate-0' : '-rotate-90'}`}
                      />
                      {logOpen[svc.id] ? '收起日志' : '查看日志'}
                    </button>
                    {logLoaded[svc.id] && svc.logScript && (
                      <button
                        onClick={() => fetchLog(svc)}
                        disabled={runningActions[svc.id] === 'log'}
                        className="p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
                        title="刷新日志"
                      >
                        <FiRefreshCw size={11} className={runningActions[svc.id] === 'log' ? 'animate-spin' : ''} />
                      </button>
                    )}
                  </div>
                  {logOpen[svc.id] && (
                    <div className="mt-2 bg-black/20 dark:bg-white/5 rounded-lg p-3 max-h-[160px] overflow-y-auto">
                      {runningActions[svc.id] === 'log' ? (
                        <p className="text-xs text-gray-500 animate-pulse">查询中...</p>
                      ) : logs[svc.id] ? (
                        <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap break-all leading-relaxed">
                          {logs[svc.id]!.output || '(无输出)'}
                        </pre>
                      ) : (
                        <p className="text-xs text-gray-500">点击「查看日志」查询</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isActive && (
                    <button
                      onClick={() => handleAction(svc.id, 'start')}
                      disabled={!!action || !svc.startScript}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {action === 'start' ? <FiRefreshCw size={13} className="animate-spin" /> : <FiPlay size={13} />}
                      {action === 'start' ? '启动中...' : '启动'}
                    </button>
                  )}
                  {isActive && (
                    <>
                      <button
                        onClick={() => handleAction(svc.id, 'stop')}
                        disabled={!!action}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {action === 'stop' ? <FiRefreshCw size={13} className="animate-spin" /> : <FiSquare size={13} />}
                        {action === 'stop' ? '停止中...' : '停止'}
                      </button>
                      <button
                        onClick={() => handleAction(svc.id, 'restart')}
                        disabled={!!action}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-600/30 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {action === 'restart' ? <FiRefreshCw size={13} className="animate-spin" /> : <FiRotateCcw size={13} />}
                        {action === 'restart' ? '重启中...' : '重启'}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
          <motion.div
            variants={item}
            onClick={openCreate}
            className="glass rounded-xl px-5 py-3 flex items-center gap-3 cursor-pointer border-2 border-dashed border-white/10 hover:border-accent-500/50 hover:bg-accent-500/5 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center shrink-0">
              <FiPlus size={16} className="text-accent-400" />
            </div>
            <span className="text-sm font-medium text-gray-400">新增服务</span>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map(svc => {
            const action = runningActions[svc.id]
            const status = statuses[svc.id]
            const isActive = status !== null && status !== undefined && status.exitCode === 0
            return (
              <motion.div key={svc.id} variants={item}>
                <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${action === 'status' ? 'bg-yellow-400 animate-pulse' : status ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <div className="flex items-center gap-1.5 min-w-0 w-36 shrink-0">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{svc.name}</span>
                    {svc.url && (
                      <a href={svc.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="shrink-0 text-gray-400 hover:text-accent-400 transition-colors" title="打开服务地址">
                        <FiExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <div className="min-w-0 w-32 shrink-0">
                    {action === 'status' ? (
                      <span className="text-xs text-gray-500 animate-pulse">查询中...</span>
                    ) : status ? (
                      <span className="text-xs text-green-400 font-mono truncate block" title={status.output}>{statusText(status)}</span>
                    ) : (
                      <span className="text-xs text-gray-500">未查询</span>
                    )}
                  </div>
                  {svc.description && (
                    <p className="text-xs text-gray-500 truncate min-w-0 w-40 shrink-0 hidden lg:block">{svc.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto shrink-0">
                    <button onClick={() => fetchStatus(svc)} disabled={!!action} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50" title="刷新状态">
                      <FiRefreshCw size={12} className={action === 'status' ? 'animate-spin' : ''} />
                    </button>
                    {!isActive && svc.startScript && (
                      <button onClick={() => handleAction(svc.id, 'start')} disabled={!!action} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 text-xs font-medium transition-colors disabled:opacity-50">
                        {action === 'start' ? <FiRefreshCw size={11} className="animate-spin" /> : <FiPlay size={11} />}
                        {action === 'start' ? '启动中' : '启动'}
                      </button>
                    )}
                    {isActive && (
                      <>
                        <button onClick={() => handleAction(svc.id, 'stop')} disabled={!!action} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 text-xs font-medium transition-colors disabled:opacity-50">
                          {action === 'stop' ? <FiRefreshCw size={11} className="animate-spin" /> : <FiSquare size={11} />}
                          {action === 'stop' ? '停止中' : '停止'}
                        </button>
                        <button onClick={() => handleAction(svc.id, 'restart')} disabled={!!action} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-600/30 text-xs font-medium transition-colors disabled:opacity-50">
                          {action === 'restart' ? <FiRefreshCw size={11} className="animate-spin" /> : <FiRotateCcw size={11} />}
                          {action === 'restart' ? '重启中' : '重启'}
                        </button>
                      </>
                    )}
                    <div className="w-px h-5 bg-white/10 mx-1" />
                    <button onClick={() => { setEditing(null); setFormData({ name: '', statusScript: svc.statusScript || '', statusArgs: svc.statusArgs || '', startScript: svc.startScript || '', startArgs: svc.startArgs || '', stopScript: svc.stopScript || '', stopArgs: svc.stopArgs || '', restartScript: svc.restartScript || '', restartArgs: svc.restartArgs || '', logScript: svc.logScript || '', logArgs: svc.logArgs || '', url: svc.url || '', description: svc.description || '', sortOrder: svc.sortOrder ?? undefined }); setFormOpen(true) }} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors" title="复制配置">
                      <FiCopy size={12} />
                    </button>
                    <button onClick={() => openEdit(svc)} className="p-1.5 rounded hover:bg-white/10 text-accent-400 hover:text-accent-300 transition-colors" title="编辑">
                      <FiEdit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(svc)} className="p-1.5 rounded hover:bg-white/10 text-rose-400 hover:text-rose-300 transition-colors" title="删除">
                      <FiTrash2 size={12} />
                    </button>
                    {svc.logScript && (
                      <button onClick={() => { if (!logLoaded[svc.id]) fetchLog(svc); setLogOpen(prev => ({ ...prev, [svc.id]: !prev[svc.id] })) }} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                        <FiChevronDown size={12} className={`transition-transform duration-200 ${logOpen[svc.id] ? 'rotate-0' : '-rotate-90'}`} />
                        日志
                      </button>
                    )}
                  </div>
                </div>
                {logOpen[svc.id] && (
                  <div className="mt-1 mx-5 mb-3 bg-black/20 dark:bg-white/5 rounded-lg p-3 max-h-[160px] overflow-y-auto">
                    {runningActions[svc.id] === 'log' ? (
                      <p className="text-xs text-gray-500 animate-pulse">查询中...</p>
                    ) : logs[svc.id] ? (
                      <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap break-all leading-relaxed">
                        {logs[svc.id]!.output || '(无输出)'}
                      </pre>
                    ) : (
                      <p className="text-xs text-gray-500">点击「日志」查询</p>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
          <motion.div variants={item} onClick={openCreate} className="glass rounded-xl px-5 py-3 flex items-center gap-3 cursor-pointer border-2 border-dashed border-white/10 hover:border-accent-500/50 hover:bg-accent-500/5 transition-all">
            <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center shrink-0">
              <FiPlus size={16} className="text-accent-400" />
            </div>
            <span className="text-sm font-medium text-gray-400">新增服务</span>
          </motion.div>
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? '编辑服务' : '新增服务'} size="lg">
        <form onSubmit={e => { e.preventDefault(); handleSubmit() }} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">服务名称 *</label>
            <input
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
              placeholder="例如: Nginx"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">状态查询脚本</label>
              <input
                value={formData.statusScript || ''}
                onChange={e => updateField('statusScript', e.target.value)}
                className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
                placeholder="systemctl status"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">状态查询参数</label>
              <input
                value={formData.statusArgs || ''}
                onChange={e => updateField('statusArgs', e.target.value)}
                className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
                placeholder="nginx"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">启动脚本</label>
              <input
                value={formData.startScript || ''}
                onChange={e => updateField('startScript', e.target.value)}
                className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
                placeholder="systemctl start"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">启动参数</label>
              <input
                value={formData.startArgs || ''}
                onChange={e => updateField('startArgs', e.target.value)}
                className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
                placeholder="nginx"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">停止脚本</label>
              <input
                value={formData.stopScript || ''}
                onChange={e => updateField('stopScript', e.target.value)}
                className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
                placeholder="systemctl stop"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">停止参数</label>
              <input
                value={formData.stopArgs || ''}
                onChange={e => updateField('stopArgs', e.target.value)}
                className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
                placeholder="nginx"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">重启脚本</label>
              <input
                value={formData.restartScript || ''}
                onChange={e => updateField('restartScript', e.target.value)}
                className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
                placeholder="systemctl restart"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">重启参数</label>
              <input
                value={formData.restartArgs || ''}
                onChange={e => updateField('restartArgs', e.target.value)}
                className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
                placeholder="nginx"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">日志查询脚本</label>
              <input
                value={formData.logScript || ''}
                onChange={e => updateField('logScript', e.target.value)}
                className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
                placeholder="journalctl -u"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">日志查询参数</label>
              <input
                value={formData.logArgs || ''}
                onChange={e => updateField('logArgs', e.target.value)}
                className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
                placeholder="nginx"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">服务地址</label>
            <input
              value={formData.url || ''}
              onChange={e => updateField('url', e.target.value)}
              className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
              placeholder="https://example.com（可选）"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">排序序号</label>
            <input
              type="number"
              value={formData.sortOrder ?? ''}
              onChange={e => updateField('sortOrder', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
              placeholder="可选"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">说明</label>
            <textarea
              value={formData.description || ''}
              onChange={e => updateField('description', e.target.value)}
              className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors resize-none"
              rows={2}
              placeholder="服务说明（可选）"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={formSubmitting} className="flex-1 bg-accent-600 hover:bg-accent-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {formSubmitting ? '保存中...' : editing ? '更新' : '创建'}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className="px-4 bg-surface-700 hover:bg-surface-600 text-gray-300 rounded-lg py-2 text-sm transition-colors">取消</button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}
