import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FiSearch, FiExternalLink,
  FiTrash2, FiEdit2, FiX, FiPaperclip, FiPlus,
} from 'react-icons/fi'
import { searchBookmarks, createBookmark, updateBookmark, deleteBookmark, togglePin, recordClick } from '../api/bookmarks'
import { getCategoryTree, createCategory } from '../api/categories'
import { getAllTags, createTag } from '../api/tags'
import type { BookmarkResponse, CategoryResponse, TagResponse, BookmarkSearchParams, BookmarkRequest } from '../types'
import Modal from '../components/Modal'
import BookmarkView, { type ViewMode } from '../components/BookmarkView'

function flattenCategories(
  cats: CategoryResponse[],
  parentPath: string[] = [],
): { id: number; name: string; label: string }[] {
  return cats.flatMap(c => [
    { id: c.id, name: c.name, label: parentPath.length > 0 ? `${parentPath.join(' › ')} › ${c.name}` : c.name },
    ...flattenCategories(c.children, [...parentPath, c.name]),
  ])
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

interface BookmarkFormProps {
  initial?: BookmarkResponse
  categories: CategoryResponse[]
  tags: TagResponse[]
  onSubmit: (data: BookmarkRequest) => Promise<void>
  onCancel: () => void
  onCategoryCreated?: (cat: CategoryResponse) => void
  onTagCreated?: (tag: TagResponse) => void
}

function BookmarkForm({ initial, categories, tags, onSubmit, onCancel, onCategoryCreated, onTagCreated }: BookmarkFormProps) {
  const [title, setTitle] = useState(initial?.title || '')
  const [url, setUrl] = useState(initial?.url || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [categoryId, setCategoryId] = useState<number | undefined>(initial?.category?.id)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(initial?.tags.map((t) => t.id) || [])
  const [submitting, setSubmitting] = useState(false)

  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)
  const [showNewTag, setShowNewTag] = useState(false)

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

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id])
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 mb-1 block">标题 *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors" placeholder="书签标题" />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">URL *</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors" placeholder="https://..." />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">描述</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors resize-none h-20" placeholder="可选描述" />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">分类</label>
        <div className="flex gap-2">
          <select value={categoryId || ''} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)} className="flex-1 bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors">
            <option value="">无分类</option>
            {flattenCategories(categories).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
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
          {tags.map((t) => (
            <button key={t.id} type="button" onClick={() => toggleTag(t.id)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedTagIds.includes(t.id) ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30' : 'bg-surface-800 text-gray-400 border border-surface-500 hover:border-surface-400'}`}>
              {t.name}
            </button>
          ))}
          <button type="button" onClick={() => { setShowNewTag(!showNewTag); setNewTagName('') }} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs leading-none font-medium transition-all border border-dashed border-surface-500 text-neon-400 hover:text-neon-300 hover:border-neon-500/50 ${showNewTag ? 'border-neon-500/50 text-neon-400' : ''}`}>
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
          {submitting ? '保存中...' : initial ? '更新' : '创建'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 bg-surface-700 hover:bg-surface-600 text-gray-300 rounded-lg py-2 text-sm transition-colors">
          取消
        </button>
      </div>
    </form>
  )
}

export default function BookmarkManage() {
  const [bookmarks, setBookmarks] = useState<BookmarkResponse[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(() => {
    return Number(localStorage.getItem('bookmarksPageSize')) || 20
  })
  const pageSizeRef = useRef(pageSize)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [tags, setTags] = useState<TagResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterCategory, setFilterCategory] = useState<number | undefined>()
  const [filterPinned, setFilterPinned] = useState<boolean | undefined>()
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('bookmarkView') as ViewMode) || 'grid'
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BookmarkResponse | undefined>()

  const fetch = useCallback(async (params: BookmarkSearchParams = {}) => {
    setLoading(true)
    try {
      const res = await searchBookmarks({ page: 0, size: pageSizeRef.current, ...params })
      setBookmarks(res.data.content)
      setTotalPages(res.data.totalPages)
      setTotalElements(res.data.totalElements)
      setCurrentPage(res.data.currentPage)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePageSizeChange = (newSize: number) => {
    pageSizeRef.current = newSize
    setPageSize(newSize)
    localStorage.setItem('bookmarksPageSize', String(newSize))
    setCurrentPage(0)
    fetch(buildParams({ page: 0, size: newSize }))
  }

  const fetchDeps = useCallback(async () => {
    const [cRes, tRes] = await Promise.all([getCategoryTree(), getAllTags()])
    setCategories(cRes.data)
    setTags(tRes.data)
  }, [])

  useEffect(() => {
    fetch()
    fetchDeps()
  }, [fetch, fetchDeps])

  const buildParams = (overrides: Record<string, unknown> = {}) => ({
    keyword: searchKeyword || undefined,
    categoryIds: filterCategory !== undefined ? [filterCategory] : undefined,
    pinned: filterPinned,
    ...overrides,
  })

  const doSearch = () => {
    setCurrentPage(0)
    fetch(buildParams({ page: 0 }))
  }

  const goPage = (page: number) => {
    setCurrentPage(page)
    fetch(buildParams({ page }))
  }

  const handleCreate = async (data: BookmarkRequest) => {
    await createBookmark(data)
    toast.success('书签已创建')
    setModalOpen(false)
    fetch(buildParams({ page: currentPage }))
  }

  const handleUpdate = async (data: BookmarkRequest) => {
    if (!editing) return
    await updateBookmark(editing.id, data)
    toast.success('书签已更新')
    setModalOpen(false)
    setEditing(undefined)
    fetch(buildParams({ page: currentPage }))
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除此书签？')) return
    await deleteBookmark(id)
    toast.success('已删除')
    fetch(buildParams({ page: currentPage }))
  }

  const handlePin = async (id: number) => {
    await togglePin(id)
    fetch(buildParams({ page: currentPage }))
  }

  const handleClick = async (id: number) => {
    try {
      const res = await recordClick(id)
      setBookmarks((prev) => prev.map((b) => b.id === id ? { ...b, clickCount: res.data.clickCount } : b))
    } catch {
      // silently ignore — the DB still records the click
    }
  }

  const openEdit = (b: BookmarkResponse) => {
    setEditing(b)
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditing(undefined)
    setModalOpen(true)
  }

  const handleCategoryCreated = useCallback((cat: CategoryResponse) => {
    setCategories((prev) => [...prev, cat])
  }, [])

  const handleTagCreated = useCallback((tag: TagResponse) => {
    setTags((prev) => [...prev, tag])
  }, [])

  const clearFilters = () => {
    setSearchKeyword('')
    setFilterCategory(undefined)
    setFilterPinned(undefined)
    fetch()
  }

  const hasFilters = searchKeyword || filterCategory !== undefined || filterPinned !== undefined

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 space-y-5">
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-end">
          <div className="flex-1 min-w-0 relative">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              className="w-full bg-surface-800 border border-surface-500 rounded-lg pl-9 pr-3 py-2.5 sm:py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors"
              placeholder="搜索标题、URL、描述..."
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <select
              value={filterCategory ?? ''}
              onChange={(e) => setFilterCategory(e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 sm:flex-none bg-surface-800 border border-surface-500 rounded-lg px-3 py-2.5 sm:py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors min-w-0 sm:min-w-[120px]"
            >
              <option value="">全部分类</option>
              {flattenCategories(categories).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select
              value={filterPinned === undefined ? '' : filterPinned ? 'true' : 'false'}
              onChange={(e) => setFilterPinned(e.target.value === '' ? undefined : e.target.value === 'true')}
              className="flex-1 sm:flex-none bg-surface-800 border border-surface-500 rounded-lg px-3 py-2.5 sm:py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 transition-colors min-w-0 sm:min-w-[100px]"
            >
              <option value="">全部状态</option>
              <option value="true">已置顶</option>
              <option value="false">未置顶</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={doSearch} className="flex-1 sm:flex-none bg-accent-600 hover:bg-accent-500 text-white px-5 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors">
              搜索
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-sm transition-colors px-3 py-2.5 sm:py-2">
                <FiX size={14} /> 清除
              </button>
            )}
          </div>
        </div>
      </div>

      <BookmarkView
        bookmarks={bookmarks}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        loading={loading}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={goPage}
        onPin={handlePin}
        onClick={handleClick}
        storageKey="bookmarkView"
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        onAdd={openCreate}
        totalElements={totalElements}
        emptyMessage={hasFilters ? '暂无书签，请调整筛选条件' : '暂无书签'}
        renderActions={(b) => (
          <>
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick(b.id)}
              className="p-1.5 rounded hover:bg-white/10 text-accent-400 hover:text-accent-300 transition-colors"
              title="打开"
            >
              <FiExternalLink size={13} />
            </a>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePin(b.id) }}
              className={`p-1.5 rounded hover:bg-white/10 transition-colors ${b.pinned ? 'text-rose-400' : 'text-gray-500 hover:text-rose-400'}`}
              title={b.pinned ? '取消置顶' : '置顶'}
            >
              <FiPaperclip size={13} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(b) }}
              className="p-1.5 rounded hover:bg-white/10 text-accent-400 hover:text-accent-300 transition-colors"
              title="编辑"
            >
              <FiEdit2 size={15} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(b.id) }}
              className="p-1.5 rounded hover:bg-white/10 text-rose-400 hover:text-rose-300 transition-colors"
              title="删除"
            >
              <FiTrash2 size={15} />
            </button>
          </>
        )}
      />

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(undefined) }} title={editing ? '编辑书签' : '新增书签'}>
        <BookmarkForm
          initial={editing}
          categories={categories}
          tags={tags}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => { setModalOpen(false); setEditing(undefined) }}
          onCategoryCreated={handleCategoryCreated}
          onTagCreated={handleTagCreated}
        />
      </Modal>
    </motion.div>
  )
}
