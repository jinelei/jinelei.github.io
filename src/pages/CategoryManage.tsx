import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiFolder, FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { getCategoryTree, getCategoryStats, createCategory, updateCategory, deleteCategory } from '../api/categories'
import type { CategoryResponse, CategoryRequest } from '../types'
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

function TreeNode({ node, onEdit, onDelete, statsMap, depth = 0 }: {
  node: CategoryResponse
  onEdit: (c: CategoryResponse) => void
  onDelete: (id: number) => void
  statsMap: Map<number, number>
  depth: number
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded((v) => !v)} className="text-gray-500 hover:text-gray-300 transition-colors">
            {expanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-[14px]" />
        )}
        <FiFolder size={14} className="text-purple-400 shrink-0" />
        <span className="text-sm flex-1">{node.name}</span>
        <span className="text-xs text-gray-500">{statsMap.get(node.id) ?? 0}</span>
        <span className="hidden sm:inline text-[10px] text-gray-600">{node.sortOrder ?? '-'}</span>
        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(node)} className="p-1.5 rounded hover:bg-white/10 text-accent-400 hover:text-accent-300 transition-colors">
            <FiEdit2 size={14} />
          </button>
          <button onClick={() => onDelete(node.id)} className="p-1.5 rounded hover:bg-white/10 text-rose-400 hover:text-rose-300 transition-colors">
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} onEdit={onEdit} onDelete={onDelete} statsMap={statsMap} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

interface CategoryFormProps {
  initial?: CategoryResponse
  allCategories: CategoryResponse[]
  onSubmit: (data: CategoryRequest) => Promise<void>
  onCancel: () => void
}

function CategoryForm({ initial, allCategories, onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name || '')
  const [parentId, setParentId] = useState<number | undefined>(initial ? undefined : undefined)
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder?.toString() || '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('名称不能为空'); return }
    setSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), parentId, sortOrder: sortOrder ? Number(sortOrder) : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  const flattenCategories = (cats: CategoryResponse[], depth = 0): { id: number; name: string; depth: number }[] => {
    const result: { id: number; name: string; depth: number }[] = []
    for (const c of cats) {
      if (!initial || c.id !== initial.id) {
        result.push({ id: c.id, name: c.name, depth })
        if (c.children) result.push(...flattenCategories(c.children, depth + 1))
      }
    }
    return result
  }

  const flatCats = flattenCategories(allCategories)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">名称 *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-500 transition-colors" placeholder="分类名称" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">父分类</label>
        <select value={parentId ?? ''} onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : undefined)} className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-500 transition-colors">
          <option value="">无（顶级分类）</option>
          {flatCats.map((c) => (
            <option key={c.id} value={c.id}>{'  '.repeat(c.depth)}{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">排序</label>
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-500 transition-colors" placeholder="数字越小越靠前" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={submitting} className="flex-1 bg-accent-600 hover:bg-accent-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
          {submitting ? '保存中...' : initial ? '更新' : '创建'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 bg-surface-700 hover:bg-surface-600 text-gray-300 rounded-lg py-2 text-sm transition-colors">取消</button>
      </div>
    </form>
  )
}

export default function CategoryManage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [statsMap, setStatsMap] = useState<Map<number, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryResponse | undefined>()

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [treeRes, statsRes] = await Promise.all([getCategoryTree(), getCategoryStats()])
      setCategories(treeRes.data)
      setStatsMap(new Map(statsRes.data.map(s => [s.id, s.count])))
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleCreate = async (data: CategoryRequest) => {
    await createCategory(data)
    toast.success('分类已创建')
    setModalOpen(false)
    fetch()
  }

  const handleUpdate = async (data: CategoryRequest) => {
    if (!editing) return
    await updateCategory(editing.id, data)
    toast.success('分类已更新')
    setModalOpen(false)
    setEditing(undefined)
    fetch()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除此分类？')) return
    await deleteCategory(id)
    toast.success('已删除')
    fetch()
  }

  const openEdit = (c: CategoryResponse) => {
    setEditing(c)
    setModalOpen(true)
  }

  const renderTree = (nodes: CategoryResponse[]) =>
    nodes.map((node) => (
      <TreeNode key={node.id} node={node} onEdit={openEdit} onDelete={handleDelete} statsMap={statsMap} depth={0} />
    ))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 space-y-5">
      {loading ? (
        <div className="glass rounded-xl p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface-600 h-8 rounded animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 && !modalOpen ? (
        <div className="text-center py-16 text-gray-500">
          <div
            onClick={() => { setEditing(undefined); setModalOpen(true) }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-white/10 hover:border-neon-500/40 cursor-pointer text-neon-400 hover:text-neon-300 transition-colors"
          >
            <FiPlus size={15} />
            <span className="text-sm font-medium">新增分类</span>
          </div>
          <p className="text-sm mt-4">暂无分类</p>
        </div>
      ) : categories.length === 0 && modalOpen ? (
        <div className="glass rounded-xl p-4">
          <div className="p-3 rounded-lg bg-surface-800/50 border border-accent-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-accent-400">新增分类</span>
            </div>
            <CategoryForm initial={undefined} allCategories={[]} onSubmit={handleCreate} onCancel={() => { setModalOpen(false); setEditing(undefined) }} />
          </div>
        </div>
      ) : (
        <div className="glass rounded-xl p-4 space-y-1">
          {modalOpen && (
            <div className="p-3 rounded-lg bg-surface-800/50 border border-accent-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-accent-400">{editing ? '编辑分类' : '新增分类'}</span>
              </div>
              <CategoryForm initial={editing} allCategories={categories} onSubmit={editing ? handleUpdate : handleCreate} onCancel={() => { setModalOpen(false); setEditing(undefined) }} />
            </div>
          )}
          {!modalOpen && (
            <div
              onClick={() => { setEditing(undefined); setModalOpen(true) }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-white/10 hover:border-neon-500/40 cursor-pointer text-neon-400 hover:text-neon-300 transition-colors group"
            >
              <FiPlus size={15} />
              <span className="text-sm font-medium">新增分类</span>
            </div>
          )}
          {renderTree(categories)}
        </div>
      )}
    </motion.div>
  )
}
