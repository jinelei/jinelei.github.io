import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { FiPlus, FiEdit2, FiTrash2, FiMove, FiFolder } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { useConfirm } from '../components/ConfirmDialog'
import { getCategoryTree, getCategoryStats, createCategory, updateCategory, deleteCategory, mergeCategories } from '../api/categories'
import type { CategoryResponse, CategoryStatsResponse } from '../types'

interface FlatCategory { id: number; name: string; depth: number; label: string; cat: CategoryResponse }

const flatten = (cats: CategoryResponse[], depth = 0): FlatCategory[] =>
  cats.flatMap(c => [
    { id: c.id, name: c.name, depth, label: `${'　'.repeat(depth)}${c.name}`, cat: c },
    ...flatten(c.children, depth + 1),
  ])

const collectIds = (c: CategoryResponse): number[] => [c.id, ...c.children.flatMap(collectIds)]

export default function CategoriesTab() {
  const [confirm, confirmDialog] = useConfirm()
  const [tree, setTree] = useState<CategoryResponse[]>([])
  const [stats, setStats] = useState<CategoryStatsResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryResponse | null>(null)
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState<number | undefined>()
  const [saving, setSaving] = useState(false)
  const [mergeTarget, setMergeTarget] = useState<FlatCategory | null>(null)

  const load = async () => {
    try {
      const [treeRes, statsRes] = await Promise.all([getCategoryTree(), getCategoryStats()])
      setTree(treeRes.data)
      setStats(statsRes.data)
    } catch {
      toast.error('加载分类失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const statsMap = new Map(stats.map(s => [s.id, s.count]))
  const flat = flatten(tree)

  const openCreate = (parent?: CategoryResponse) => {
    setEditing(null)
    setName('')
    setParentId(parent?.id)
    setModalOpen(true)
  }

  const openEdit = (cat: CategoryResponse) => {
    setEditing(cat)
    setName(cat.name)
    setParentId(undefined)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('分类名称不能为空'); return }
    setSaving(true)
    try {
      if (editing) {
        await updateCategory(editing.id, { name: name.trim(), parentId: parentId })
        toast.success('分类已更新')
      } else {
        await createCategory({ name: name.trim(), parentId: parentId })
        toast.success('分类已创建')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat: CategoryResponse) => {
    const descendantCount = collectIds(cat).length - 1
    const count = statsMap.get(cat.id) || 0
    const message =
      `该分类（含子分类）下共 ${count} 个书签将变为「未分类」\n` +
      (descendantCount > 0 ? `其 ${descendantCount} 个子分类将提升为根分类，不会被删除\n` : '') +
      `\n此操作不可撤销。`
    const ok = await confirm({
      title: `删除分类「${cat.name}」`,
      message,
      confirmText: '删除',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteCategory(cat.id)
      toast.success('分类已删除')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result
    if (!destination || source.index === destination.index) return
    const sourceCat = flat[source.index]
    const targetCat = flat[destination.index]
    if (!sourceCat || !targetCat || sourceCat.id === targetCat.id) return
    setMergeTarget(targetCat)
    const count = statsMap.get(sourceCat.id) || 0
    const ok = await confirm({
      title: '合并分类',
      message: `将分类「${sourceCat.name}」合并到「${targetCat.name}」？\n\n该分类及其所有子分类下共 ${count} 个书签会移动到「${targetCat.name}」，分类本身保留（变为空分类）。`,
      confirmText: '合并',
    })
    if (!ok) {
      setMergeTarget(null)
      return
    }
    try {
      const res = await mergeCategories(sourceCat.id, targetCat.id)
      toast.success(`已移动 ${res.data} 个书签到「${targetCat.name}」`)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '合并失败')
    } finally {
      setMergeTarget(null)
    }
  }

  const editableParentOptions = editing
    ? flat.filter(f => f.id !== editing.id && !collectIds(editing).includes(f.id))
    : flat

  return (
    <div>
      {confirmDialog}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500">拖动一个分类到另一个分类上，可把其下全部书签合并过去</p>
        <button onClick={() => openCreate()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold transition-colors">
          <FiPlus size={13} /> 新建分类
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse" />)}
        </div>
      ) : flat.length === 0 ? (
        <div className="text-center py-10 text-xs text-gray-500">暂无分类，点击右上角创建</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="categories">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {flat.map((item, index) => {
                  const cat = item.cat
                  const count = statsMap.get(cat.id) || 0
                  return (
                    <Draggable key={cat.id} draggableId={String(cat.id)} index={index}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          style={{ marginLeft: `${item.depth * 20}px`, ...dragProvided.draggableProps.style }}
                          className={`group flex items-center gap-2 rounded-lg border px-3 py-2 mb-1.5 transition-colors ${
                            snapshot.isDragging ? 'border-accent-500/50 bg-accent-500/10' : 'border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] hover:border-accent-500/30'
                          } ${mergeTarget?.id === cat.id ? 'ring-2 ring-emerald-500/50' : ''}`}
                        >
                          <FiMove size={13} className="text-gray-500 cursor-grab active:cursor-grabbing shrink-0" />
                          <FiFolder size={13} className="text-accent-400 shrink-0" />
                          <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{cat.name}</span>
                          <span className="text-[10px] text-gray-500 shrink-0">{count} 个书签</span>
                          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openCreate(cat)} title="添加子分类"
                              className="p-1.5 rounded text-gray-500 hover:text-accent-400 hover:bg-white/10">
                              <FiPlus size={13} />
                            </button>
                            <button onClick={() => openEdit(cat)} title="编辑"
                              className="p-1.5 rounded text-gray-500 hover:text-accent-400 hover:bg-white/10">
                              <FiEdit2 size={13} />
                            </button>
                            <button onClick={() => handleDelete(cat)} title="删除"
                              className="p-1.5 rounded text-gray-500 hover:text-rose-400 hover:bg-white/10">
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑分类' : '新建分类'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">分类名称 *</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70"
              placeholder="分类名称" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">父分类</label>
            <select value={parentId || ''} onChange={e => setParentId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-surface-800 border border-surface-500 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent-500/70">
              <option value="">（根分类）</option>
              {editableParentOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            {editing && <p className="text-[11px] text-gray-600 mt-1">不能选择自身或其子分类作为父分类</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-accent-600 hover:bg-accent-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? '保存中...' : '保存'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)}
              className="px-4 bg-surface-700 hover:bg-surface-600 text-gray-300 rounded-lg py-2 text-sm transition-colors">
              取消
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
