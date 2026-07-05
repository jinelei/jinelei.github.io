import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { FiBookmark, FiFolder, FiTag, FiTrendingUp, FiSearch, FiX, FiExternalLink, FiPaperclip, FiEdit2, FiTrash2, FiPlus, FiCheck, FiRefreshCw } from 'react-icons/fi'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { searchBookmarks, togglePin, updateBookmark, deleteBookmark, batchUpdateBookmarks, createBookmark, refreshFavicon } from '../api/bookmarks'
import { getCategoryTree, getCategoryStats, createCategory, updateCategory, deleteCategory } from '../api/categories'
import { getAllTags, getTagStats, createTag, updateTag, deleteTag } from '../api/tags'
import type { BookmarkResponse, CategoryResponse, TagStatsResponse, TagResponse, BookmarkRequest, CategoryRequest } from '../types'
import BookmarkView, { type ViewMode } from '../components/BookmarkView'

const DEFAULT_FAVICON = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20d%3D%22M12%202C6.48%202%202%206.48%202%2012s4.48%2010%2010%2010%2010-4.48%2010-10S17.52%202%2012%202zm-1%2017.93c-3.95-.49-7-3.85-7-7.93%200-.62.08-1.21.21-1.79L9%2015v1c0%201.1.9%202%202%202v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55%200%201-.45%201-1V7h2c1.1%200%202-.9%202-2v-.41c2.93%201.19%205%204.06%205%207.41%200%202.08-.8%203.97-2.1%205.39z%22%2F%3E%3C%2Fsvg%3E'
import Modal from '../components/Modal'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function flattenCategories(
  cats: CategoryResponse[],
  parentPath: string[] = [],
): { id: number; name: string; label: string }[] {
  return cats.flatMap(c => [
    { id: c.id, name: c.name, label: parentPath.length > 0 ? `${parentPath.join(' › ')} › ${c.name}` : c.name },
    ...flattenCategories(c.children, [...parentPath, c.name]),
  ])
}

function getSubtreeIds(cats: CategoryResponse[]): number[] {
  return cats.flatMap(c => [c.id, ...getSubtreeIds(c.children)])
}

function extractSubtree(tree: CategoryResponse[], rootId: number): CategoryResponse[] {
  for (const c of tree) {
    if (c.id === rootId) return [c]
    const found = extractSubtree(c.children, rootId)
    if (found.length > 0) return found
  }
  return []
}

function CreateBookmarkForm({ categories, allTags, onSubmit, onCancel, onCategoryCreated, onTagCreated }: {
  categories: CategoryResponse[]
  allTags: TagResponse[]
  onSubmit: (data: BookmarkRequest) => Promise<void>
  onCancel: () => void
  onCategoryCreated?: (cat: CategoryResponse) => void
  onTagCreated?: (tag: TagResponse) => void
}) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)
  const [showNewTag, setShowNewTag] = useState(false)

  const toggleTag = (id: number) => {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    setCreatingCategory(true)
    try {
      const res = await createCategory({ name: newCategoryName.trim() })
      setCategoryId(res.data.id)
      setNewCategoryName('')
      setShowNewCategory(false)
      onCategoryCreated?.(res.data)
      toast.success('分类已创建')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '创建分类失败')
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    setCreatingTag(true)
    try {
      const res = await createTag({ name: newTagName.trim() })
      setSelectedTagIds((prev) => [...prev, res.data.id])
      setNewTagName('')
      setShowNewTag(false)
      onTagCreated?.(res.data)
      toast.success('标签已创建')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '创建标签失败')
    } finally {
      setCreatingTag(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) {
      toast.error('标题和 URL 不能为空')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), url: url.trim(), description: description.trim() || undefined, categoryId, tagIds: selectedTagIds.length ? selectedTagIds : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">标题 *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors" placeholder="书签标题" />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">URL *</label>
        <input value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors" placeholder="https://..." />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">描述</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors resize-none h-20" placeholder="可选描述" />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">分类</label>
        <div className="flex gap-2">
          <select value={categoryId || ''} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)} className="flex-1 bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors">
            <option value="">无分类</option>
            {flattenCategories(categories).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button type="button" onClick={() => { setShowNewCategory(!showNewCategory); setNewCategoryName('') }} className="px-2.5 py-2 rounded-lg bg-surface-800 border border-surface-500 text-neon-400 hover:text-neon-300 hover:border-neon-500/50 transition-colors" title="新增分类">
            <FiPlus size={18} />
          </button>
        </div>
        {showNewCategory && (
          <div className="flex gap-2 mt-2">
            <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="分类名称" className="flex-1 bg-surface-800 border border-surface-500 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors" onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()} />
            <button type="button" onClick={handleCreateCategory} disabled={creatingCategory || !newCategoryName.trim()} className="px-3 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white text-xs font-medium transition-colors">
              {creatingCategory ? '...' : '创建'}
            </button>
          </div>
        )}
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">标签</label>
        <div className="flex flex-wrap gap-1.5">
          {allTags.map(t => (
            <button key={t.id} type="button" onClick={() => toggleTag(t.id)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedTagIds.includes(t.id) ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30' : 'bg-surface-800 text-gray-400 border border-surface-500 hover:border-surface-400'}`}>
              {t.name}
            </button>
          ))}
          <button type="button" onClick={() => { setShowNewTag(!showNewTag); setNewTagName('') }} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs leading-none font-medium transition-all border border-dashed border-surface-500 text-neon-400 hover:text-neon-300 hover:border-neon-500/50 ${showNewTag ? 'border-accent-500/50 text-accent-400' : ''}`}>
            <FiPlus size={16} /> 新增
          </button>
        </div>
        {showNewTag && (
          <div className="flex gap-2 mt-2">
            <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="标签名称" className="flex-1 bg-surface-800 border border-surface-500 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors" onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()} />
            <button type="button" onClick={handleCreateTag} disabled={creatingTag || !newTagName.trim()} className="px-3 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white text-xs font-medium transition-colors">
              {creatingTag ? '...' : '创建'}
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={submitting} className="flex-1 bg-accent-600 hover:bg-accent-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
          {submitting ? '创建中...' : '创建'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 bg-surface-700 hover:bg-surface-600 text-gray-300 rounded-lg py-2 text-sm transition-colors">取消</button>
      </div>
    </form>
  )
}

function EditBookmarkForm({ bookmark, categories, allTags, onSubmit, onCancel, onCategoryCreated, onTagCreated }: {
  bookmark: BookmarkResponse
  categories: CategoryResponse[]
  allTags: TagResponse[]
  onSubmit: (data: BookmarkRequest) => Promise<void>
  onCancel: () => void
  onCategoryCreated?: (cat: CategoryResponse) => void
  onTagCreated?: (tag: TagResponse) => void
}) {
  const [title, setTitle] = useState(bookmark.title)
  const [url, setUrl] = useState(bookmark.url)
  const [description, setDescription] = useState(bookmark.description || '')
  const [categoryId, setCategoryId] = useState<number | undefined>(bookmark.category?.id)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(bookmark.tags.map(t => t.id))
  const [submitting, setSubmitting] = useState(false)
  const [faviconUrl, setFaviconUrl] = useState(bookmark.faviconUrl)
  const [refreshingFavicon, setRefreshingFavicon] = useState(false)

  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)
  const [showNewTag, setShowNewTag] = useState(false)

  const toggleTag = (id: number) => {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    setCreatingCategory(true)
    try {
      const res = await createCategory({ name: newCategoryName.trim() })
      setCategoryId(res.data.id)
      setNewCategoryName('')
      setShowNewCategory(false)
      onCategoryCreated?.(res.data)
      toast.success('分类已创建')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '创建分类失败')
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    setCreatingTag(true)
    try {
      const res = await createTag({ name: newTagName.trim() })
      setSelectedTagIds((prev) => [...prev, res.data.id])
      setNewTagName('')
      setShowNewTag(false)
      onTagCreated?.(res.data)
      toast.success('标签已创建')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '创建标签失败')
    } finally {
      setCreatingTag(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) {
      toast.error('标题和 URL 不能为空')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), url: url.trim(), description: description.trim() || undefined, categoryId, tagIds: selectedTagIds.length ? selectedTagIds : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">标题 *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors" />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">URL *</label>
        <input value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors" />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">描述</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors resize-none h-20" />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">分类</label>
        <div className="flex gap-2">
          <select value={categoryId || ''} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)} className="flex-1 bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors">
            <option value="">无分类</option>
            {flattenCategories(categories).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button type="button" onClick={() => { setShowNewCategory(!showNewCategory); setNewCategoryName('') }} className="px-2.5 py-2 rounded-lg bg-surface-800 border border-surface-500 text-neon-400 hover:text-neon-300 hover:border-neon-500/50 transition-colors" title="新增分类">
            <FiPlus size={18} />
          </button>
        </div>
        {showNewCategory && (
          <div className="flex gap-2 mt-2">
            <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="分类名称" className="flex-1 bg-surface-800 border border-surface-500 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors" onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()} />
            <button type="button" onClick={handleCreateCategory} disabled={creatingCategory || !newCategoryName.trim()} className="px-3 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white text-xs font-medium transition-colors">
              {creatingCategory ? '...' : '创建'}
            </button>
          </div>
        )}
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">标签</label>
        <div className="flex flex-wrap gap-1.5">
          {allTags.map(t => (
            <button key={t.id} type="button" onClick={() => toggleTag(t.id)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedTagIds.includes(t.id) ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30' : 'bg-surface-800 text-gray-400 border border-surface-500 hover:border-surface-400'}`}>
              {t.name}
            </button>
          ))}
          <button type="button" onClick={() => { setShowNewTag(!showNewTag); setNewTagName('') }} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs leading-none font-medium transition-all border border-dashed border-surface-500 text-neon-400 hover:text-neon-300 hover:border-neon-500/50 ${showNewTag ? 'border-accent-500/50 text-accent-400' : ''}`}>
            <FiPlus size={16} /> 新增
          </button>
        </div>
        {showNewTag && (
          <div className="flex gap-2 mt-2">
            <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="标签名称" className="flex-1 bg-surface-800 border border-surface-500 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors" onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()} />
            <button type="button" onClick={handleCreateTag} disabled={creatingTag || !newTagName.trim()} className="px-3 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white text-xs font-medium transition-colors">
              {creatingTag ? '...' : '创建'}
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <div className="flex items-center gap-2 flex-1">
          <button type="submit" disabled={submitting} className="flex-1 bg-accent-600 hover:bg-accent-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
            {submitting ? '保存中...' : '保存'}
          </button>
          <img
            src={faviconUrl || DEFAULT_FAVICON}
            alt=""
            className="w-5 h-5 rounded shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_FAVICON }}
          />
          <button
            type="button"
            onClick={async () => {
              setRefreshingFavicon(true)
              try {
                const res = await refreshFavicon(bookmark.id)
                setFaviconUrl(res.data.faviconUrl)
                toast.success('图标已刷新')
              } catch (e: unknown) {
                const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || (e instanceof Error ? e.message : '刷新图标失败')
                toast.error(msg)
              } finally {
                setRefreshingFavicon(false)
              }
            }}
            disabled={refreshingFavicon}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-500 text-accent-400 hover:text-accent-300 hover:border-accent-500/50 transition-colors disabled:opacity-50 shrink-0"
          >
            <FiRefreshCw size={13} className={refreshingFavicon ? 'animate-spin' : ''} />
            {refreshingFavicon ? '刷新中...' : '刷新图标'}
          </button>
        </div>
        <button type="button" onClick={onCancel} className="px-4 bg-surface-700 hover:bg-surface-600 text-gray-300 rounded-lg py-2 text-sm transition-colors">取消</button>
      </div>
    </form>
  )
}

interface DashboardProps {
  baseCategoryId?: number
}

export default function Dashboard({ baseCategoryId }: DashboardProps) {
  const [stats, setStats] = useState({ bookmarks: 0, categories: 0, tags: 0 })
  const [recent, setRecent] = useState<BookmarkResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [allTags, setAllTags] = useState<TagResponse[]>([])
  const [tagStats, setTagStats] = useState<TagStatsResponse[]>([])
  const [catStats, setCatStats] = useState<Map<number, number>>(new Map())
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('dashboardBookmarkView') as ViewMode) || 'list'
  })
  const [pageSize, setPageSize] = useState(() => {
    return Number(localStorage.getItem('dashboardPageSize')) || 12
  })
  const pageSizeRef = useRef(pageSize)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchCategoryModalOpen, setBatchCategoryModalOpen] = useState(false)
  const [batchAddTagModalOpen, setBatchAddTagModalOpen] = useState(false)
  const [batchRemoveTagModalOpen, setBatchRemoveTagModalOpen] = useState(false)
  const [batchCategoryId, setBatchCategoryId] = useState<number | undefined>()
  const [batchTagIds, setBatchTagIds] = useState<number[]>([])
  const [batchActionLoading, setBatchActionLoading] = useState(false)

  const [catEditMode, setCatEditMode] = useState(false)
  const [tagEditMode, setTagEditMode] = useState(false)
  const [catFormMode, setCatFormMode] = useState<'create' | 'edit' | null>(null)
  const [tagFormMode, setTagFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null)
  const [editingTag, setEditingTag] = useState<TagResponse | null>(null)
  const [catFormName, setCatFormName] = useState('')
  const [catFormParentId, setCatFormParentId] = useState<number | undefined>()
  const [catFormSort, setCatFormSort] = useState('')
  const [catFormSubmitting, setCatFormSubmitting] = useState(false)
  const [tagFormName, setTagFormName] = useState('')
  const [tagFormSubmitting, setTagFormSubmitting] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<BookmarkResponse | null>(null)
  const [showCreateBookmark, setShowCreateBookmark] = useState(false)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setSelectedCategoryIds([])
    setKeyword('')
    setPage(0)
  }, [baseCategoryId])

  const doFetch = useCallback((catIds: number[], tagIds: number[], kw: string, pg: number) => {
    setLoading(true)
    const effectiveCatIds = baseCategoryId
      ? catIds.length === 0
        ? [baseCategoryId]
        : catIds.includes(baseCategoryId) && catIds.length > 1
          ? catIds.filter(id => id !== baseCategoryId)
          : catIds
      : catIds
    const bmParams: Record<string, unknown> = { page: pg, size: pageSizeRef.current }
    if (effectiveCatIds.length > 0) bmParams.categoryIds = effectiveCatIds
    if (tagIds.length > 0) bmParams.tagIds = tagIds
    if (kw.length > 0) bmParams.keyword = kw
    const statsParams: Record<string, unknown> = {}
    if (effectiveCatIds.length > 0) statsParams.categoryIds = effectiveCatIds
    Promise.all([
      searchBookmarks(bmParams),
      getCategoryTree(),
      getAllTags(),
      getTagStats(statsParams),
      getCategoryStats(),
    ]).then(([b, c, t, s, cs]) => {
      setStats({ bookmarks: b.data.totalElements, categories: b.data.totalDistinctCategories ?? c.data.length, tags: b.data.totalDistinctTags ?? t.data.length })
      setRecent(b.data.content)
      setTotalPages(b.data.totalPages)
      setTotalElements(b.data.totalElements)
      setCategories(c.data)
      setAllTags(t.data)
      setTagStats(s.data)
      setCatStats(new Map(cs.data.map(cs2 => [cs2.id, cs2.count])))
    }).finally(() => setLoading(false))
  }, [baseCategoryId])

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (keyword) {
      debounceTimer.current = setTimeout(() => {
        setPage(0)
        doFetch(selectedCategoryIds, selectedTagIds, keyword, 0)
      }, 1000)
    } else {
      setPage(0)
      doFetch(selectedCategoryIds, selectedTagIds, keyword, 0)
    }
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [selectedCategoryIds, selectedTagIds, keyword]) // eslint-disable-line react-hooks/exhaustive-deps

  const flatCategories = flattenCategories(categories)

  const subtreeIds = useMemo(() => {
    if (!baseCategoryId) return null
    const subtree = extractSubtree(categories, baseCategoryId)
    return new Set(getSubtreeIds(subtree))
  }, [categories, baseCategoryId])

  const displayFlatCategories = useMemo(() => {
    if (!subtreeIds) return flatCategories
    return flatCategories.filter(c => subtreeIds.has(c.id))
  }, [flatCategories, subtreeIds])

  const displayCatStats = useMemo(() => {
    if (!subtreeIds) return catStats
    const filtered = new Map(catStats)
    for (const id of catStats.keys()) {
      if (!subtreeIds.has(id)) filtered.delete(id)
    }
    return filtered
  }, [catStats, subtreeIds])

  const displayTagStats = useMemo(() => {
    return tagStats.filter(s => s.count > 0)
  }, [tagStats])

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  const toggleTag = (id: number) => {
    setSelectedTagIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  const handlePin = async (id: number) => {
    await togglePin(id)
    doFetch(selectedCategoryIds, selectedTagIds, keyword, page)
  }

  const handlePageSizeChange = (newSize: number) => {
    pageSizeRef.current = newSize
    setPageSize(newSize)
    localStorage.setItem('dashboardPageSize', String(newSize))
    setPage(0)
    doFetch(selectedCategoryIds, selectedTagIds, keyword, 0)
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(recent.map(b => b.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const exitBatchMode = () => {
    setBatchMode(false)
    setSelectedIds(new Set())
  }

  const handleBatchAction = async (action: (ids: number[]) => Promise<void>) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) { toast.error('请先选择书签'); return }
    setBatchActionLoading(true)
    try {
      await action(ids)
      toast.success('批量操作完成')
      exitBatchMode()
      setBatchCategoryModalOpen(false)
      setBatchAddTagModalOpen(false)
      setBatchRemoveTagModalOpen(false)
      doFetch(selectedCategoryIds, selectedTagIds, keyword, page)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '批量操作失败')
    } finally {
      setBatchActionLoading(false)
    }
  }

  const handleBatchCategory = () => {
    handleBatchAction(async (ids) => {
      await batchUpdateBookmarks({ ids, categoryId: batchCategoryId ?? null })
    })
  }

  const handleBatchAddTags = () => {
    handleBatchAction(async (ids) => {
      await batchUpdateBookmarks({ ids, addTagIds: batchTagIds })
    })
  }

  const handleBatchRemoveTags = () => {
    handleBatchAction(async (ids) => {
      await batchUpdateBookmarks({ ids, removeTagIds: batchTagIds })
    })
  }

  const handleUpdate = async (data: BookmarkRequest) => {
    if (!editingBookmark) return
    await updateBookmark(editingBookmark.id, data)
    toast.success('书签已更新')
    setEditingBookmark(null)
    doFetch(selectedCategoryIds, selectedTagIds, keyword, page)
  }

  const handleCreateBookmark = async (data: BookmarkRequest) => {
    await createBookmark(data)
    toast.success('书签已创建')
    setShowCreateBookmark(false)
    doFetch(selectedCategoryIds, selectedTagIds, keyword, page)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除此书签？')) return
    await deleteBookmark(id)
    toast.success('已删除')
    doFetch(selectedCategoryIds, selectedTagIds, keyword, page)
  }

  const openCatForm = (mode: 'create' | 'edit', cat?: CategoryResponse) => {
    setEditingCategory(cat || null)
    setCatFormName(cat?.name || '')
    setCatFormParentId(cat ? undefined : undefined)
    setCatFormSort(cat?.sortOrder?.toString() || '')
    setCatFormMode(mode)
  }

  const handleCatSubmit = async () => {
    if (!catFormName.trim()) { toast.error('名称不能为空'); return }
    setCatFormSubmitting(true)
    try {
      const data: CategoryRequest = { name: catFormName.trim(), sortOrder: catFormSort ? Number(catFormSort) : undefined }
      if (editingCategory) {
        await updateCategory(editingCategory.id, { ...data, parentId: catFormParentId })
        toast.success('分类已更新')
      } else {
        await createCategory({ ...data, parentId: catFormParentId })
        toast.success('分类已创建')
      }
      setCatFormMode(null)
      setEditingCategory(null)
      doFetch(selectedCategoryIds, selectedTagIds, keyword, page)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '操作失败')
    } finally {
      setCatFormSubmitting(false)
    }
  }

  const handleCatDelete = async (id: number, name: string) => {
    if (!confirm(`确认删除分类「${name}」？`)) return
    try {
      await deleteCategory(id)
      toast.success('已删除')
      doFetch(selectedCategoryIds, selectedTagIds, keyword, page)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '删除失败')
    }
  }

  const openTagForm = (mode: 'create' | 'edit', tag?: TagResponse) => {
    setEditingTag(tag || null)
    setTagFormName(tag?.name || '')
    setTagFormMode(mode)
  }

  const handleTagSubmit = async () => {
    if (!tagFormName.trim()) { toast.error('名称不能为空'); return }
    setTagFormSubmitting(true)
    try {
      if (editingTag) {
        await updateTag(editingTag.id, { name: tagFormName.trim() })
        toast.success('标签已更新')
      } else {
        await createTag({ name: tagFormName.trim() })
        toast.success('标签已创建')
      }
      setTagFormMode(null)
      setEditingTag(null)
      doFetch(selectedCategoryIds, selectedTagIds, keyword, page)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '操作失败')
    } finally {
      setTagFormSubmitting(false)
    }
  }

  const handleTagDelete = async (id: number, name: string) => {
    if (!confirm(`确认删除标签「${name}」？`)) return
    try {
      await deleteTag(id)
      toast.success('已删除')
      doFetch(selectedCategoryIds, selectedTagIds, keyword, page)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '删除失败')
    }
  }

  const cards = [
    { label: '书签', value: stats.bookmarks, icon: FiBookmark, color: 'from-accent-500 to-blue-600' },
    { label: '分类', value: stats.categories, icon: FiFolder, color: 'from-purple-500 to-purple-600' },
    { label: '标签', value: stats.tags, icon: FiTag, color: 'from-neon-500 to-emerald-600' },
    { label: '总点击', value: recent.reduce((a, b) => a + b.clickCount, 0), icon: FiTrendingUp, color: 'from-rose-500 to-pink-600' },
  ]

  return (
    <>
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="relative">
        <div className="relative w-full">
          <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (debounceTimer.current) clearTimeout(debounceTimer.current)
                setPage(0)
                doFetch(selectedCategoryIds, selectedTagIds, keyword, 0)
              }
            }}
            className="w-full glass rounded-xl pl-11 pr-10 py-3 text-sm text-gray-300 placeholder-gray-500 outline-none transition-all"
            placeholder="搜索书签标题、URL..."
          />
          {keyword && (
            <button
              onClick={() => { if (debounceTimer.current) clearTimeout(debounceTimer.current); setKeyword('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors p-0.5 rounded hover:bg-white/5"
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      </motion.div>

      <div className="flex flex-col-reverse lg:grid lg:grid-cols-[1fr_360px] gap-6">
        <motion.div variants={item} className="min-w-0 glass rounded-xl p-5">
          <BookmarkView
            title="书签列表"
            bookmarks={recent}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            loading={loading}
            onAdd={() => setShowCreateBookmark(true)}
            totalPages={totalPages}
            currentPage={page}
            onPageChange={(p) => { setPage(p); doFetch(selectedCategoryIds, selectedTagIds, keyword, p) }}
            onPin={handlePin}
            storageKey="dashboardBookmarkView"
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            totalElements={totalElements}
            batchMode={batchMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onBatchToggle={() => { if (batchMode) exitBatchMode(); else setBatchMode(true) }}
            prepend={batchMode ? (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-2.5 mb-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                <span className="text-xs text-amber-400 font-medium whitespace-nowrap">
                  已选 {selectedIds.size} 项
                </span>
                <button onClick={selectedIds.size === recent.length ? deselectAll : selectAll} className="text-xs text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap">
                  {selectedIds.size === recent.length ? '取消全选' : '全选'}
                </button>
                <span className="w-px h-4 bg-white/10" />
                <button onClick={() => { setBatchCategoryId(undefined); setBatchCategoryModalOpen(true) }} disabled={batchActionLoading} className="flex items-center gap-1 text-xs leading-none text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors whitespace-nowrap">
                  <FiFolder size={15} /><span className="hidden sm:inline">更改分类</span>
                </button>
                <button onClick={() => { setBatchTagIds([]); setBatchAddTagModalOpen(true) }} disabled={batchActionLoading} className="flex items-center gap-1 text-xs leading-none text-neon-400 hover:text-neon-300 disabled:opacity-50 transition-colors whitespace-nowrap">
                  <FiPlus size={15} /><span className="hidden sm:inline">追加标签</span>
                </button>
                <button onClick={() => { setBatchTagIds([]); setBatchRemoveTagModalOpen(true) }} disabled={batchActionLoading} className="flex items-center gap-1 text-xs leading-none text-rose-400 hover:text-rose-300 disabled:opacity-50 transition-colors whitespace-nowrap">
                  <FiTrash2 size={15} /><span className="hidden sm:inline">删除标签</span>
                </button>
              </div>
            ) : undefined}
            renderActions={(b) => (
              <>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 sm:p-1.5 rounded hover:bg-white/10 text-accent-400 hover:text-accent-300 transition-colors"
                  title="打开"
                >
                  <FiExternalLink size={12} />
                </a>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePin(b.id) }}
                  className={`p-1 sm:p-1.5 rounded hover:bg-white/10 transition-colors ${b.pinned ? 'text-rose-400' : 'text-gray-500 hover:text-rose-400'}`}
                  title={b.pinned ? '取消置顶' : '置顶'}
                >
                  <FiPaperclip size={12} />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingBookmark(b) }}
                  className="p-1 sm:p-1.5 rounded hover:bg-white/10 text-accent-400 hover:text-accent-300 transition-colors"
                  title="编辑"
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(b.id) }}
                  className="p-1 sm:p-1.5 rounded hover:bg-white/10 text-rose-400 hover:text-rose-300 transition-colors"
                  title="删除"
                >
                  <FiTrash2 size={14} />
                </button>
              </>
            )}
          />
        </motion.div>

        <div className="space-y-4">
          <motion.div variants={item} className="grid grid-cols-2 gap-2">
            {cards.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className={`glass rounded-xl p-3 flex items-center gap-3 ${loading ? 'opacity-60' : ''} transition-opacity`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shrink-0`}>
                  <Icon size={14} className="text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-bold leading-tight">{loading ? '...' : value}</div>
                  <div className="text-xs text-gray-500 leading-tight truncate">{label}</div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={item} className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <FiFolder size={14} className="text-purple-400" />
              <span className="text-base font-semibold text-gray-300">分类</span>
              <button onClick={() => openCatForm('create')} className="flex items-center gap-0.5 text-xs leading-none text-neon-400 hover:text-neon-300 ml-auto transition-colors">
                <FiPlus size={15} /><span className="hidden sm:inline">新增</span>
              </button>
              <button onClick={() => { setCatEditMode(v => !v); setTagEditMode(false) }} className={`flex items-center gap-0.5 text-xs leading-none transition-colors ${catEditMode ? 'text-accent-400' : 'text-accent-400 hover:text-accent-300'}`}>
                {catEditMode ? <><FiCheck size={15} /><span className="hidden sm:inline">完成</span></> : <><FiEdit2 size={15} /><span className="hidden sm:inline">编辑</span></>}
              </button>
              {selectedCategoryIds.length > (baseCategoryId ? 1 : 0) && (
                <>
                  <span className="text-[10px] text-purple-400 ml-1">({selectedCategoryIds.length})</span>
                  <button onClick={() => setSelectedCategoryIds([])} className="text-xs text-purple-400/70 hover:text-purple-300 transition-colors">清除</button>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {displayFlatCategories.length === 0 ? (
                  <span className="text-sm text-gray-400">暂无分类</span>
              ) : (
                displayFlatCategories.map(c => {
                  const active = selectedCategoryIds.includes(c.id)
                  return (
                    <div key={`cat-${c.id}`} className="flex items-center gap-1 group">
                      <button
                        onClick={() => catEditMode ? null : toggleCategory(c.id)}
                        onDoubleClick={() => catEditMode ? openCatForm('edit', categories.find(cat => cat.id === c.id)) : null}
                        className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-sm font-medium border transition-colors max-w-full sm:max-w-[320px] ${
                          active
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                        } ${catEditMode ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {active && <span className="text-purple-300 shrink-0">✓</span>}
                        <span className="truncate min-w-0">{c.label}</span>
                        <span className="text-gray-600 shrink-0">{displayCatStats.get(c.id) ?? 0}</span>
                      </button>
                      {catEditMode && (
                        <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => openCatForm('edit', categories.find(cat => cat.id === c.id))} className="p-1 rounded hover:bg-white/10 text-accent-400 hover:text-accent-300 transition-colors">
                            <FiEdit2 size={14} />
                          </button>
                          <button onClick={() => handleCatDelete(c.id, c.name)} className="p-1 rounded hover:bg-white/10 text-rose-400 hover:text-rose-300 transition-colors">
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>

          <motion.div variants={item} className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <FiTag size={14} className="text-neon-400" />
              <span className="text-base font-semibold text-gray-300">标签</span>
              <button onClick={() => openTagForm('create')} className="flex items-center gap-0.5 text-xs leading-none text-neon-400 hover:text-neon-300 ml-auto transition-colors">
                <FiPlus size={15} /><span className="hidden sm:inline">新增</span>
              </button>
              <button onClick={() => { setTagEditMode(v => !v); setCatEditMode(false) }} className={`flex items-center gap-0.5 text-xs leading-none transition-colors ${tagEditMode ? 'text-accent-400' : 'text-accent-400 hover:text-accent-300'}`}>
                {tagEditMode ? <><FiCheck size={15} /><span className="hidden sm:inline">完成</span></> : <><FiEdit2 size={15} /><span className="hidden sm:inline">编辑</span></>}
              </button>
              {selectedTagIds.length > 0 && (
                <>
                  <span className="text-[10px] text-neon-400 ml-1">({selectedTagIds.length})</span>
                  <button onClick={() => setSelectedTagIds([])} className="text-xs text-neon-400/70 hover:text-neon-300 transition-colors">清除</button>
                </>
              )}
            </div>

            <div className="flex flex-nowrap overflow-x-auto gap-1.5 sm:flex-wrap sm:overflow-visible sm:gap-2 pb-1">
              {displayTagStats.length === 0 ? (
                <span className="text-sm text-gray-400">暂无标签</span>
              ) : (
                displayTagStats.map(s => {
                  const active = selectedTagIds.includes(s.id)
                  return (
                    <div key={`tag-${s.id}`} className="flex items-center gap-1 group">
                      <button
                        onClick={() => tagEditMode ? null : toggleTag(s.id)}
                        className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          active
                            ? 'bg-neon-500/20 text-neon-300 border-neon-500/40'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                        } ${tagEditMode ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {active && <span className="text-neon-300 shrink-0">✓</span>}
                        <span className="truncate"># {s.name}</span>
                        <span className="shrink-0 text-gray-600">{s.count}</span>
                      </button>
                      {tagEditMode && (
                        <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => openTagForm('edit', allTags.find(t => t.id === s.id) || { id: s.id, name: s.name })} className="p-1 rounded hover:bg-white/10 text-accent-400 hover:text-accent-300 transition-colors">
                            <FiEdit2 size={14} />
                          </button>
                          <button onClick={() => handleTagDelete(s.id, s.name)} className="p-1 rounded hover:bg-white/10 text-rose-400 hover:text-rose-300 transition-colors">
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>

      <Modal open={!!editingBookmark} onClose={() => setEditingBookmark(null)} title="编辑书签">
        {editingBookmark && (
          <EditBookmarkForm
            bookmark={editingBookmark}
            categories={categories}
            allTags={allTags}
            onSubmit={handleUpdate}
            onCancel={() => setEditingBookmark(null)}
            onCategoryCreated={(cat) => setCategories(prev => [...prev, cat])}
            onTagCreated={(tag) => setAllTags(prev => [...prev, tag])}
          />
        )}
      </Modal>

      <Modal open={showCreateBookmark} onClose={() => setShowCreateBookmark(false)} title="新增书签">
        <CreateBookmarkForm
          categories={categories}
          allTags={allTags}
          onSubmit={handleCreateBookmark}
          onCancel={() => setShowCreateBookmark(false)}
          onCategoryCreated={(cat) => setCategories(prev => [...prev, cat])}
          onTagCreated={(tag) => setAllTags(prev => [...prev, tag])}
        />
      </Modal>

      <Modal open={batchCategoryModalOpen} onClose={() => setBatchCategoryModalOpen(false)} title="批量更改分类">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">选择目标分类</label>
            <select value={batchCategoryId ?? ''} onChange={e => setBatchCategoryId(e.target.value ? Number(e.target.value) : undefined)} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors">
              <option value="">无分类</option>
              {flattenCategories(categories).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleBatchCategory} disabled={batchActionLoading} className="flex-1 bg-accent-600 hover:bg-accent-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {batchActionLoading ? '处理中...' : `更新 ${selectedIds.size} 个书签`}
            </button>
            <button onClick={() => setBatchCategoryModalOpen(false)} className="px-4 bg-surface-700 hover:bg-surface-600 text-gray-300 rounded-lg py-2 text-sm transition-colors">取消</button>
          </div>
        </div>
      </Modal>

      <Modal open={batchAddTagModalOpen} onClose={() => setBatchAddTagModalOpen(false)} title="批量追加标签">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">选择要追加的标签</label>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(t => (
                <button key={t.id} type="button" onClick={() => setBatchTagIds(prev => prev.includes(t.id) ? prev.filter(v => v !== t.id) : [...prev, t.id])} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${batchTagIds.includes(t.id) ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30' : 'bg-surface-800 text-gray-400 border border-surface-500 hover:border-surface-400'}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleBatchAddTags} disabled={batchActionLoading || batchTagIds.length === 0} className="flex-1 bg-accent-600 hover:bg-accent-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {batchActionLoading ? '处理中...' : `追加到 ${selectedIds.size} 个书签`}
            </button>
            <button onClick={() => setBatchAddTagModalOpen(false)} className="px-4 bg-surface-700 hover:bg-surface-600 text-gray-300 rounded-lg py-2 text-sm transition-colors">取消</button>
          </div>
        </div>
      </Modal>

      <Modal open={batchRemoveTagModalOpen} onClose={() => setBatchRemoveTagModalOpen(false)} title="批量删除标签">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">选择要删除的标签</label>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(t => (
                <button key={t.id} type="button" onClick={() => setBatchTagIds(prev => prev.includes(t.id) ? prev.filter(v => v !== t.id) : [...prev, t.id])} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${batchTagIds.includes(t.id) ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-surface-800 text-gray-400 border border-surface-500 hover:border-surface-400'}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleBatchRemoveTags} disabled={batchActionLoading || batchTagIds.length === 0} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {batchActionLoading ? '处理中...' : `从 ${selectedIds.size} 个书签删除`}
            </button>
            <button onClick={() => setBatchRemoveTagModalOpen(false)} className="px-4 bg-surface-700 hover:bg-surface-600 text-gray-300 rounded-lg py-2 text-sm transition-colors">取消</button>
          </div>
        </div>
      </Modal>

      <Modal open={catFormMode !== null} onClose={() => { setCatFormMode(null); setEditingCategory(null) }} title={editingCategory ? '编辑分类' : '新增分类'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">名称 *</label>
            <input value={catFormName} onChange={e => setCatFormName(e.target.value)} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors" placeholder="分类名称" />
          </div>
          {!editingCategory && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">父分类</label>
              <select value={catFormParentId ?? ''} onChange={e => setCatFormParentId(e.target.value ? Number(e.target.value) : undefined)} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors">
                <option value="">无（顶级分类）</option>
                {flatCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">排序</label>
            <input type="number" value={catFormSort} onChange={e => setCatFormSort(e.target.value)} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors" placeholder="数字越小越靠前" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleCatSubmit} disabled={catFormSubmitting || !catFormName.trim()} className="flex-1 bg-accent-600 hover:bg-accent-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {catFormSubmitting ? '保存中...' : editingCategory ? '更新' : '创建'}
            </button>
            <button onClick={() => { setCatFormMode(null); setEditingCategory(null) }} className="px-4 bg-surface-700 hover:bg-surface-600 text-gray-300 rounded-lg py-2 text-sm transition-colors">取消</button>
          </div>
        </div>
      </Modal>

      <Modal open={tagFormMode !== null} onClose={() => { setTagFormMode(null); setEditingTag(null) }} title={editingTag ? '编辑标签' : '新增标签'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">名称 *</label>
            <input value={tagFormName} onChange={e => setTagFormName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTagSubmit()} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors" placeholder="标签名称" autoFocus />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleTagSubmit} disabled={tagFormSubmitting || !tagFormName.trim()} className="flex-1 bg-accent-600 hover:bg-accent-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {tagFormSubmitting ? '保存中...' : editingTag ? '更新' : '创建'}
            </button>
            <button onClick={() => { setTagFormMode(null); setEditingTag(null) }} className="px-4 bg-surface-700 hover:bg-surface-600 text-gray-300 rounded-lg py-2 text-sm transition-colors">取消</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
