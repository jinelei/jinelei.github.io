import { useEffect, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { createBookmark, updateBookmark } from '../api/bookmarks'
import { createCategory } from '../api/categories'
import { createTag } from '../api/tags'
import type { BookmarkRequest, BookmarkResponse, CategoryResponse, TagResponse } from '../types'

export function flattenCategories(cats: CategoryResponse[], parentPath: string[] = []): { id: number; label: string }[] {
  return cats.flatMap(c => [
    { id: c.id, label: parentPath.length ? `${parentPath.join(' › ')} › ${c.name}` : c.name },
    ...flattenCategories(c.children, [...parentPath, c.name]),
  ])
}

interface Props {
  open: boolean
  onClose: () => void
  categories: CategoryResponse[]
  allTags: TagResponse[]
  editing: BookmarkResponse | null
  onSaved: () => void
  onMetaChange?: () => void
}

export default function BookmarkEditModal({ open, onClose, categories, allTags, editing, onSaved, onMetaChange }: Props) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(editing?.title || '')
    setUrl(editing?.url || '')
    setDescription(editing?.description || '')
    setCategoryId(editing?.category?.id)
    setNewCategoryName('')
    setCreatingCategory(false)
    setSelectedTagIds((editing?.tags || []).map(t => t.id))
    setNewTagName('')
  }, [open, editing])

  const toggleTag = (id: number) => {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])
  }

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    setCreatingCategory(true)
    try {
      const res = await createCategory({ name })
      const id = (res.data as unknown as { id: number }).id
      setCategoryId(id)
      setNewCategoryName('')
      setCreatingCategory(false)
      await onMetaChange?.()
      toast.success(`分类「${name}」已创建并选中`)
    } catch (err) {
      setCreatingCategory(false)
      toast.error(err instanceof Error ? err.message : '创建分类失败')
    }
  }

  const handleCreateTag = async () => {
    const name = newTagName.trim()
    if (!name) return
    const existing = allTags.find(t => t.name === name)
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) setSelectedTagIds(prev => [...prev, existing.id])
      setNewTagName('')
      toast(`标签「${name}」已存在，已为你选中`)
      return
    }
    try {
      const res = await createTag({ name })
      const id = (res.data as unknown as { id: number }).id
      setSelectedTagIds(prev => [...prev, id])
      setNewTagName('')
      await onMetaChange?.()
      toast.success(`标签「${name}」已创建并选中`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建标签失败')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) {
      toast.error('标题和 URL 不能为空')
      return
    }
    const payload: BookmarkRequest = {
      title: title.trim(),
      url: url.trim(),
      description: description.trim() || undefined,
      categoryId: categoryId || undefined,
      tagIds: selectedTagIds,
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updateBookmark(editing.id, payload)
        toast.success('书签已更新')
      } else {
        await createBookmark(payload)
        toast.success('书签已创建')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const flat = flattenCategories(categories)
  const selectedTagNames = new Set(allTags.filter(t => selectedTagIds.includes(t.id)).map(t => t.name))

  return (
    <Modal open={open} onClose={onClose} title={editing ? '编辑书签' : '新增书签'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">标题 *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70"
            placeholder="书签标题" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">URL *</label>
          <input value={url} onChange={e => setUrl(e.target.value)}
            className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70"
            placeholder="https://..." />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">描述</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70 resize-none h-20"
            placeholder="可选描述" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">分类</label>
          <div className="flex items-center gap-2">
            <select value={categoryId || ''} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70">
              <option value="">无分类</option>
              {flat.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory() } }}
              placeholder="没有合适的分类？输入新分类名后点击创建"
              className="flex-1 bg-surface-800 border border-surface-500 rounded-lg px-3 py-1.5 text-xs text-gray-300 outline-none focus:border-accent-500/70" />
            <button type="button" onClick={handleCreateCategory} disabled={creatingCategory || !newCategoryName.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-gray-300 text-xs transition-colors shrink-0">
              <FiPlus size={12} /> 新建分类
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">标签</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {allTags.length === 0 && <span className="text-xs text-gray-500">暂无标签，可在下方直接输入创建</span>}
            {allTags.map(t => (
              <button key={t.id} type="button" onClick={() => toggleTag(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedTagIds.includes(t.id) ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30' : 'bg-surface-800 text-gray-400 border border-surface-500 hover:border-surface-400'}`}>
                {t.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input value={newTagName} onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTag() } }}
              placeholder="输入新标签名，回车或点击创建并关联"
              className="flex-1 bg-surface-800 border border-surface-500 rounded-lg px-3 py-1.5 text-xs text-gray-300 outline-none focus:border-accent-500/70" />
            <button type="button" onClick={handleCreateTag} disabled={!newTagName.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-gray-300 text-xs transition-colors shrink-0">
              <FiPlus size={12} /> 新建标签
            </button>
          </div>
          {selectedTagNames.size > 0 && (
            <p className="text-[11px] text-gray-600 mt-1.5">已选标签：{[...selectedTagNames].join('、')}</p>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting}
            className="flex-1 bg-accent-600 hover:bg-accent-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
            {submitting ? '保存中...' : '保存'}
          </button>
          <button type="button" onClick={onClose}
            className="px-4 bg-surface-700 hover:bg-surface-600 text-gray-300 rounded-lg py-2 text-sm transition-colors">
            取消
          </button>
        </div>
      </form>
    </Modal>
  )
}
