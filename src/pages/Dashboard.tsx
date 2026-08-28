import { useEffect, useState, useCallback, useRef, useMemo, useLayoutEffect } from 'react'
import { FiSearch, FiX, FiPaperclip, FiCornerDownLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { searchBookmarks, togglePin } from '../api/bookmarks'
import { getCategoryTree } from '../api/categories'
import { getAllTags, getTagStats } from '../api/tags'
import type { BookmarkResponse, CategoryResponse, TagResponse } from '../types'
import BookmarkEditModal from '../manage/BookmarkEditModal'
import { OPEN_CREATE_BOOKMARK_EVENT } from '../events'

const DEFAULT_FAVICON = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20d%3D%22M12%202C6.48%202%202%206.48%202%2012s4.48%2010%2010%2010%2010-4.48%2010-10S17.52%202%2012%202zm-1%2017.93c-3.95-.49-7-3.85-7-7.93%200-.62.08-1.21.21-1.79L9%2015v1c0%201.1.9%202%202%202v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55%200%201-.45%201-1V7h2c1.1%200%202-.9%202-2v-.41c2.93%201.19%205%204.06%205%207.41%200%202.08-.8%203.97-2.1%205.39z%22%2F%3E%3C%2Fsvg%3E'

function BookmarkCard({ bookmark, onPin }: {
  bookmark: BookmarkResponse
  onPin: (id: number) => void
}) {
  const handleOpen = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      onClick={handleOpen}
      className="group glass rounded-lg sm:rounded-xl p-2.5 sm:p-4 flex flex-col gap-1.5 sm:gap-2 cursor-pointer transition-all hover:border-accent-500/30 hover:bg-white/[0.04] min-h-[4.5rem] sm:min-h-[5rem]"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src={bookmark.faviconUrl || DEFAULT_FAVICON}
          alt=""
          className="w-5 h-5 rounded shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_FAVICON }}
        />
        <span className="text-sm font-medium text-gray-200 truncate min-w-0">{bookmark.title}</span>
        {bookmark.pinned && (
          <FiPaperclip size={12} className="text-rose-400 shrink-0" />
        )}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-gray-500 truncate min-w-0 flex-1">{bookmark.url}</span>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPin(bookmark.id) }}
          className={`p-1 rounded transition-colors shrink-0 ${
            bookmark.pinned
              ? 'text-rose-400 hover:text-rose-300'
              : 'text-gray-600 hover:text-rose-400 opacity-0 group-hover:opacity-100'
          }`}
          title={bookmark.pinned ? '取消置顶' : '置顶'}
        >
          <FiPaperclip size={13} />
        </button>
      </div>
    </div>
  )
}

interface DashboardProps {
  baseCategoryId?: number
}

export default function Dashboard({ baseCategoryId }: DashboardProps) {
  const [allBookmarks, setAllBookmarks] = useState<BookmarkResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [allTags, setAllTags] = useState<TagResponse[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [categoriesExpanded, setCategoriesExpanded] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showCreateBookmark, setShowCreateBookmark] = useState(false)
  const mountedRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set())
  const [overflowingBlocks, setOverflowingBlocks] = useState<Set<number>>(new Set())
  const gridRefMap = useRef<Map<number, HTMLDivElement>>(new Map())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleOpenCreate = () => setShowCreateBookmark(true)
    window.addEventListener(OPEN_CREATE_BOOKMARK_EVENT, handleOpenCreate)
    return () => window.removeEventListener(OPEN_CREATE_BOOKMARK_EVENT, handleOpenCreate)
  }, [])

  useLayoutEffect(() => {
    const check = () => {
      const newOverflow = new Set<number>()
      gridRefMap.current.forEach((el, id) => {
        if (el && el.scrollHeight > el.clientHeight + 1) {
          newOverflow.add(id)
        }
      })
      setOverflowingBlocks(prev => {
        const prevArr = Array.from(prev).sort((a, b) => a - b)
        const newArr = Array.from(newOverflow).sort((a, b) => a - b)
        return prevArr.length === newArr.length && prevArr.every((v, i) => v === newArr[i]) ? prev : newOverflow
      })
    }
    check()
    const observer = new ResizeObserver(check)
    gridRefMap.current.forEach(el => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [allBookmarks, expandedBlocks])

  const toggleBlockExpand = (id: number) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const doFetchBookmarks = useCallback(async (keyword: string) => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page: 0, size: 1000 }
      if (keyword.trim()) params.keyword = keyword.trim()
      const bmRes = await searchBookmarks(params)
      setAllBookmarks(bmRes.data.content)
    } catch {
      toast.error('加载书签失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.all([
      getCategoryTree(),
      getAllTags(),
      getTagStats({}),
    ]).then(([catRes, tagRes]) => {
      setCategories(catRes.data)
      setAllTags(tagRes.data)
    }).catch(() => {
      toast.error('加载数据失败')
    })
    doFetchBookmarks('') // eslint-disable-line react-hooks/set-state-in-effect
    mountedRef.current = true
  }, [doFetchBookmarks])

  useEffect(() => {
    if (!mountedRef.current) return
    setSelectedCategoryId(null)
    setSelectedTagId(null)
  }, [baseCategoryId])

  useEffect(() => {
    if (!mountedRef.current) return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (searchKeyword) {
      debounceTimer.current = setTimeout(() => {
        doFetchBookmarks(searchKeyword)
      }, 1000)
    } else {
      doFetchBookmarks('') // eslint-disable-line react-hooks/set-state-in-effect
    }
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [searchKeyword, doFetchBookmarks])

  const filteredBookmarks = useMemo(() => {
    let result = allBookmarks
    if (selectedCategoryId !== null) {
      result = result.filter(b => b.category?.id === selectedCategoryId)
    }
    if (selectedTagId !== null) {
      result = result.filter(b => b.tags.some(t => t.id === selectedTagId))
    }
    return result
  }, [allBookmarks, selectedCategoryId, selectedTagId])

  const orderedTopLevelCategories = useMemo(() => {
    return categories.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [categories])

  const categoriesWithCounts = useMemo(() => {
    return orderedTopLevelCategories.map(cat => ({
      ...cat,
      count: allBookmarks.filter(b => b.category?.id === cat.id).length,
    })).filter(c => c.count > 0)
  }, [orderedTopLevelCategories, allBookmarks])

  const bookmarkBlocks = useMemo(() => {
    const blocks: { category: { id: number; name: string }; bookmarks: BookmarkResponse[] }[] = []
    for (const cat of orderedTopLevelCategories) {
      const catBookmarks = filteredBookmarks.filter(b => b.category?.id === cat.id)
      if (catBookmarks.length > 0) {
        blocks.push({ category: { id: cat.id, name: cat.name }, bookmarks: catBookmarks })
      }
    }
    const uncategorized = filteredBookmarks.filter(b => !b.category)
    if (uncategorized.length > 0) {
      blocks.push({ category: { id: -1, name: '未分类' }, bookmarks: uncategorized })
    }
    return blocks
  }, [filteredBookmarks, orderedTopLevelCategories])

  const getBlockTagStats = useCallback((bookmarks: BookmarkResponse[]) => {
    const tagMap = new Map<number, { name: string; count: number }>()
    for (const bm of bookmarks) {
      for (const tag of bm.tags) {
        const existing = tagMap.get(tag.id)
        if (existing) existing.count++
        else tagMap.set(tag.id, { name: tag.name, count: 1 })
      }
    }
    return Array.from(tagMap.values()).filter(t => t.count > 0).sort((a, b) => b.count - a.count)
  }, [])

  const MAX_VISIBLE_CATS = 10
  const hasActiveSearch = searchKeyword.trim().length > 0
  const visibleCategories = hasActiveSearch
    ? categoriesWithCounts
    : categoriesExpanded
      ? categoriesWithCounts
      : categoriesWithCounts.slice(0, MAX_VISIBLE_CATS)
  const hasMoreCategories = !hasActiveSearch && categoriesWithCounts.length > MAX_VISIBLE_CATS

  const toggleCategory = (id: number) => {
    setSelectedCategoryId(prev => prev === id ? null : id)
  }

  const toggleTag = (id: number) => {
    setSelectedTagId(prev => prev === id ? null : id)
  }

  const handlePin = async (id: number) => {
    await togglePin(id)
    doFetchBookmarks(searchKeyword)
  }

  const reloadMeta = useCallback(async () => {
    try {
      const [catRes, tagRes] = await Promise.all([getCategoryTree(), getAllTags()])
      setCategories(catRes.data)
      setAllTags(tagRes.data)
    } catch {
      toast.error('加载分类/标签失败')
    }
  }, [])

  const handleCreated = useCallback(async () => {
    setShowCreateBookmark(false)
    await Promise.all([doFetchBookmarks(searchKeyword), reloadMeta()])
  }, [doFetchBookmarks, searchKeyword, reloadMeta])

  return (
    <div>
      <div className="sticky top-0 z-20 bg-surface-900 border-b border-white/5">
        <div className="px-4 sm:px-6 pb-1.5 pt-4 sm:pt-6 space-y-3">
          <div className="relative">
            <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (debounceTimer.current) clearTimeout(debounceTimer.current)
                  doFetchBookmarks(searchKeyword)
                }
              }}
              className="w-full glass rounded-xl pl-11 pr-24 py-3 text-sm text-gray-300 placeholder-gray-500 outline-none transition-all"
              placeholder="搜索书签标题、URL..."
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchKeyword && (
                <button
                  onClick={() => { if (debounceTimer.current) clearTimeout(debounceTimer.current); setSearchKeyword(''); searchInputRef.current?.focus() }}
                  className="text-gray-400 hover:text-gray-300 transition-colors p-1 rounded hover:bg-white/5"
                >
                  <FiX size={15} />
                </button>
              )}
              <button
                onClick={() => { if (debounceTimer.current) clearTimeout(debounceTimer.current); doFetchBookmarks(searchKeyword); searchInputRef.current?.focus() }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-accent-400 hover:bg-accent-500/10 transition-colors"
              >
                <FiCornerDownLeft size={12} />
                <span>搜索</span>
              </button>
              {!searchKeyword && !searchFocused && (
                <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-gray-600 border border-white/10 rounded px-1 py-0.5 pointer-events-none">
                  <span>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</span>
                  <span>K</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pb-0">
            {visibleCategories.length === 0 && !loading ? (
              <span className="text-sm text-gray-500 py-1">暂无分类</span>
            ) : (
              visibleCategories.map(cat => {
                const active = selectedCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                      active
                        ? 'bg-accent-500/20 text-accent-300 border-accent-500/40'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className={`shrink-0 ${active ? 'text-accent-300' : 'invisible'}`}>✓</span>
                    <span className="truncate max-w-[8rem]">{cat.name}</span>
                    <span className="text-gray-600 shrink-0">{cat.count}</span>
                  </button>
                )
              })
            )}
            {hasMoreCategories && (
              <button
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-gray-500 hover:text-gray-300 border border-dashed border-white/10 hover:border-white/20 transition-colors shrink-0"
              >
                {categoriesExpanded ? '收起' : `展开全部 (${categoriesWithCounts.length})`}
              </button>
            )}
            {selectedCategoryId !== null && (
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-accent-400/70 hover:text-accent-300 transition-colors shrink-0"
              >
                <FiX size={12} />
                清除分类
              </button>
            )}
            {selectedTagId !== null && (
              <button
                onClick={() => setSelectedTagId(null)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-neon-400/70 hover:text-neon-300 transition-colors shrink-0"
              >
                <FiX size={12} />
                清除标签
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-6 pt-2 sm:pt-2.5 pb-6 space-y-2.5 sm:space-y-3">
        {loading ? (
          <div className="space-y-2.5 sm:space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="glass rounded-xl p-3 sm:p-4 space-y-2.5 animate-pulse">
                <div className="h-5 w-32 bg-white/5 rounded" />
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
                  {[1, 2, 3].map(j => <div key={j} className="h-16 sm:h-20 bg-white/5 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        ) : bookmarkBlocks.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <div className="text-gray-500 text-sm">
              {searchKeyword ? '没有找到匹配的书签' : '暂无书签'}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {bookmarkBlocks.map(block => {
              const blockTagStats = getBlockTagStats(block.bookmarks)
              const isExpanded = expandedBlocks.has(block.category.id)
              const isOverflowing = overflowingBlocks.has(block.category.id)
              return (
                <section key={block.category.id} className="glass rounded-xl overflow-hidden border border-white/[0.07] bg-white/[0.02]">
                  <header className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-white/[0.06] bg-white/[0.03]">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <h2 className="flex items-center gap-1.5 text-[13px] sm:text-sm font-semibold text-gray-200 shrink-0">
                        <span className="w-1 h-3.5 rounded-full bg-accent-500/70 shrink-0" />
                        {block.category.name}
                        <span className="text-[11px] font-normal text-gray-500">{block.bookmarks.length}</span>
                      </h2>
                      {blockTagStats.length > 0 && (
                        <div className="flex flex-nowrap overflow-x-auto gap-1 sm:flex-wrap sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {blockTagStats.map(tag => {
                            const tagActive = selectedTagId === allTags.find(t => t.name === tag.name)?.id
                            return (
                              <button
                                key={tag.name}
                                onClick={() => {
                                  const tagObj = allTags.find(t => t.name === tag.name)
                                  if (tagObj) toggleTag(tagObj.id)
                                }}
                                className={`flex items-center gap-0.5 px-1.5 py-px rounded text-[11px] leading-4 font-medium border transition-colors shrink-0 ${
                                  tagActive
                                    ? 'bg-neon-500/20 text-neon-300 border-neon-500/40'
                                    : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-gray-300'
                                }`}
                              >
                                <span>#</span>
                                <span className="truncate max-w-[7rem] sm:max-w-none">{tag.name}</span>
                                <span className="text-gray-600">{tag.count}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </header>
                  <div className="p-2.5 sm:p-3.5 relative">
                    <div
                      ref={(el) => { if (el) gridRefMap.current.set(block.category.id, el); else gridRefMap.current.delete(block.category.id) }}
                      className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 ${!isExpanded && isOverflowing ? 'max-h-[280px] overflow-hidden' : ''}`}
                    >
                      {block.bookmarks.map(bm => (
                        <BookmarkCard key={bm.id} bookmark={bm} onPin={handlePin} />
                      ))}
                    </div>
                    {!isExpanded && isOverflowing && (
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-surface-900 via-surface-900/80 to-transparent pointer-events-none" />
                    )}
                    {isOverflowing && (
                      <button
                        onClick={() => toggleBlockExpand(block.category.id)}
                        className={`w-full mt-2 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 bg-white/5 hover:bg-white/10 border border-white/5 transition-colors ${!isExpanded ? 'relative z-10' : ''}`}
                      >
                        {isExpanded ? '收起' : `展开全部 (${block.bookmarks.length})`}
                      </button>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        <BookmarkEditModal
          open={showCreateBookmark}
          onClose={() => setShowCreateBookmark(false)}
          categories={categories}
          allTags={allTags}
          editing={null}
          onSaved={handleCreated}
          onMetaChange={reloadMeta}
        />
      </div>
    </div>
  )
}
