import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  FiGrid, FiList, FiPaperclip, FiMousePointer,
  FiBookmark, FiColumns, FiPlus,
  FiAlignJustify, FiLayout, FiCheckSquare, FiSquare,
} from 'react-icons/fi'
import { recordClick } from '../api/bookmarks'
import type { BookmarkResponse } from '../types'

export type ViewMode = 'grid' | 'list' | 'compact'

interface BookmarkViewProps {
  bookmarks: BookmarkResponse[]
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  loading: boolean
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  onPin: (id: number) => Promise<void>
  onClick?: (id: number) => void
  emptyMessage?: string
  storageKey: string
  prepend?: ReactNode
  renderActions?: (bookmark: BookmarkResponse) => ReactNode
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  onAdd?: () => void
  totalElements?: number
  title?: string
  batchMode?: boolean
  selectedIds?: Set<number>
  onToggleSelect?: (id: number) => void
  onBatchToggle?: () => void
}

const containerAnim = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const viewModeOptions: { mode: ViewMode; icon: typeof FiGrid; title: string }[] = [
  { mode: 'grid', icon: FiGrid, title: '图块视图' },
  { mode: 'list', icon: FiList, title: '列表视图' },
  { mode: 'compact', icon: FiAlignJustify, title: '紧凑视图' },
]

const gridColsOptions = [
  { cols: 2, label: '2列' },
  { cols: 3, label: '3列' },
  { cols: 4, label: '4列' },
]

const gridClasses: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

const masonryClasses: Record<number, string> = {
  2: 'columns-1 sm:columns-2',
  3: 'columns-1 sm:columns-2 lg:columns-3',
  4: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4',
}

export default function BookmarkView({
  bookmarks,
  viewMode,
  onViewModeChange,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  onPin,
  onClick,
  emptyMessage,
  storageKey,
  prepend,
  renderActions,
  pageSize,
  onPageSizeChange,
  onAdd,
  totalElements,
  title,
  batchMode,
  selectedIds,
  onToggleSelect,
  onBatchToggle,
}: BookmarkViewProps) {
  const initialRender = useRef(true)
  const [gridCols, setGridCols] = useState<number>(() => {
    const saved = localStorage.getItem(`${storageKey}GridCols`)
    return saved ? Number(saved) : 2
  })
  const [masonry, setMasonry] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${storageKey}Masonry`)
    return saved === 'true'
  })
  const [showColsMenu, setShowColsMenu] = useState(false)
  const colsMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false
      return
    }
    localStorage.setItem(storageKey, viewMode)
  }, [viewMode, storageKey])

  useEffect(() => {
    localStorage.setItem(`${storageKey}GridCols`, String(gridCols))
  }, [gridCols, storageKey])

  useEffect(() => {
    localStorage.setItem(`${storageKey}Masonry`, String(masonry))
  }, [masonry, storageKey])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colsMenuRef.current && !colsMenuRef.current.contains(e.target as Node)) {
        setShowColsMenu(false)
      }
    }
    if (showColsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showColsMenu])

  const handleClick = async (id: number) => {
    if (onClick) {
      onClick(id)
    } else {
      try {
        await recordClick(id)
      } catch {
        // silently ignore
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {title && (
            <h2 className="text-sm font-semibold text-gray-300 truncate shrink-0">
              {title}
            </h2>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs leading-none text-neon-400 hover:text-neon-300 hover:bg-white/5 transition-colors whitespace-nowrap"
              title="新增书签"
            >
              <FiPlus size={16} />
              <span className="hidden sm:inline">新增</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
        {onBatchToggle && (
          <button
            onClick={onBatchToggle}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs leading-none font-medium transition-colors mr-1 ${batchMode ? 'bg-amber-500/20 text-amber-400' : 'text-amber-400 hover:text-amber-300 hover:bg-white/5'}`}
            title={batchMode ? '退出批量编辑' : '批量编辑'}
          >
            <FiCheckSquare size={14} />
            <span className="hidden sm:inline">{batchMode ? '退出' : '批量编辑'}</span>
          </button>
        )}
        {viewModeOptions.map(({ mode, icon: Icon, title }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === mode
                ? 'bg-accent-500/20 text-accent-400'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
            title={title}
          >
            <Icon size={14} />
          </button>
        ))}

        {viewMode === 'grid' && (
          <div className="hidden sm:block relative" ref={colsMenuRef}>
            <button
              onClick={() => setShowColsMenu(v => !v)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors ml-1"
              title="列数设置"
            >
              <FiColumns size={14} />
            </button>
            {showColsMenu && (
              <div className="absolute right-0 top-full mt-1 bg-surface-800 border border-surface-500 rounded-lg p-1 shadow-xl z-10 min-w-[100px]">
                {gridColsOptions.map(({ cols, label }) => (
                  <button
                    key={cols}
                    onClick={() => { setGridCols(cols); setShowColsMenu(false) }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      gridCols === cols
                        ? 'bg-accent-500/20 text-accent-400'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <div className="my-1 mx-2 border-t border-white/10" />
                <button
                  onClick={() => { setMasonry(v => !v); setShowColsMenu(false) }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                    masonry
                      ? 'bg-accent-500/20 text-accent-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <FiLayout size={13} />
                  瀑布流
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {loading ? (
        viewMode === 'compact' ? (
          <div className="space-y-1">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                <div className="flex-1 space-y-1">
                  <div className="h-3.5 w-48 rounded bg-white/10" />
                  <div className="h-3 w-64 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <div className={`${masonry ? masonryClasses[gridCols] : `grid ${gridClasses[gridCols]}`} gap-3`}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`glass rounded-xl p-4 h-24 animate-pulse ${masonry ? 'break-inside-avoid mb-3' : ''}`}>
                <div className="bg-white/10 h-4 w-3/4 rounded mb-3" />
                <div className="bg-white/10 h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                <div className="w-5 h-5 rounded bg-white/10" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-48 rounded bg-white/10" />
                  <div className="h-3 w-64 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FiBookmark size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{emptyMessage || '暂无书签'}</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' && (
            <motion.div
              variants={containerAnim}
              initial="hidden"
              animate="show"
              className={`${masonry ? masonryClasses[gridCols] : `grid ${gridClasses[gridCols]}`} gap-3`}
            >
              {prepend}
              {bookmarks.map(b => (
                <motion.div key={b.id} variants={itemAnim} className={masonry ? 'break-inside-avoid mb-3' : ''}>
                  <GridCard
                    bookmark={b}
                    onPin={onPin}
                    onClick={handleClick}
                    renderActions={renderActions}
                    batchMode={batchMode}
                    selected={selectedIds?.has(b.id)}
                    onToggleSelect={onToggleSelect}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {viewMode === 'list' && (
            <motion.div
              variants={containerAnim}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {prepend}
              {bookmarks.map(b => (
                <motion.div key={b.id} variants={itemAnim}>
                  <ListCard
                    bookmark={b}
                    onPin={onPin}
                    onClick={handleClick}
                    renderActions={renderActions}
                    batchMode={batchMode}
                    selected={selectedIds?.has(b.id)}
                    onToggleSelect={onToggleSelect}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {viewMode === 'compact' && (
            <motion.div
              variants={containerAnim}
              initial="hidden"
              animate="show"
              className="space-y-0.5"
            >
              {prepend}
              {bookmarks.map(b => (
                <motion.div key={b.id} variants={itemAnim}>
                  <CompactCard
                    bookmark={b}
                    onPin={onPin}
                    onClick={handleClick}
                    renderActions={renderActions}
                    batchMode={batchMode}
                    selected={selectedIds?.has(b.id)}
                    onToggleSelect={onToggleSelect}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {totalPages > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mt-4 pt-4 border-t border-white/5">
              {totalElements !== undefined && (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  共{totalElements}条
                </span>
              )}
              {pageSize !== undefined && onPageSizeChange && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="hidden sm:inline whitespace-nowrap">每页</span>
                  <select
                    value={pageSize}
                    onChange={e => onPageSizeChange(Number(e.target.value))}
                    className="bg-surface-800 border border-surface-500 rounded px-1 sm:px-2 py-1 text-xs text-gray-300 outline-none cursor-pointer w-12 sm:w-auto"
                  >
                    {[12, 24, 36, 48, 64].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </span>
              )}
              <div className="flex items-center gap-1 text-xs">
                <button
                  disabled={currentPage === 0}
                  onClick={() => onPageChange(currentPage - 1)}
                  className="p-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <span className="text-gray-400 min-w-[2.5rem] sm:min-w-[4rem] text-center select-none whitespace-nowrap">
                  {currentPage + 1}/{totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => onPageChange(currentPage + 1)}
                  className="p-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
              {totalPages > 1 && (
                <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                  <span className="whitespace-nowrap">跳至</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    placeholder="#"
                    className="w-14 bg-surface-800 border border-surface-500 rounded px-2 py-1 text-xs text-gray-300 outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement
                        const val = parseInt(input.value)
                        if (val >= 1 && val <= totalPages) {
                          onPageChange(val - 1)
                        }
                        input.value = ''
                      }
                    }}
                  />
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─── Grid Card ─────────────────────────────────────────── */

function GridCard({
  bookmark: b,
  onPin,
  onClick,
  renderActions,
  batchMode,
  selected,
  onToggleSelect,
}: {
  bookmark: BookmarkResponse
  onPin: (id: number) => void
  onClick: (id: number) => void
  renderActions?: (b: BookmarkResponse) => ReactNode
  batchMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: number) => void
}) {
  return (
    <div className={`glass rounded-xl p-4 glass-hover transition-all group ${batchMode ? 'cursor-pointer' : ''} ${selected ? 'ring-2 ring-accent-500/50' : ''}`} onClick={() => batchMode && onToggleSelect?.(b.id)}>
      <div className="flex items-start gap-3">
        {batchMode && (
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect?.(b.id) }} className="mt-0.5 shrink-0 text-gray-500 hover:text-accent-400 transition-colors">
            {selected ? <FiCheckSquare size={18} className="text-accent-400" /> : <FiSquare size={18} />}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
          {b.faviconUrl && (
            <img src={b.faviconUrl} alt="" className="w-4 h-4 rounded shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
          <a
            href={b.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onClick(b.id)}
            className="text-sm font-semibold truncate hover:text-accent-400 transition-colors"
          >
            {b.title}
          </a>
          {b.pinned && <FiPaperclip size={11} className="text-rose-400 shrink-0" />}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{b.url}</p>
        {b.description && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{b.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {b.category && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">
              {b.category.name}
            </span>
          )}
          {b.tags.slice(0, 3).map(t => (
            <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded bg-accent-500/10 text-accent-400">
              {t.name}
            </span>
          ))}
          {b.tags.length > 3 && (
            <span className="text-[10px] text-gray-500">+{b.tags.length - 3}</span>
          )}
        </div>
      </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <FiMousePointer size={11} /> {b.clickCount}
        </span>
        <div className="flex items-center gap-1">
          {renderActions ? (
            renderActions(b)
          ) : (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onPin(b.id) }}
              className={`p-1.5 rounded hover:bg-white/10 transition-colors ${b.pinned ? 'text-rose-400' : 'text-gray-500 hover:text-rose-400'}`}
              title={b.pinned ? '取消置顶' : '置顶'}
            >
              <FiPaperclip size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── List Card ──────────────────────────────────────────── */

function ListCard({
  bookmark: b,
  onPin,
  onClick,
  renderActions,
  batchMode,
  selected,
  onToggleSelect,
}: {
  bookmark: BookmarkResponse
  onPin: (id: number) => void
  onClick: (id: number) => void
  renderActions?: (b: BookmarkResponse) => ReactNode
  batchMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: number) => void
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors group min-w-0 ${selected ? 'bg-accent-500/5' : ''}`} onClick={() => batchMode && onToggleSelect?.(b.id)}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {batchMode && (
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect?.(b.id) }} className="mt-0.5 shrink-0 text-gray-500 hover:text-accent-400 transition-colors">
            {selected ? <FiCheckSquare size={18} className="text-accent-400" /> : <FiSquare size={18} />}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {b.faviconUrl && (
              <img src={b.faviconUrl} alt="" className="w-4 h-4 rounded shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onClick(b.id)}
              className="text-sm truncate hover:text-accent-400 transition-colors"
            >
              {b.title}
            </a>
            {b.pinned && <FiPaperclip size={11} className="text-rose-400 shrink-0" />}
          </div>
          <div className="text-xs text-gray-600 truncate">{b.url}</div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {b.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 leading-none">
                {b.category.name}
              </span>
            )}
            {b.tags.slice(0, 4).map(t => (
              <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-500/10 text-neon-400 border border-neon-500/20 leading-none">
                # {t.name}
              </span>
            ))}
            {b.tags.length > 4 && (
              <span className="text-[10px] text-gray-500">+{b.tags.length - 4}</span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-500 ml-0.5">
              <FiMousePointer size={11} /> {b.clickCount}
            </span>
          </div>
        </div>
      </div>
      {renderActions ? (
        <div className="flex items-center gap-1 sm:shrink-0 sm:mt-0.5 ml-auto sm:ml-0">
          {renderActions(b)}
        </div>
      ) : (
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onPin(b.id) }}
          className={`p-1.5 rounded hover:bg-white/10 transition-colors shrink-0 sm:mt-0.5 ml-auto sm:ml-0 ${b.pinned ? 'text-rose-400' : 'text-gray-500 hover:text-rose-400'}`}
          title={b.pinned ? '取消置顶' : '置顶'}
        >
          <FiPaperclip size={13} />
        </button>
      )}
    </div>
  )
}

/* ─── Compact Card ───────────────────────────────────────── */

function CompactCard({
  bookmark: b,
  onPin,
  onClick,
  renderActions,
  batchMode,
  selected,
  onToggleSelect,
}: {
  bookmark: BookmarkResponse
  onPin: (id: number) => void
  onClick: (id: number) => void
  renderActions?: (b: BookmarkResponse) => ReactNode
  batchMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: number) => void
}) {
  return (
    <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors group min-w-0 ${selected ? 'bg-accent-500/5' : ''}`} onClick={() => batchMode && onToggleSelect?.(b.id)}>
      {batchMode && (
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect?.(b.id) }} className="shrink-0 text-gray-500 hover:text-accent-400 transition-colors">
          {selected ? <FiCheckSquare size={16} className="text-accent-400" /> : <FiSquare size={16} />}
        </button>
      )}
      <a
        href={b.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onClick(b.id)}
        className="flex-1 min-w-0 flex items-center gap-2"
      >
        {b.faviconUrl && (
          <img src={b.faviconUrl} alt="" className="w-4 h-4 rounded shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
        <span className="text-sm truncate group-hover:text-accent-400 transition-colors">
          {b.title}
        </span>
        <span className="text-xs text-gray-600 truncate hidden sm:inline flex-shrink min-w-0 max-w-[180px]">
          {b.url}
        </span>
      </a>
      <div className="flex items-center gap-1.5 shrink-0">
        {b.pinned && <FiPaperclip size={10} className="text-rose-400" />}
        {b.category && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium hidden sm:inline">
            {b.category.name}
          </span>
        )}
        <span className="flex items-center gap-1 text-[10px] text-gray-500">
          <FiMousePointer size={10} /> {b.clickCount}
        </span>
        {renderActions ? (
          renderActions(b)
        ) : (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onPin(b.id) }}
            className={`p-1 rounded hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 ${b.pinned ? 'text-rose-400' : 'text-gray-500 hover:text-rose-400'}`}
            title={b.pinned ? '取消置顶' : '置顶'}
          >
            <FiPaperclip size={11} />
          </button>
        )}
      </div>
    </div>
  )
}
