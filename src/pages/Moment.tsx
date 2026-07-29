import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  FiEdit, FiImage, FiFile, FiLock, FiUnlock, FiCopy, FiCheck,
  FiTrash2, FiEye, FiEyeOff, FiSend, FiSmartphone, FiMonitor,
  FiTerminal, FiClock, FiPaperclip, FiUpload, FiX,
  FiDownload,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getMomentList, createMoment, uploadMomentFile, toggleLock, deleteMoment, getFileBlob, downloadFile, getCalendarStats } from '../api/moment'
import type { MomentResponse, PageResponse, DailyCount } from '../types'

import CalendarHeatmap from '../components/CalendarHeatmap'

type InputTab = 'TEXT' | 'IMAGE' | 'FILE'

function detectTerminalType(): string {
  const ua = navigator.userAgent
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return 'MOBILE'
  return 'WEB'
}

function formatTime(ts: string): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const tabs: { key: InputTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'TEXT', label: '文本', icon: FiEdit },
  { key: 'IMAGE', label: '图片', icon: FiImage },
  { key: 'FILE', label: '文件', icon: FiFile },
]

function AuthImg({ id, alt, className }: { id: number; alt?: string; className?: string }) {
  const [src, setSrc] = useState<string>('')
  useEffect(() => {
    const url = `__scalefish_auth_img_${id}`
    let blobUrl = srcCache.get(url)
    if (blobUrl) { setSrc(blobUrl); return }
    getFileBlob(id).then(blob => {
      blobUrl = URL.createObjectURL(blob)
      srcCache.set(url, blobUrl)
      setSrc(blobUrl)
    }).catch(() => setSrc(''))
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  return src ? <img src={src} alt={alt || ''} className={className} /> : null
}

const srcCache = new Map<string, string>()

export default function Moment() {
  const [tab, setTab] = useState<InputTab>('TEXT')
  const [textContent, setTextContent] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [list, setList] = useState<MomentResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set())
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth())
  const [calendarData, setCalendarData] = useState<DailyCount[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const loadList = async (p = 0) => {
    setLoading(true)
    try {
      const res = await getMomentList(p, 20, selectedDate || undefined)
      const data: PageResponse<MomentResponse> = res.data
      setList(data.content)
      setPage(data.currentPage)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
    } catch {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadList(0) }, [selectedDate])

  useEffect(() => {
    getCalendarStats(calendarYear).then(res => setCalendarData(res.data)).catch(() => {})
  }, [calendarYear])

  const resetInput = () => {
    setTextContent('')
    setIsLocked(false)
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null)
      setFilePreview(null)
      return
    }
    setSelectedFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setFilePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleSubmit = async () => {
    if (tab === 'TEXT') {
      if (!textContent.trim()) {
        toast.error('请输入内容')
        return
      }
      setSubmitting(true)
      try {
        await createMoment({
          content: textContent,
          contentType: 'TEXT',
          terminalType: detectTerminalType(),
          isLocked,
          displayContent: isLocked ? '******' : undefined,
        })
        toast.success('已添加')
        resetInput()
        loadList(0)
      } catch {
        toast.error('添加失败')
      } finally {
        setSubmitting(false)
      }
    } else {
      if (!selectedFile) {
        toast.error('请选择文件')
        return
      }
      setSubmitting(true)
      try {
        await uploadMomentFile(
          selectedFile,
          detectTerminalType(),
          isLocked,
          isLocked ? '******' : undefined,
        )
        toast.success('已添加')
        resetInput()
        loadList(0)
      } catch {
        toast.error('上传失败')
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleToggleLock = async (item: MomentResponse) => {
    try {
      const newLocked = !item.isLocked
      await toggleLock(item.id, newLocked, newLocked ? '******' : '')
      loadList(page)
    } catch {
      toast.error('操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteMoment(id)
      toast.success('已删除')
      loadList(page)
    } catch {
      toast.error('删除失败')
    }
  }

  const handleCopyText = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
      toast.success('已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  const handleCopyImage = async (id: number) => {
    try {
      const blob = await getFileBlob(id)
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ])
      toast.success('图片已复制')
    } catch {
      toast.error('复制图片失败')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === 'NumpadEnter') && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const terminalIcon = (type: string) => {
    switch (type) {
      case 'MOBILE': return <FiSmartphone size={12} />
      case 'API': return <FiTerminal size={12} />
      default: return <FiMonitor size={12} />
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto pb-8">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* --- Left Column: Input + Calendar (30%) --- */}
        <div className="w-full lg:w-[30%] space-y-4 shrink-0">
          <motion.div variants={itemAnim} className="glass rounded-xl border border-white/5 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); resetInput() }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                    tab === t.key
                      ? 'text-accent-400 bg-accent-500/10 border-b-2 border-accent-500'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div className="p-3 space-y-2">
              {tab === 'TEXT' && (
                <textarea
                  ref={textareaRef}
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="记录点什么… (Ctrl+Enter 提交)"
                  rows={4}
                  className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none outline-none border-none"
                />
              )}

              {(tab === 'IMAGE' || tab === 'FILE') && (
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-accent-500/50 transition-colors"
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      {filePreview ? (
                        <img src={filePreview} alt="preview" className="max-h-24 mx-auto rounded-lg object-contain" />
                      ) : (
                        <div className="w-10 h-10 mx-auto rounded-xl bg-accent-500/10 flex items-center justify-center">
                          <FiPaperclip size={18} className="text-accent-400" />
                        </div>
                      )}
                      <p className="text-xs text-gray-300 truncate">{selectedFile.name}</p>
                      <button
                        onClick={e => { e.stopPropagation(); resetInput() }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        移除
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <FiUpload size={20} className="mx-auto text-gray-600" />
                      <p className="text-xs text-gray-500">点击或拖拽{tab === 'IMAGE' ? '图片' : '文件'}到此处</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={tab === 'IMAGE' ? 'image/*' : undefined}
                    onChange={e => handleFileSelect(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isLocked}
                    onChange={e => setIsLocked(e.target.checked)}
                    className="accent-accent-500 w-3 h-3"
                  />
                  {isLocked ? <FiLock size={10} /> : <FiUnlock size={10} />}
                  锁定
                </label>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-medium rounded-lg transition-all duration-200 cursor-pointer"
                >
                  <FiSend size={11} />
                  {submitting ? '提交中…' : '新增'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* --- Calendar Heatmap --- */}
          <CalendarHeatmap
            data={calendarData}
            year={calendarYear}
            month={calendarMonth}
            selectedDate={selectedDate}
            onPrevMonth={() => {
              if (calendarMonth === 0) {
                setCalendarMonth(11)
                setCalendarYear(y => y - 1)
              } else {
                setCalendarMonth(m => m - 1)
              }
            }}
            onNextMonth={() => {
              if (calendarMonth === 11) {
                setCalendarMonth(0)
                setCalendarYear(y => y + 1)
              } else {
                setCalendarMonth(m => m + 1)
              }
            }}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* --- Right Column: List (70%) --- */}
        <div className="flex-1 min-w-0">
          <motion.div variants={itemAnim} className="space-y-2">
            <div className="flex items-center justify-between px-1 h-5">
              <span className="text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="text-accent-400 font-medium">{selectedDate}</span>
                  的时刻 · 共 {totalElements} 条
                  <button
                    onClick={() => setSelectedDate(todayStr)}
                    className="text-gray-600 hover:text-gray-300 transition-colors cursor-pointer p-0.5"
                    title="回到今天"
                  >
                    <FiX size={12} />
                  </button>
                </span>
              </span>
            </div>

            <div className="min-h-[200px]">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="glass rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-white/5 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px]">
                <FiEdit size={36} className="text-gray-600 mb-3" />
                <p className="text-sm text-gray-500">暂无时刻数据</p>
                <p className="text-xs text-gray-600 mt-1">在上方输入内容开始记录</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {list.map(item => {
                const isRevealed = revealedIds.has(item.id)
                const displayText = item.isLocked && !isRevealed
                  ? (item.displayContent || '******')
                  : item.content

                return (
                  <motion.div
                    key={item.id}
                    variants={itemAnim}
                    className="glass rounded-xl border border-white/5 p-4 hover:border-white/10 transition-all duration-200 group"
                  >
                    <div className="flex gap-3">
                      {/* Content type icon */}
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-accent-500/10 flex items-center justify-center">
                        {item.contentType === 'IMAGE' ? (
                          <FiImage size={16} className="text-accent-400" />
                        ) : item.contentType === 'FILE' ? (
                          <FiFile size={16} className="text-accent-400" />
                        ) : (
                          <FiEdit size={16} className="text-accent-400" />
                        )}
                      </div>

                      {/* Content body */}
                      <div className="flex-1 min-w-0">
                        {/* Image preview */}
                        {item.contentType === 'IMAGE' && item.filePath && (
                          <div className="mb-2">
                            {(isRevealed || !item.isLocked) ? (
                              <AuthImg
                                id={item.id}
                                alt={item.fileName || '图片'}
                                className="max-h-48 rounded-lg object-contain bg-black/20"
                              />
                            ) : (
                              <div className="h-24 rounded-lg bg-black/20 flex items-center justify-center text-xs text-gray-500">
                                ******
                              </div>
                            )}
                          </div>
                        )}

                        {/* File info */}
                        {item.contentType === 'FILE' && (
                          <div className="mb-2 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 text-xs">
                            <FiPaperclip size={14} className="text-accent-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-gray-300 truncate">{item.fileName || item.content}</p>
                              {item.fileSize && (
                                <p className="text-gray-500">{formatFileSize(item.fileSize)}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Text content */}
                        {item.contentType === 'TEXT' || (item.contentType !== 'IMAGE' && item.contentType !== 'FILE') ? (
                          <p className="text-sm text-gray-200 break-all whitespace-pre-wrap">
                            {displayText}
                          </p>
                        ) : null}

                        {/* Meta + Actions row */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 text-[11px] text-gray-500">
                            <span className="flex items-center gap-1">
                              <FiClock size={10} />
                              {formatTime(item.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              {terminalIcon(item.terminalType)}
                              {item.terminalType === 'MOBILE' ? '移动端' : item.terminalType === 'API' ? 'API' : '网页'}
                            </span>
                            {item.isLocked && (
                              <span className="flex items-center gap-1 text-amber-500">
                                <FiLock size={10} />
                                已锁定
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5">
                            {item.isLocked && (
                              <button
                                onClick={() => setRevealedIds(prev => {
                                  const next = new Set(prev)
                                  if (next.has(item.id)) next.delete(item.id)
                                  else next.add(item.id)
                                  return next
                                })}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-accent-400 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                                title={isRevealed ? '隐藏' : '查看'}
                              >
                                {isRevealed ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleLock(item)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                              title={item.isLocked ? '解锁' : '锁定'}
                            >
                              {item.isLocked ? <FiUnlock size={14} /> : <FiLock size={14} />}
                            </button>
                            {item.contentType === 'IMAGE' && item.filePath ? (
                              <>
                                <button
                                  onClick={() => handleCopyImage(item.id)}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-accent-400 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                                  title="复制图片"
                                >
                                  <FiCopy size={14} />
                                </button>
                                <button
                                  onClick={() => downloadFile(item.id)}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-accent-400 hover:bg-white/5 transition-all duration-200 cursor-pointer block"
                                  title="下载图片"
                                >
                                  <FiDownload size={14} />
                                </button>
                              </>
                            ) : item.contentType === 'FILE' && item.filePath ? (
                              <button
                                onClick={() => downloadFile(item.id)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-accent-400 hover:bg-white/5 transition-all duration-200 cursor-pointer block"
                                title="下载文件"
                              >
                                <FiDownload size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (item.isLocked && !isRevealed) {
                                    setRevealedIds(prev => new Set(prev).add(item.id))
                                    setTimeout(() => handleCopyText(item.content, item.id), 100)
                                  } else {
                                    handleCopyText(item.content, item.id)
                                  }
                                }}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-accent-400 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                                title="复制"
                              >
                                {copiedId === item.id ? (
                                  <FiCheck size={14} className="text-green-400" />
                                ) : (
                                  <FiCopy size={14} />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                              title="删除"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  disabled={page <= 0}
                  onClick={() => loadList(page - 1)}
                  className="px-4 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                >
                  上一页
                </button>
                <span className="text-xs text-gray-500">
                  {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => loadList(page + 1)}
                  className="px-4 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
            </div>
          </motion.div>
        </div>
      </div>


    </motion.div>
  )
}
