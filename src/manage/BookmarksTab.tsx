import { useCallback, useEffect, useState } from 'react'
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiExternalLink } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { searchBookmarks, deleteBookmark, batchUpdateBookmarks } from '../api/bookmarks'
import type { BookmarkResponse, CategoryResponse, TagResponse } from '../types'
import BookmarkEditModal, { flattenCategories } from './BookmarkEditModal'
import { useConfirm } from '../components/ConfirmDialog'

const PAGE_SIZE = 50

const DEFAULT_FAVICON = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20d%3D%22M12%202C6.48%202%202%206.48%202%2012s4.48%2010%2010%2010%2010-4.48%2010-10S17.52%202%2012%202zm-1%2017.93c-3.95-.49-7-3.85-7-7.93%200-.62.08-1.21.21-1.79L9%2015v1c0%201.1.9%202%202%202v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55%200%201-.45%201-1V7h2c1.1%200%202-.9%202-2v-.41c2.93%201.19%205%204.06%205%207.41%200%202.08-.8%203.97-2.1%205.39z%22%2F%3E%3C%2Fsvg%3E'

interface Props {
  categories: CategoryResponse[]
  allTags: TagResponse[]
  reloadMeta: () => Promise<void>
}

export default function BookmarksTab({ categories, allTags, reloadMeta }: Props) {
  const [confirm, confirmDialog] = useConfirm()
  const [bookmarks, setBookmarks] = useState<BookmarkResponse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('')
  const [tagFilter, setTagFilter] = useState<number | ''>('')
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BookmarkResponse | null>(null)

  const [batchCategory, setBatchCategory] = useState<number | '' | '__clear__'>('')
  const [batchAddTag, setBatchAddTag] = useState<number | ''>('')
  const [batchRemoveTag, setBatchRemoveTag] = useState<number | ''>('')
  const [batchBusy, setBatchBusy] = useState(false)

  const flatCats = flattenCategories(categories)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, size: PAGE_SIZE }
      if (keyword.trim()) params.keyword = keyword.trim()
      if (categoryFilter !== '') params.categoryIds = [categoryFilter]
      if (tagFilter !== '') params.tagIds = [tagFilter]
      const res = await searchBookmarks(params)
      setBookmarks(res.data.content)
      setTotal(res.data.totalElements)
      setTotalPages(res.data.totalPages)
      setSelected(new Set())
    } catch {
      toast.error('加载书签失败')
    } finally {
      setLoading(false)
    }
  }, [page, keyword, categoryFilter, tagFilter])

  useEffect(() => { load() }, [load])

  const runSearch = () => { setPage(0); load() }

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allOnPageSelected = bookmarks.length > 0 && bookmarks.every(b => selected.has(b.id))
  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        bookmarks.forEach(b => next.delete(b.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        bookmarks.forEach(b => next.add(b.id))
        return next
      })
    }
  }

  const runBatch = async (build: () => Record<string, unknown> | null, successMsg: string) => {
    if (selected.size === 0) { toast.error('请先勾选书签'); return }
    const body = build()
    if (!body) return
    setBatchBusy(true)
    try {
      await batchUpdateBookmarks({ ids: [...selected], ...body })
      toast.success(successMsg)
      setBatchCategory('')
      setBatchAddTag('')
      setBatchRemoveTag('')
      await load()
      await reloadMeta()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setBatchBusy(false)
    }
  }

  const handleDelete = async (b: BookmarkResponse) => {
    const ok = await confirm({
      title: '删除书签',
      message: `确定删除书签「${b.title}」吗？此操作不可撤销。`,
      confirmText: '删除',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteBookmark(b.id)
      toast.success('已删除')
      await load()
      await reloadMeta()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const openEdit = (b: BookmarkResponse) => {
    setEditing(b)
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const inputCls = 'bg-surface-800 border border-surface-500 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 outline-none focus:border-accent-500/70'

  return (
    <div>
      {confirmDialog}
      {/* 筛选工具栏 */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 mb-3">
        <div className="relative col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-[180px]">
          <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runSearch() }}
            placeholder="搜索标题 / URL / 描述"
            className="w-full bg-surface-800 border border-surface-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-300 outline-none focus:border-accent-500/70"
          />
        </div>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value ? Number(e.target.value) : ''); setPage(0) }} className={`${inputCls} w-full sm:w-auto`}>
          <option value="">全部分类</option>
          {flatCats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={tagFilter} onChange={e => { setTagFilter(e.target.value ? Number(e.target.value) : ''); setPage(0) }} className={`${inputCls} w-full sm:w-auto`}>
          <option value="">全部标签</option>
          {allTags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={runSearch} className="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-gray-300 text-xs transition-colors">
          筛选
        </button>
        <button onClick={openCreate}
          className="col-span-2 sm:col-span-1 sm:ml-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold transition-colors">
          <FiPlus size={13} /> 新增书签
        </button>
      </div>

      {/* 批量操作工具栏 */}
      {selected.size > 0 && (
        <div className="grid grid-cols-[1fr_auto] sm:flex sm:flex-wrap items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-accent-500/10 border border-accent-500/20">
          <span className="col-span-2 sm:col-span-1 text-xs text-accent-400 font-medium">已选 {selected.size} 项：</span>
          <select value={batchCategory} onChange={e => {
            const v = e.target.value
            setBatchCategory(v === '__clear__' ? '__clear__' : v ? Number(v) : '')
          }} className={`${inputCls} w-full sm:w-auto`}>
            <option value="">移动到分类…</option>
            <option value="__clear__">（移除分类 / 未分类）</option>
            {flatCats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button disabled={batchBusy}
            onClick={() => runBatch(() => {
              if (batchCategory === '') return null
              return batchCategory === '__clear__'
                ? { clearCategory: true }
                : { categoryId: batchCategory }
            }, '分类已更新')}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors disabled:opacity-50">
            应用分类
          </button>
          <select value={batchAddTag} onChange={e => setBatchAddTag(e.target.value ? Number(e.target.value) : '')} className={`${inputCls} w-full sm:w-auto`}>
            <option value="">追加标签…</option>
            {allTags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button disabled={batchBusy}
            onClick={() => runBatch(() => batchAddTag === '' ? null : { addTagIds: [batchAddTag] }, '标签已追加')}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors disabled:opacity-50">
            追加
          </button>
          <select value={batchRemoveTag} onChange={e => setBatchRemoveTag(e.target.value ? Number(e.target.value) : '')} className={`${inputCls} w-full sm:w-auto`}>
            <option value="">移除标签…</option>
            {allTags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button disabled={batchBusy}
            onClick={() => runBatch(() => batchRemoveTag === '' ? null : { removeTagIds: [batchRemoveTag] }, '标签已移除')}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors disabled:opacity-50">
            移除
          </button>
        </div>
      )}

      {/* 书签表格（桌面端） */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-black/5 dark:border-white/5">
        <table className="w-full text-xs table-fixed">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
              <th className="py-2 px-2 w-8">
                <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} className="accent-accent-500" />
              </th>
              <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">书签</th>
              <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium w-32">分类</th>
              <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium w-40">标签</th>
              <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400 font-medium w-24">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-black/5 dark:border-white/5">
                  <td colSpan={5} className="py-2 px-2"><div className="h-6 bg-black/5 dark:bg-white/5 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : bookmarks.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-gray-500">没有匹配的书签</td></tr>
            ) : (
              bookmarks.map(b => (
                <tr key={b.id} className={`border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] ${selected.has(b.id) ? 'bg-accent-500/5' : ''}`}>
                  <td className="py-2 px-2 text-center">
                    <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)} className="accent-accent-500" />
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={b.faviconUrl || DEFAULT_FAVICON} alt="" className="w-4 h-4 rounded shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate text-gray-800 dark:text-gray-200 font-medium" title={b.title}>{b.title}</div>
                        <a href={b.url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-accent-400 truncate"
                          onClick={e => e.stopPropagation()}>
                          <FiExternalLink size={9} className="shrink-0" />
                          <span className="truncate">{b.url}</span>
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2 truncate text-gray-600 dark:text-gray-400" title={b.category?.name}>
                    {b.category?.name || <span className="text-gray-500">未分类</span>}
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex flex-wrap gap-1">
                      {b.tags.map(t => (
                        <span key={t.id} className="px-1.5 py-0.5 rounded bg-neon-500/10 text-neon-400 text-[10px] whitespace-nowrap">{t.name}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(b)} title="编辑"
                        className="p-1.5 rounded text-gray-500 hover:text-accent-400 hover:bg-white/10">
                        <FiEdit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(b)} title="删除"
                        className="p-1.5 rounded text-gray-500 hover:text-rose-400 hover:bg-white/10">
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 书签卡片列表（移动端） */}
      <div className="sm:hidden space-y-2">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border border-black/5 dark:border-white/5 p-3 animate-pulse">
              <div className="h-4 w-2/3 bg-black/5 dark:bg-white/5 rounded mb-2" />
              <div className="h-3 w-full bg-black/5 dark:bg-white/5 rounded" />
            </div>
          ))
        ) : bookmarks.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-500">没有匹配的书签</div>
        ) : (
          bookmarks.map(b => (
            <div
              key={b.id}
              className={`rounded-lg border p-3 transition-colors ${
                selected.has(b.id)
                  ? 'border-accent-500/40 bg-accent-500/5'
                  : 'border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={selected.has(b.id)}
                  onChange={() => toggleSelect(b.id)}
                  className="accent-accent-500 mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={b.faviconUrl || DEFAULT_FAVICON} alt="" className="w-4 h-4 rounded shrink-0" />
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate" title={b.title}>{b.title}</span>
                  </div>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-accent-400 truncate mt-1"
                  >
                    <FiExternalLink size={9} className="shrink-0" />
                    <span className="truncate">{b.url}</span>
                  </a>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {b.category && (
                      <span className="px-1.5 py-0.5 rounded bg-accent-500/10 text-accent-600 dark:text-accent-400 text-[10px] whitespace-nowrap">
                        {b.category.name}
                      </span>
                    )}
                    {b.tags.map(t => (
                      <span key={t.id} className="px-1.5 py-0.5 rounded bg-neon-500/10 text-neon-400 text-[10px] whitespace-nowrap">
                        #{t.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => openEdit(b)} title="编辑"
                    className="p-2 rounded text-gray-500 hover:text-accent-400 hover:bg-white/10">
                    <FiEdit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(b)} title="删除"
                    className="p-2 rounded text-gray-500 hover:text-rose-400 hover:bg-white/10">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span>共 {total} 个书签</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 0} onClick={() => setPage(p => p - 1)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors">
            上一页
          </button>
          <span>{page + 1} / {Math.max(totalPages, 1)}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors">
            下一页
          </button>
        </div>
      </div>

      <BookmarkEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        allTags={allTags}
        editing={editing}
        onSaved={async () => { await load(); await reloadMeta() }}
        onMetaChange={reloadMeta}
      />
    </div>
  )
}
