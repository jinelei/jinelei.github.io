import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiTag, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi'
import { getAllTags, createTag, updateTag, deleteTag } from '../api/tags'
import type { TagResponse } from '../types'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

export default function TagManage() {
  const [tags, setTags] = useState<TagResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingTag, setEditingTag] = useState<TagResponse | null>(null)
  const [editTagName, setEditTagName] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAllTags()
      setTags(res.data)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleCreate = async () => {
    if (!newTagName.trim()) { toast.error('名称不能为空'); return }
    setCreating(true)
    try {
      await createTag({ name: newTagName.trim() })
      toast.success('标签已创建')
      setNewTagName('')
      setShowForm(false)
      fetch()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async () => {
    if (!editingTag) return
    if (!editTagName.trim()) { toast.error('名称不能为空'); return }
    setUpdating(true)
    try {
      await updateTag(editingTag.id, { name: editTagName.trim() })
      toast.success('标签已更新')
      setEditingTag(null)
      setEditTagName('')
      fetch()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确认删除标签「${name}」？`)) return
    try {
      await deleteTag(id)
      toast.success('已删除')
      fetch()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const cancelEdit = () => {
    setEditingTag(null)
    setEditTagName('')
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 space-y-5">
      {loading ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface-600 h-8 w-20 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : tags.length === 0 && !showForm ? (
        <div className="text-center py-16 text-gray-500">
          <div
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-white/10 hover:border-neon-500/40 cursor-pointer text-neon-400 hover:text-neon-300 transition-colors"
          >
            <FiPlus size={15} />
            <span className="text-sm font-medium">新增标签</span>
          </div>
          <p className="text-sm mt-4">暂无标签</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {!showForm ? (
            <div
              onClick={() => setShowForm(true)}
              className="glass rounded-lg px-3.5 py-2 flex items-center gap-2 border-2 border-dashed border-white/10 hover:border-neon-500/40 cursor-pointer text-neon-400 hover:text-neon-300 transition-colors"
            >
              <FiPlus size={14} />
              <span className="text-sm font-medium">新增标签</span>
            </div>
          ) : (
            <div className="glass rounded-lg px-3.5 py-2 flex items-center gap-2 border border-accent-500/40">
              <input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="w-28 bg-transparent text-sm outline-none text-gray-200 placeholder-gray-600"
                placeholder="标签名称"
                autoFocus
              />
              <button onClick={handleCreate} disabled={creating} className="text-accent-400 hover:text-accent-300 transition-colors">
                <FiCheck size={15} />
              </button>
              <button onClick={() => { setShowForm(false); setNewTagName('') }} className="text-gray-500 hover:text-gray-300 transition-colors">
                <FiX size={15} />
              </button>
            </div>
          )}
          {tags.map((t) => (
            editingTag?.id === t.id ? (
              <div key={t.id} className="glass rounded-lg px-3.5 py-2 flex items-center gap-2 border border-accent-500/40">
                <input
                  value={editTagName}
                  onChange={(e) => setEditTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                  className="w-28 bg-transparent text-sm outline-none text-gray-200 placeholder-gray-600"
                  autoFocus
                />
                <button onClick={handleEdit} disabled={updating} className="text-accent-400 hover:text-accent-300 transition-colors">
                  <FiCheck size={15} />
                </button>
                <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-300 transition-colors">
                  <FiX size={15} />
                </button>
              </div>
            ) : (
              <motion.div
                key={t.id}
                variants={container}
                className="glass rounded-lg px-3.5 py-2 flex items-center gap-2 group hover:border-white/10 transition-colors"
              >
                <FiTag size={13} className="text-accent-400 shrink-0" />
                <span className="text-sm">{t.name}</span>
                <button onClick={() => { setEditingTag(t); setEditTagName(t.name) }} className="text-accent-400 hover:text-accent-300 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <FiEdit2 size={13} />
                </button>
                <button onClick={() => handleDelete(t.id, t.name)} className="text-rose-400 hover:text-rose-300 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <FiTrash2 size={13} />
                </button>
              </motion.div>
            )
          ))}
        </div>
      )}
    </motion.div>
  )
}
